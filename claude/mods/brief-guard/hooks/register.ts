import type { EngineInterface, PromptComposeSection, Register } from 'claude-code'
import type { TurnMarks } from '../types'

const DROPPED_SECTIONS = ['tone']
const DROPPED_REMINDERS = ['auto_mode', 'silent_turn_reminder', 'task_reminder', 'todo_reminder']
const MCP_INSTRUCTIONS = 'mcp_instructions_delta'
const STATUS_LINE_REQUEST = /they['’]re likely watching it fill[^)]*\);\s*/g

const PERSON_TOOLS = ['AskUserQuestion', 'EnterPlanMode', 'ExitPlanMode']
const REQUEST_EXCERPT_LENGTH = 160
const USER_ORIGINS: string[] = ['composer', 'bridge', 'sdk', 'unclassified']
const NOTIFICATION_ORIGIN = 'task-notification'
const EMPTY_REPLY_NUDGE = '[Your previous response had no visible output'

const TURN = { plugin: 'brief-guard', key: 'turn' } as const
const FRESH_TURN: TurnMarks = { request: '', silenceAllowed: false }

const readTurn = async ($: EngineInterface): Promise<TurnMarks> => ({ ...FRESH_TURN, ...(await $.state.get(TURN)).value })

const markTurn = async ($: EngineInterface, marks: Partial<TurnMarks>) => {
  const current = await readTurn($)
  const next = { ...current, ...marks }
  if (Object.entries(marks).some(([key, value]) => current[key as keyof TurnMarks] !== value)) await $.state.set(TURN, next)
}

const nonEmptyLines = (text: string) => text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

const typedTextOf = (text: string) =>
  text
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<([A-Za-z][\w-]*)\b[^>]*>[\s\S]*?<\/\1\b[^>]*>/g, ' ')
    .split(/\r?\n/)
    .filter(line => !line.trimStart().startsWith('>'))
    .join('\n')

const excerptOf = (text: string) =>
  typedTextOf(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, REQUEST_EXCERPT_LENGTH)

const SHELL_TOOLS = ['Bash', 'PowerShell']
const FILE_READERS = ['cat', 'head', 'tail', 'less', 'more', 'Get-Content', 'gc', 'type']
const FILE_WRITERS = ['Set-Content', 'Add-Content', 'Out-File', 'tee']
const SCRIPT_RUNNERS = /^(python3?|node|perl|ruby|php)$/
const LOG_FILES = /\.(jsonl|log)\b/i
const SOURCES_REMINDER = /\n*REMINDER: You MUST include the sources above[^\n]*/g

const stripSourcesReminder = (text: string) => text.replace(SOURCES_REMINDER, '').trimEnd()

type ContentBlock = { type: string; [field: string]: unknown }

const withoutSourcesReminder = (block: ContentBlock): ContentBlock => {
  if (block.type !== 'tool_result') return block
  const content = block.content
  if (typeof content === 'string') return { ...block, content: stripSourcesReminder(content) }
  if (!Array.isArray(content)) return block
  const parts = content.map(part => (typeof part === 'object' && part !== null && (part as { type?: unknown }).type === 'text' && typeof (part as { text?: unknown }).text === 'string' ? { ...part, text: stripSourcesReminder((part as { text: string }).text) } : part))
  return { ...block, content: parts }
}

const hasOperand = (words: string[]) => words.slice(1).some(w => !w.startsWith('-') && !/^\d+$/.test(w))

const programOf = (stage: string): string | undefined => {
  const words = stage.trim().split(/\s+/).filter(w => !/^\w+=/.test(w))
  const [name = ''] = words
  if (FILE_READERS.includes(name) && hasOperand(words) && !LOG_FILES.test(stage)) return name
  if (FILE_WRITERS.includes(name)) return name
  if (name === 'sed' && words.some(w => /^-[a-zA-Z]*[ni]/.test(w))) return 'sed'
  if (name === 'awk' && words.length > 2) return 'awk'
  if (SCRIPT_RUNNERS.test(name) && words.slice(1).some(w => w === '-' || /^-[a-zA-Z]*[ceE]$/.test(w) || w.startsWith('<<'))) return `inline ${name}`
  return undefined
}

const REMOTE_PROGRAMS = /\b(ssh|scp|docker|kubectl)\b/

const localFileProgram = (command: string): string | undefined => {
  const body = command
    .replace(/<<-?\s*'?(\w+)'?[\s\S]*?\n\1\b/g, '<<heredoc')
    .replace(/'[^']*'|"[^"]*"/g, ' quoted ')
  for (const part of body.split(/&&|\|\||;|\n/)) {
    if (REMOTE_PROGRAMS.test(part)) continue
    const [first = '', ...piped] = part.split('|')
    const found = programOf(first.replace(/^\s*(cd\s+\S+|\(|\{)\s*/, '')) ?? piped.map(stage => programOf(stage)).find(p => p === 'tee' || p === 'Out-File' || p === 'Set-Content' || p === 'Add-Content')
    if (found) return found
  }
  return undefined
}

const fill = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((text, [key, value]) => text.split(`{${key}}`).join(value), template)

const hasEmptyValue = (line: string, values: Record<string, string>) =>
  Object.entries(values).some(([key, value]) => !value && line.includes(`{${key}}`))

const fillLines = (template: string, values: Record<string, string>) =>
  nonEmptyLines(template)
    .filter(line => !hasEmptyValue(line, values))
    .map(line => fill(line, values))
    .join('\n')

const CHANGE_TOOLS = ['Edit', 'Write', 'NotebookEdit']
const SKILL_TOOL = 'Skill'
const WEB_TOOLS = /^(WebSearch|WebFetch)$|^mcp__.*(search|fetch|docs)/i
const REFERENCE_DIRS = ['reference', 'references']
const SKILL_OWN_FILES = /^(skill|license|readme)\b/i

type SkillReferences = { files: string[]; read: Set<string>; reminded: boolean }
const PROSE_FILES = /^(md|mdx|markdown|txt|rst)$/
const PLAN_TOOL = 'mcp__ccd_turn__update_plan'
const WRAP_UP_TOOL = 'mcp__ccd_turn__wrap_up'
const CALLS_BEFORE_PLAN_REMINDER = 30

type PlanState = { isOpen: boolean; callsSinceUpdate: number; reminded: boolean }
const plan: PlanState = { isOpen: false, callsSinceUpdate: 0, reminded: false }

const hasOpenStep = (input: object) =>
  !('items' in input) || !Array.isArray(input.items) || input.items.some(item => typeof item === 'object' && item !== null && 'status' in item && item.status !== 'completed')

const takeStalePlan = (tool: string, input: object) => {
  if (tool === WRAP_UP_TOOL) markStyleDue()
  if (tool === PLAN_TOOL) Object.assign(plan, { isOpen: hasOpenStep(input), callsSinceUpdate: 0, reminded: false })
  else if (tool === WRAP_UP_TOOL) plan.isOpen = false
  else if (plan.isOpen) plan.callsSinceUpdate += 1
  if (!plan.isOpen || plan.reminded || plan.callsSinceUpdate < CALLS_BEFORE_PLAN_REMINDER) return 0
  plan.reminded = true
  return plan.callsSinceUpdate
}

type LoopState = {
  webReadSinceLastLanguage: boolean
  changedLanguages: Set<string>
  skillReferences: Map<string, SkillReferences>
  textAwaitingCall: boolean
  narrated: boolean
}

const mainLoop: LoopState = {
  webReadSinceLastLanguage: false,
  changedLanguages: new Set(),
  skillReferences: new Map(),
  textAwaitingCall: false,
  narrated: false,
}

const languageOf = (path: string) => /\.([A-Za-z0-9]+)$/.exec(path)?.[1]?.toLowerCase() ?? ''

const takeUnresearchedLanguage = (path: string) => {
  const language = languageOf(path)
  if (!language || PROSE_FILES.test(language) || mainLoop.changedLanguages.has(language)) return ''
  mainLoop.changedLanguages.add(language)
  const researched = mainLoop.webReadSinceLastLanguage
  mainLoop.webReadSinceLastLanguage = false
  return researched ? '' : language
}

const trackNarration = (content: readonly ContentBlock[]) => {
  const hasText = content.some(block => block.type === 'text' && typeof block.text === 'string' && block.text.trim() !== '')
  const hasToolUse = content.some(block => block.type === 'tool_use')
  if (hasToolUse && (hasText || mainLoop.textAwaitingCall)) mainLoop.narrated = true
  if (hasToolUse) mainLoop.textAwaitingCall = false
  else if (hasText) mainLoop.textAwaitingCall = true
}

const STYLE_REMINDER_EVERY = 10
const style = { due: true, stepsSince: 0 }

const markStyleDue = () => {
  style.due = true
}

const takeStyleReminder = () => {
  style.stepsSince += 1
  if (!style.due && style.stepsSince < STYLE_REMINDER_EVERY) return false
  style.due = false
  style.stepsSince = 0
  return true
}

const takeNarration = () => {
  const narrated = mainLoop.narrated
  mainLoop.narrated = false
  return narrated
}
let skillCallerAgentId: string | undefined

const isLaunchOnly = (output: unknown) =>
  typeof output === 'object' && output !== null && 'status' in output && String(output.status).endsWith('_launched')

const matchesAny =(patterns: string[], tool: string) =>
  patterns.some(pattern => (pattern.endsWith('*') ? tool.startsWith(pattern.slice(0, -1)) : tool === pattern))

const samePath = (a: string, b: string) => a.replace(/\\/g, '/').toLowerCase() === b.replace(/\\/g, '/').toLowerCase()

const skillBaseOf = (text: string) => /Base directory for this skill: (.+)/.exec(text)?.[1]?.trim()

const referenceFilesOf = async ($: EngineInterface, base: string) => {
  const separator = base.includes('\\') ? '\\' : '/'
  const join = (...parts: string[]) => parts.join(separator)
  const markdownIn = async (dir: string, keep: (name: string) => boolean) =>
    (await $.fs.exists(dir)) ? (await $.fs.list(dir)).filter(f => f.kind === 'file' && /\.md$/i.test(f.name) && keep(f.name)).map(f => join(dir, f.name)) : []
  const files: string[] = []
  for (const dir of REFERENCE_DIRS) files.push(...(await markdownIn(join(base, dir), () => true)))
  files.push(...(await markdownIn(base, name => !SKILL_OWN_FILES.test(name))))
  return files
}

const markReferenceRead = (skillReferences: Map<string, SkillReferences>, path: string) => {
  for (const skill of skillReferences.values()) for (const file of skill.files) if (samePath(file, path)) skill.read.add(file)
}

const takeUnremindedSkills = (skillReferences: Map<string, SkillReferences>) => {
  const unread = [...skillReferences].filter(([, skill]) => !skill.reminded && !skill.read.size && skill.files.length)
  for (const [, skill] of unread) skill.reminded = true
  return unread.length ? { names: unread.map(([name]) => name).join(' and '), files: unread.flatMap(([, skill]) => skill.files) } : undefined
}

export const register: Register = on => {
  on('prompt.compose', async ($, e, next) => {
    let sections: PromptComposeSection[] = (await next(e)).sections.filter(s => !DROPPED_SECTIONS.includes(s.id))
    const dir = `${$.plugin.root}/instructions`
    const mdIn = async (path: string) =>
      (await $.fs.list(path)).filter(f => f.kind === 'file' && f.name.endsWith('.md')).map(f => f.name).sort()

    for (const name of await mdIn(dir)) {
      const ids = name.slice(0, -3).split('+')
      const text = (await $.fs.read(`${dir}/${name}`)).trim()
      sections = sections.map(s => (ids.includes(s.id) ? { ...s, text } : s))
    }

    for (const name of await mdIn(`${dir}/added`)) {
      const text = (await $.fs.read(`${dir}/added/${name}`)).trim()
      sections.push({ id: `brief-guard:${name.slice(0, -3)}`, text, scope: 'session' })
    }

    return { sections }
  })

  on('prompt.attachment', async ($, e, next) => {
    if (DROPPED_REMINDERS.includes(e.type)) return { text: null }
    if (e.type === MCP_INSTRUCTIONS) return next({ ...e, text: e.text.replace(STATUS_LINE_REQUEST, '') })
    if (e.type === 'output_style' && !takeStyleReminder()) return { text: null }
    const path = `${$.plugin.root}/instructions/reminders/${e.type}.md`
    const { request } = await readTurn($)
    return (await $.fs.exists(path)) ? { text: fillLines(await $.fs.read(path), { request }) } : next(e)
  })

  on('skill.prompt', async ($, e, next) => {
    const { text } = await next(e)
    if (!skillCallerAgentId) {
      const base = skillBaseOf(text)
      const files = base ? await referenceFilesOf($, base).catch(() => []) : []
      mainLoop.skillReferences.set(e.skill, { files, read: new Set(), reminded: false })
    }
    const footer = (await $.fs.read(`${$.plugin.root}/instructions/skills/footer.md`).catch(() => '')).trim()
    return { text: footer ? `${text}\n\n${footer}` : text }
  })

  on('prompt.submit', async ($, e, next) => {
    const request = USER_ORIGINS.includes(e.origin.kind) ? excerptOf(e.text) : ''
    if (request) {
      await markTurn($, { request })
      markStyleDue()
    }
    if (e.origin.kind !== NOTIFICATION_ORIGIN) {
      const startNote = request && !e.command ? (await $.fs.read(`${$.plugin.root}/instructions/reminders/task_start.md`).catch(() => '')).trim() : ''
      return next(startNote ? { ...e, context: [...(e.context ?? []), startNote] } : e)
    }
    const template = await $.fs.read(`${$.plugin.root}/instructions/reminders/task_notification.md`).catch(() => '')
    const note = fillLines(template, { request: (await readTurn($)).request })
    return next(note ? { ...e, context: [...(e.context ?? []), note] } : e)
  })

  on('turn.start', async ($, e, next) => {
    await markTurn($, { silenceAllowed: false })
    markStyleDue()
    mainLoop.textAwaitingCall = false
    mainLoop.narrated = false
    return next(e)
  })


  on('tool.call', async ($, e, next) => {
    if (e.tool === SKILL_TOOL) skillCallerAgentId = e.agentId
    const result = await next(e)
    if (e.agentId || result.deny !== undefined) return result
    const command = 'command' in e && typeof e.command === 'string' ? e.command : ''
    const filePath = 'file_path' in e && typeof e.file_path === 'string' ? e.file_path : ''
    if (e.tool === 'Read' && filePath) markReferenceRead(mainLoop.skillReferences, filePath)
    if (WEB_TOOLS.test(String(e.tool))) mainLoop.webReadSinceLastLanguage = true
    const isChange = CHANGE_TOOLS.includes(String(e.tool))
    const shellProgram = SHELL_TOOLS.includes(String(e.tool)) ? localFileProgram(command) : undefined
    const unreadSkill = isChange ? takeUnremindedSkills(mainLoop.skillReferences) : undefined
    const unresearchedLanguage = isChange ? takeUnresearchedLanguage(filePath) : ''
    const staleCalls = takeStalePlan(String(e.tool), e)
    const names = [
      takeNarration() && 'narration',
      result.isError && 'tool_error',
      e.tool === 'Agent' && (isLaunchOnly(result.result) ? 'agent_launched' : 'agent_result'),
      shellProgram && 'shell_files',
      unreadSkill && 'skill_refs',
      unresearchedLanguage && 'web_sources',
      staleCalls && 'plan_stale',
    ].filter((name): name is string => Boolean(name))
    if (!names.length) return result
    const templates = await Promise.all(
      names.map(name => $.fs.read(`${$.plugin.root}/instructions/reminders/${name}.md`).catch(() => '')),
    )
    const values = {
      request: (await readTurn($)).request,
      program: shellProgram ?? '',
      skill: unreadSkill?.names ?? '',
      files: unreadSkill?.files.join('\n') ?? '',
      language: unresearchedLanguage,
      calls: staleCalls ? String(staleCalls) : '',
    }
    const text = fillLines(templates.join('\n'), values)
    return text ? { ...result, context: [...(result.context ?? []), text] } : result
  }).catch(($, e, next) => next(e))

  on('session.append', { door: 'response' }, async ($, e, next) => {
    if (!e.agentId) trackNarration(e.message.content as readonly ContentBlock[])
    return next(e)
  }).catch(($, e, next) => next(e))

  on('session.append', { door: 'tool-result' }, async ($, e, next) => {
    if (e.origin.kind !== 'tool' || e.origin.tool !== 'WebSearch') return next(e)
    const content = e.message.content.map(withoutSourcesReminder)
    return next({ ...e, message: { ...e.message, content } })
  }).catch(($, e, next) => next(e))

  on('classic.PermissionRequest', async ($, e, next) => {
    const result = await next(e)
    const isBypassed = e.permission_mode === 'bypassPermissions' && !PERSON_TOOLS.includes(e.tool_name)
    return isBypassed && !result.decision ? { ...result, decision: { behavior: 'allow' } } : result
  })

  on('session.compact', async ($, e, next) => {
    const extra = (await $.fs.read(`${$.plugin.root}/instructions/compact/summary.md`).catch(() => '')).trim()
    const instructions = [e.instructions, extra].filter(Boolean).join('\n\n')
    const compacted = await next(instructions ? { ...e, instructions } : e)
    if (!e.agentId && e.trigger !== 'precompute' && !compacted.skip) {
      mainLoop.webReadSinceLastLanguage = false
      mainLoop.changedLanguages.clear()
      markStyleDue()
    }
    return compacted
  }).catch(($, e, next) => next(e))

  on('session.append', { door: 'compaction' }, async ($, e, next) => {
    if (e.agentId || e.message.type !== 'user') return next(e)
    const note = (await $.fs.read(`${$.plugin.root}/instructions/compact/after.md`).catch(() => '')).trim()
    if (!note) return next(e)
    const content = typeof e.message.content === 'string' ? [{ type: 'text' as const, text: e.message.content }] : e.message.content
    return next({ ...e, message: { ...e.message, content: [...content, { type: 'text', text: note }] } })
  }).catch(($, e, next) => next(e))

  on('session.append', async ($, e, next) => {
    if (e.agentId || e.message.type !== 'user') return next(e)
    const content = typeof e.message.content === 'string' ? [{ type: 'text' as const, text: e.message.content }] : e.message.content
    const isEmptyReplyNudge = content.some(block => block.type === 'text' && typeof block.text === 'string' && block.text.startsWith(EMPTY_REPLY_NUDGE))
    if (!isEmptyReplyNudge) return next(e)
    const turn = await readTurn($)
    const name = turn.silenceAllowed ? 'empty_reply_again' : 'empty_reply'
    const template = await $.fs.read(`${$.plugin.root}/instructions/reminders/${name}.md`).catch(() => '')
    const note = fillLines(template, { request: turn.request })
    if (!note) return next(e)
    if (!turn.silenceAllowed) await markTurn($, { silenceAllowed: true })
    const kept = turn.silenceAllowed ? content : []
    return next({ ...e, message: { ...e.message, content: [...kept, { type: 'text', text: note }] } })
  }).catch(($, e, next) => next(e))

  on('tool.describe', async ($, e, next) => {
    const dir = `${$.plugin.root}/instructions/tools`
    const readList = async (name: string) => nonEmptyLines(await $.fs.read(`${dir}/${name}`).catch(() => ''))
    const readNote = async (name: string) => (await $.fs.read(`${dir}/${name}`).catch(() => '')).trim()
    const isDeferred = matchesAny(await readList('deferred.md'), e.tool)
    const ownGuidance = /^[\w-]+$/.test(e.tool) ? await readNote(`${e.tool}.md`) : ''
    const screenNote = matchesAny(await readList('screen.txt'), e.tool) ? await readNote('screen.md') : ''
    const callNote = matchesAny(await readList('silent.txt'), e.tool) ? await readNote('silent.md') : ''
    const guidance = [ownGuidance, screenNote, callNote].filter(Boolean).join('\n\n')
    const result = await next(e)
    const described = guidance ? { ...result, description: `${result.description}\n\n${guidance}` } : result
    return isDeferred ? { ...described, isDeferred: true } : described
  })
}
