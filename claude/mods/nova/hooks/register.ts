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
  toolDescriptionReminders?: Readonly<Record<string, string>>
  windowsToolDescriptionReminders?: Readonly<Record<string, string>>
  agentRules?: string
  skillReminder?: {
    file: string
    editTools: readonly string[]
    filePattern: string
  }
  emptyTurnNudge?: {
    pattern: string
    file: string
  }
  backgroundReminder?: string
  largeContextReminder?: {
    file: string
    tools: readonly string[]
    minTokens: number
  }
  narrationReminder?: {
    file: string
    closingTools: readonly string[]
    limit: number
  }
}

type LoopState = {
  skillReminded: boolean
  narrated: boolean
  narrationReminders: number
}

const WINDOWS_PATH = /^[A-Za-z]:[\\/]/
const ACTIVE_AGENT_STATUSES: readonly string[] = ['pending', 'running', 'waiting']
const FINISHED_TASK = /<task-id>([^<]+)<\/task-id>[\s\S]*?<status>(?:completed|failed|killed|stopped)<\/status>/g

function getLoopState(states: Map<string | undefined, LoopState>, agentId: string | undefined): LoopState {
  let state = states.get(agentId)
  if (!state) {
    state = { skillReminded: false, narrated: false, narrationReminders: 0 }
    states.set(agentId, state)
  }
  return state
}

function textOf(content: readonly unknown[]): string {
  return content.map(block => stringField(block, 'text') ?? '').join('\n')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringField(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) return undefined
  const field = value[key]
  return typeof field === 'string' ? field : undefined
}

async function skillLoaded($: CoreEngineInterface, skillAgents: ReadonlySet<string | undefined>, agentId: string | undefined): Promise<boolean> {
  if (skillAgents.has(agentId)) return true
  if (agentId !== undefined) return false
  const messages = await $.session.messages()
  return messages.some(message => message.toolUses.some(use => use.tool === 'Skill'))
}

async function backgroundWorkRunning($: CoreEngineInterface, backgroundCommands: ReadonlySet<string>): Promise<boolean> {
  if (backgroundCommands.size > 0) return true
  const agents = await $.agent.list()
  return agents.some(agent => agent.parentId === undefined && ACTIVE_AGENT_STATUSES.includes(agent.status))
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
  const backgroundCommands = new Set<string>()
  let discoveryAvailable = false
  let windowsHost = false

  on('turn.start', async ($, event, next) => {
    loopStates.delete(event.agentId)
    return next(event)
  })

  on('agent.spawn', async ($, event, next) => {
    const config = await (configuration ??= readConfiguration($))
    if (!config.agentRules || event.fork || event.resume) return next(event)
    const rules = await readReminder($, config.agentRules, reminderFiles)
    return next({ ...event, prompt: `${event.prompt.trimEnd()}\n\n${rules.trimEnd()}` })
  })

  on('turn.step', async function* ($, event, next) {
    const result = yield* next(event)
    if (event.agentId !== undefined) return result
    const config = await (configuration ??= readConfiguration($))
    const narration = config.narrationReminder
    if (narration && result.answer.trim() && result.toolUses.some(use => !narration.closingTools.includes(use.name))) {
      getLoopState(loopStates, undefined).narrated = true
    }
    return result
  })

  on('session.append', async ($, event, next) => {
    const content = event.message.content
    for (const match of textOf(content).matchAll(FINISHED_TASK)) backgroundCommands.delete(match[1]!)
    const config = await (configuration ??= readConfiguration($))
    const nudge = config.emptyTurnNudge
    if (!nudge || event.agentId !== undefined || event.message.type !== 'user' || !event.message.isMeta ||
      !new RegExp(nudge.pattern).test(textOf(content)) || !await backgroundWorkRunning($, backgroundCommands)) return next(event)
    const text = await readReminder($, nudge.file, reminderFiles)
    return next({ ...event, message: { ...event.message, content: [{ type: 'text', text: text.trimEnd() }] } })
  })

  on('tool.call', async ($, event, next) => {
    const config = await (configuration ??= readConfiguration($))
    const state = getLoopState(loopStates, event.agentId)
    const result = await next(event)
    if (result.deny !== undefined || loopStates.get(event.agentId) !== state) return result
    const paths: string[] = []
    if (event.tool === 'Skill' && !result.isError) skillAgents.add(event.agentId)
    const backgroundTask = !result.isError ? stringField(result.result, 'backgroundTaskId') : undefined
    if (backgroundTask) backgroundCommands.add(backgroundTask)
    if (backgroundTask && event.agentId === undefined && config.backgroundReminder) paths.push(config.backgroundReminder)
    const large = config.largeContextReminder
    if (large && event.agentId === undefined && !result.isError && large.tools.includes(event.tool) &&
      ((await $.session.usage()).context.tokens ?? 0) >= large.minTokens) paths.push(large.file)
    const stoppedTask = event.tool === 'TaskStop' ? stringField(event, 'task_id') : undefined
    if (stoppedTask) backgroundCommands.delete(stoppedTask)
    const filePath = stringField(event, 'file_path')
    const skill = config.skillReminder
    if (skill && filePath && !result.isError && !result.isReadOnly && !state.skillReminded && skill.editTools.includes(event.tool) &&
      new RegExp(skill.filePattern, 'i').test(filePath) && !await skillLoaded($, skillAgents, event.agentId)) {
      state.skillReminded = true
      paths.push(skill.file)
    }
    const narration = config.narrationReminder
    if (narration && state.narrated && event.agentId === undefined) {
      state.narrated = false
      if (state.narrationReminders < narration.limit) {
        state.narrationReminders += 1
        paths.push(narration.file)
      }
    }
    if (!paths.length) return result
    const reminders: string[] = []
    for (const file of new Set(paths)) reminders.push(await readReminder($, file, reminderFiles))
    if (loopStates.get(event.agentId) !== state) return result
    return { ...result, context: [...(result.context ?? []), ...reminders] }
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
    const reminder = config.toolDescriptionReminders?.[event.tool] ??
      (windowsHost ? config.windowsToolDescriptionReminders?.[event.tool] : undefined)
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
    return {
      ...result,
      blocks: result.blocks.map(block => ({
        ...block,
        text: removeInstructions(block.text, config.removedContextPatterns?.[block.name] ?? []),
      })),
    }
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
    if (text !== result.text && !text.trim()) return { ...result, text: null }
    const reminder = config.attachmentReminders?.[event.type]
    return {
      ...result,
      text: reminder && event.origin.kind === 'engine' && new RegExp(reminder.pattern).test(text)
        ? await readReminder($, reminder.file, reminderFiles)
        : text,
    }
  })
}
