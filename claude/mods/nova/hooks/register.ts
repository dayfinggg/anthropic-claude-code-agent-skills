import type { CoreEngineInterface, Register } from 'claude-code'

type Configuration = {
  discoveryTool: string
  promptSectionFiles: Readonly<Record<string, string>>
  upfrontTools: readonly string[]
  deferredTools: readonly string[]
  deferredPrefixes: readonly string[]
  windowsDeferredTools?: readonly string[]
  removedPromptSections: readonly string[]
  removedInstructionPatterns: readonly string[]
  removedAttachmentPatterns: Readonly<Record<string, readonly string[]>>
  removedContextPatterns?: Readonly<Record<string, readonly string[]>>
  attachmentReminders?: Readonly<Record<string, { pattern: string, file: string }>>
  toolReminders?: Readonly<Record<string, string>>
  toolReminderLimit?: number
  toolDescriptionReminders?: Readonly<Record<string, string>>
  contextReminders?: Readonly<Record<string, string>>
  workflowReminders?: {
    file: string
    planTools: readonly string[]
    minCallsBetween: number
    longCallMs: number
    longCallLimit: number
  }
  skillReminder?: {
    file: string
    editTools: readonly string[]
    codeFilePattern: string
  }
  temporaryFileCheck?: {
    file: string
    pathPatterns: readonly string[]
  }
  emptyTurnNudge?: {
    pattern: string
    reason: string
  }
}

type LoopState = {
  edits: number
  calls: number
  longReminders: number
  lastReminderCall?: number
  skillReminded: boolean
  temporaryFiles: Set<string>
}

const WINDOWS_PATH = /^[A-Za-z]:[\\/]/

function getLoopState(states: Map<string | undefined, LoopState>, agentId: string | undefined): LoopState {
  let state = states.get(agentId)
  if (!state) {
    state = { edits: 0, calls: 0, longReminders: 0, skillReminded: false, temporaryFiles: new Set() }
    states.set(agentId, state)
  }
  return state
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringField(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) return undefined
  const field = value[key]
  return typeof field === 'string' ? field : undefined
}

function isTemporaryPath(path: string, patterns: readonly string[]): boolean {
  const normalized = path.replace(/\\/g, '/')
  return patterns.some(pattern => new RegExp(pattern, 'i').test(normalized))
}

function isPlanTransition(result: unknown): boolean {
  if (!isRecord(result)) return false
  if (isRecord(result.statusChange)) {
    return result.success === true && typeof result.statusChange.from === 'string' &&
      typeof result.statusChange.to === 'string' && result.statusChange.from !== result.statusChange.to
  }
  if (!Array.isArray(result.oldTodos) || !Array.isArray(result.newTodos)) return false
  const statuses = new Map(result.oldTodos.filter(isRecord).map(todo => [todo.content, todo.status]))
  return result.newTodos.some(todo => isRecord(todo) && typeof todo.content === 'string' &&
    typeof todo.status === 'string' && statuses.get(todo.content) !== todo.status)
}

function isPlanAdvance(input: unknown): boolean {
  if (!isRecord(input)) return false
  return input.advance === true || (Array.isArray(input.done) && input.done.length > 0) || typeof input.start === 'number'
}

function readConfiguration($: CoreEngineInterface): Promise<Configuration> {
  return $.fs.read(`${$.plugin.root}/config.json`).then(text => JSON.parse(text) as Configuration)
}

async function readPromptSections($: CoreEngineInterface, files: Readonly<Record<string, string>>): Promise<Map<string, string>> {
  const sections = new Map<string, string>()
  for (const [id, path] of Object.entries(files)) {
    sections.set(id, await $.fs.read(`${$.plugin.root}/${path}`))
  }
  return sections
}

function readReminder($: CoreEngineInterface, path: string, files: Map<string, Promise<string>>): Promise<string> {
  let text = files.get(path)
  if (!text) {
    text = $.fs.read(`${$.plugin.root}/${path}`)
    files.set(path, text)
  }
  return text
}

export const register: Register = on => {
  let configuration: Promise<Configuration> | undefined
  let promptSections: Promise<Map<string, string>> | undefined
  const reminderFiles = new Map<string, Promise<string>>()
  const loopStates = new Map<string | undefined, LoopState>()
  const removeInstructions = (text: string, patterns: readonly string[]) => patterns.reduce((result, pattern) => result.replace(new RegExp(pattern, 'g'), ''), text)
  const skillAgents = new Set<string | undefined>()
  let discoveryAvailable = false
  let windowsHost = false
  let backgroundRunning = false

  on('turn.start', async ($, event, next) => {
    loopStates.delete(event.agentId)
    if (event.agentId === undefined) backgroundRunning = false
    return next(event)
  })

  on('prompt.submit', async ($, event, next) => {
    const config = await (configuration ??= readConfiguration($))
    const nudge = config.emptyTurnNudge
    if (nudge && backgroundRunning && event.isMeta && new RegExp(nudge.pattern).test(event.text)) return { drop: nudge.reason }
    return next(event)
  })

  on('tool.call', async ($, event, next) => {
    const config = await (configuration ??= readConfiguration($))
    const state = getLoopState(loopStates, event.agentId)
    const workflow = config.workflowReminders
    const startedAt = workflow && workflow.longCallMs > 0 ? await $.clock.now() : undefined
    const result = await next(event)
    if (result.deny !== undefined || loopStates.get(event.agentId) !== state) return result
    const elapsed = startedAt === undefined ? 0 : await $.clock.now() - startedAt
    const call = ++state.calls
    const paths: string[] = []
    const path = config.toolReminders?.[event.tool]
    if (path && state.edits < (config.toolReminderLimit ?? 0) && !result.isError && !result.isReadOnly) {
      state.edits += 1
      paths.push(path)
    }
    if (event.tool === 'Skill' && !result.isError) skillAgents.add(event.agentId)
    const filePath = stringField(event, 'file_path')
    const succeeded = !result.isError && !result.isReadOnly
    const skill = config.skillReminder
    if (skill && filePath && succeeded && !state.skillReminded && !skillAgents.has(event.agentId) &&
      skill.editTools.includes(event.tool) && new RegExp(skill.codeFilePattern, 'i').test(filePath)) {
      state.skillReminded = true
      paths.push(skill.file)
    }
    const cleanup = config.temporaryFileCheck
    if (cleanup && filePath && succeeded && event.tool === 'Write' && stringField(result.result, 'type') === 'create' &&
      isTemporaryPath(filePath, cleanup.pathPatterns)) {
      state.temporaryFiles.add(filePath)
    }
    if (workflow) {
      const transition = !result.isError && workflow.planTools.includes(event.tool) &&
        (isPlanTransition(result.result) || isPlanAdvance(event))
      const longCall = startedAt !== undefined && elapsed >= workflow.longCallMs && state.longReminders < workflow.longCallLimit
      const spaced = state.lastReminderCall === undefined || call - state.lastReminderCall >= workflow.minCallsBetween
      if ((transition && spaced) || longCall) {
        state.lastReminderCall = call
        if (!transition) state.longReminders += 1
        paths.push(workflow.file)
      }
    }
    if (!paths.length) return result
    const reminders: string[] = []
    for (const file of new Set(paths)) reminders.push(await readReminder($, file, reminderFiles))
    if (loopStates.get(event.agentId) !== state) return result
    return { ...result, context: [...(result.context ?? []), ...reminders] }
  })

  on('classic.Stop', async ($, event, next) => {
    const config = await (configuration ??= readConfiguration($))
    const result = await next(event)
    backgroundRunning = (event.background_tasks?.length ?? 0) > 0
    const check = config.temporaryFileCheck
    const state = loopStates.get(undefined)
    if (!check || !state || result.block !== undefined || event.stop_hook_active || event.background_tasks?.length) return result
    const remaining: string[] = []
    for (const path of state.temporaryFiles) {
      if (await $.fs.exists(path)) remaining.push(path)
    }
    if (!remaining.length) return result
    const reminder = await readReminder($, check.file, reminderFiles)
    return { ...result, block: `${reminder.trimEnd()}\n${remaining.join('\n')}` }
  })

  on('session.start', async ($, event, next) => {
    const config = await (configuration ??= readConfiguration($))
    windowsHost = WINDOWS_PATH.test(event.cwd)
    discoveryAvailable = (await $.tool.list()).some(tool => tool.name === config.discoveryTool)
    $.ui.invalidate('tool.describe')
    return next(event)
  })

  on('tool.describe', async ($, event, next) => {
    const config = await (configuration ??= readConfiguration($))
    const result = await next(event)
    let description = removeInstructions(result.description, config.removedInstructionPatterns)
    const reminder = config.toolDescriptionReminders?.[event.tool]
    if (reminder) description += `\n\n${await readReminder($, reminder, reminderFiles)}`
    if (config.upfrontTools.includes(event.tool)) return { ...result, description, isDeferred: false }
    const defer = discoveryAvailable && event.tool !== config.discoveryTool && (
      config.deferredTools.includes(event.tool) ||
      config.deferredPrefixes.some(prefix => event.tool.startsWith(prefix)) ||
      (windowsHost && (config.windowsDeferredTools?.includes(event.tool) ?? false))
    )
    return defer ? { ...result, description, isDeferred: true } : { ...result, description }
  })

  on('prompt.context', async ($, event, next) => {
    const config = await (configuration ??= readConfiguration($))
    const result = await next(event)
    let blocks = result.blocks.map(block => ({
      ...block,
      text: removeInstructions(block.text, config.removedContextPatterns?.[block.name] ?? []),
    }))
    for (const [key, file] of Object.entries(config.contextReminders ?? {})) {
      const name = `${$.plugin.name}:${key}`
      blocks = blocks.filter(block => block.name !== name)
      blocks.push({ name, text: await readReminder($, file, reminderFiles) })
    }
    return { ...result, blocks }
  })

  on('prompt.compose', async ($, event, next) => {
    const config = await (configuration ??= readConfiguration($))
    const result = await next(event)
    const replacements = await (promptSections ??= readPromptSections($, config.promptSectionFiles))
    const sections = result.sections
      .filter(section => !config.removedPromptSections.includes(section.id))
      .map(section => ({
        ...section,
        text: replacements.get(section.id) ?? removeInstructions(section.text, config.removedInstructionPatterns),
      }))
    for (const [id, text] of replacements) {
      if (!sections.some(section => section.id === id)) {
        sections.push({ id: `${$.plugin.name}:${id}`, text, scope: 'session' })
      }
    }
    return { ...result, sections }
  })

  on('prompt.attachment', async ($, event, next) => {
    const config = await (configuration ??= readConfiguration($))
    const result = await next(event)
    if (result.text === null) return result
    const patterns = config.removedAttachmentPatterns[event.type]
    const text = patterns ? removeInstructions(result.text, patterns) : result.text
    const reminder = config.attachmentReminders?.[event.type]
    return {
      ...result,
      text: reminder && event.origin.kind === 'engine' && new RegExp(reminder.pattern).test(text)
        ? await readReminder($, reminder.file, reminderFiles)
        : text,
    }
  })
}
