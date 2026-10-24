import type { ApiContentBlock, EngineInterface, PromptComposeSection, PromptSubmitInput, Register } from 'claude-code'
import type { TurnMarks } from '../types'
import { localFileProgram } from './shell'
import { markReferenceRead, referenceFilesOf, skillBaseOf, takeUnremindedSkills, type SkillReferences } from './skills'
import { EMPTY_REPLY_NUDGE, excerptOf, fillLines, nonEmptyLines, withoutSourcesReminder, withoutStatusLineRequest, withoutUndoneWorkRequest } from './text'

const DROPPED_SECTIONS = ['tone']
const DROPPED_REMINDERS = ['auto_mode', 'silent_turn_reminder', 'task_reminder', 'todo_reminder']
const PERSON_TOOLS = ['AskUserQuestion', 'EnterPlanMode', 'ExitPlanMode']
const USER_ORIGINS: string[] = ['composer', 'bridge', 'sdk', 'unclassified']
const SHELL_TOOLS = ['Bash', 'PowerShell']
const CHANGE_TOOLS = ['Edit', 'Write', 'NotebookEdit']
const WEB_TOOLS = /^(WebSearch|WebFetch)$|^mcp__.*(search|fetch|docs)/i
const PROSE_FILES = /^(md|mdx|markdown|txt|rst)$/
const PLAN_TOOL = 'mcp__ccd_turn__update_plan'
const WRAP_UP_TOOL = 'mcp__ccd_turn__wrap_up'
const CALLS_BEFORE_PLAN_REMINDER = 30

const TURN = { plugin: 'brief-guard', key: 'turn' } as const

type Narration = { isTextAwaitingCall: boolean; isNarrated: boolean }
type Plan = { isOpen: boolean; callsSinceUpdate: number; isReminded: boolean }

const freshNarration = (): Narration => ({ isTextAwaitingCall: false, isNarrated: false })

const main = {
  narration: freshNarration(),
  plan: { isOpen: false, callsSinceUpdate: 0, isReminded: false } as Plan,
  skills: new Map<string, SkillReferences>(),
  changedLanguages: new Set<string>(),
  hasReadWebSinceLastLanguage: false,
  isStyleDue: true,
}
const agentNarrations = new Map<string, Narration>()
const skillCallers = new Map<string, string | undefined>()

const readTurn = async ($: EngineInterface): Promise<TurnMarks> => ({ request: '', ...(await $.state.get(TURN)).value })

const markRequest = async ($: EngineInterface, request: string) => {
  if ((await readTurn($)).request !== request) await $.state.set(TURN, { request })
}

const instructionsDir = ($: EngineInterface) => `${$.plugin.root}/instructions`

const readInstruction = ($: EngineInterface, path: string) => $.fs.read(`${instructionsDir($)}/${path}`).catch(() => '')

const readReminders = async ($: EngineInterface, names: string[]) => (await Promise.all(names.map(name => readInstruction($, `reminders/${name}.md`)))).join('\n')

const markdownNamesIn = async ($: EngineInterface, dir: string) =>
  (await $.fs.list(dir))
    .filter(entry => entry.kind === 'file' && entry.name.endsWith('.md'))
    .map(entry => entry.name)
    .sort()

const isName = (name: unknown): name is string => typeof name === 'string' && name !== ''

const withContext = <T extends { context?: readonly string[] }>(value: T, note: string): T =>
  note ? { ...value, context: [...(value.context ?? []), note] } : value

const narrationOf = (agentId: string) => {
  const known = agentNarrations.get(agentId)
  if (known) return known
  const fresh = freshNarration()
  agentNarrations.set(agentId, fresh)
  return fresh
}

const trackNarration = (content: readonly ApiContentBlock[], narration: Narration) => {
  const hasText = content.some(block => block.type === 'text' && typeof block.text === 'string' && block.text.trim() !== '')
  const hasToolUse = content.some(block => block.type === 'tool_use')
  if (hasToolUse && (hasText || narration.isTextAwaitingCall)) narration.isNarrated = true
  if (hasToolUse) narration.isTextAwaitingCall = false
  else if (hasText) narration.isTextAwaitingCall = true
}

const takeNarration = (narration: Narration) => {
  const isNarrated = narration.isNarrated
  narration.isNarrated = false
  return isNarrated
}

const takeStyleReminder = () => {
  const isDue = main.isStyleDue
  main.isStyleDue = false
  return isDue
}

const hasOpenStep = (input: object) =>
  !('items' in input) || !Array.isArray(input.items) || input.items.some(item => typeof item === 'object' && item !== null && 'status' in item && item.status !== 'completed')

const takeStalePlanCalls = (tool: string, input: object) => {
  const { plan } = main
  if (tool === PLAN_TOOL) {
    Object.assign(plan, { isOpen: hasOpenStep(input), callsSinceUpdate: 0, isReminded: false })
    return 0
  }
  if (tool === WRAP_UP_TOOL) {
    plan.isOpen = false
    main.isStyleDue = true
    return 0
  }
  if (!plan.isOpen) return 0
  plan.callsSinceUpdate += 1
  if (plan.isReminded || plan.callsSinceUpdate < CALLS_BEFORE_PLAN_REMINDER) return 0
  plan.isReminded = true
  return plan.callsSinceUpdate
}

const languageOf = (path: string) => /\.([A-Za-z0-9]+)$/.exec(path)?.[1]?.toLowerCase() ?? ''

const takeUnresearchedLanguage = (path: string) => {
  const language = languageOf(path)
  if (!language || PROSE_FILES.test(language) || main.changedLanguages.has(language)) return ''
  main.changedLanguages.add(language)
  const isResearched = main.hasReadWebSinceLastLanguage
  main.hasReadWebSinceLastLanguage = false
  return isResearched ? '' : language
}

const isLaunchOnly = (output: unknown) => typeof output === 'object' && output !== null && 'status' in output && String(output.status).endsWith('_launched')

const matchesAny = (patterns: string[], tool: string) => patterns.some(pattern => (pattern.endsWith('*') ? tool.startsWith(pattern.slice(0, -1)) : tool === pattern))

const userContentOf = (content: string | readonly ApiContentBlock[]) => (typeof content === 'string' ? [{ type: 'text', text: content }] : [...content])

const notesForTypedPrompt = async ($: EngineInterface, e: PromptSubmitInput) => {
  const request = USER_ORIGINS.includes(e.origin.kind) ? excerptOf(e.text) : ''
  if (!request) return e
  await markRequest($, request)
  main.isStyleDue = true
  if (e.command || !e.turnId) return e
  return withContext(e, (await readInstruction($, 'reminders/mid_turn.md')).trim())
}

export const register: Register = on => {
  on('prompt.compose', async ($, e, next) => {
    const dir = instructionsDir($)
    const replacements = await Promise.all(
      (await markdownNamesIn($, dir)).map(async name => ({ ids: name.slice(0, -3).split('+'), text: (await $.fs.read(`${dir}/${name}`)).trim() })),
    )
    const added = await Promise.all(
      (await markdownNamesIn($, `${dir}/added`)).map(async (name): Promise<PromptComposeSection> => ({
        id: `brief-guard:${name.slice(0, -3)}`,
        text: (await $.fs.read(`${dir}/added/${name}`)).trim(),
        scope: 'session',
      })),
    )
    const sections = (await next(e)).sections
      .filter(section => !DROPPED_SECTIONS.includes(section.id))
      .map(section => ({ ...section, text: replacements.findLast(file => file.ids.includes(section.id))?.text ?? withoutUndoneWorkRequest(section.text) }))
    return { sections: [...sections, ...added] }
  })

  on('prompt.attachment', async ($, e, next) => {
    if (DROPPED_REMINDERS.includes(e.type)) return { text: null }
    if (e.type === 'mcp_instructions_delta') return next({ ...e, text: withoutStatusLineRequest(e.text) })
    if (e.type === 'output_style' && !takeStyleReminder()) return { text: null }
    const path = `${instructionsDir($)}/reminders/${e.type}.md`
    if (!(await $.fs.exists(path))) return next(e)
    return { text: fillLines(await $.fs.read(path), { request: (await readTurn($)).request }) }
  })

  on('skill.prompt', async ($, e, next) => {
    const { text } = await next(e)
    const base = skillBaseOf(text)
    const files = base ? await referenceFilesOf($, base).catch(() => []) : []
    const callerAgentId = skillCallers.get(e.skill)
    skillCallers.delete(e.skill)
    if (!callerAgentId) main.skills.set(e.skill, { files, isRead: false, isReminded: false })
    const footer = fillLines(await readInstruction($, 'skills/footer.md'), { files: files.join(', ') })
    return { text: footer ? `${text}\n\n${footer}` : text }
  })

  on('prompt.submit', async ($, e, next) => {
    if (e.origin.kind !== 'task-notification') return next(await notesForTypedPrompt($, e))
    const note = fillLines(await readInstruction($, 'reminders/task_notification.md'), { request: (await readTurn($)).request })
    return next(withContext(e, note))
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      main.narration = freshNarration()
      main.isStyleDue = true
    }
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.tool === 'Skill') skillCallers.set(e.skill, e.agentId)
    const result = await next(e)
    if (result.deny !== undefined) return result
    const tool = String(e.tool)
    const program = 'command' in e && typeof e.command === 'string' && SHELL_TOOLS.includes(tool) ? localFileProgram(e.command) : undefined

    if (e.agentId) {
      const names = [takeNarration(narrationOf(e.agentId)) && 'agent_narration', program && 'shell_files'].filter(isName)
      return names.length ? withContext(result, fillLines(await readReminders($, names), { program: program ?? '' })) : result
    }

    const filePath = 'file_path' in e && typeof e.file_path === 'string' ? e.file_path : ''
    if (tool === 'Read' && filePath) markReferenceRead(main.skills, filePath)
    if (WEB_TOOLS.test(tool)) main.hasReadWebSinceLastLanguage = true
    const isChange = CHANGE_TOOLS.includes(tool)
    const unreadSkills = isChange ? takeUnremindedSkills(main.skills) : undefined
    const language = isChange ? takeUnresearchedLanguage(filePath) : ''
    const staleCalls = takeStalePlanCalls(tool, e)
    const names = [
      takeNarration(main.narration) && 'narration',
      result.isError && 'tool_error',
      tool === 'Agent' && (isLaunchOnly(result.result) ? 'agent_launched' : 'agent_result'),
      program && 'shell_files',
      unreadSkills && 'skill_refs',
      language && 'web_sources',
      staleCalls && 'plan_stale',
    ].filter(isName)
    if (!names.length) return result
    const values = {
      request: (await readTurn($)).request,
      program: program ?? '',
      skill: unreadSkills?.names ?? '',
      files: unreadSkills?.files.join('\n') ?? '',
      language,
      calls: staleCalls ? String(staleCalls) : '',
    }
    return withContext(result, fillLines(await readReminders($, names), values))
  }).catch(($, e, next) => next(e))

  on('session.append', { door: 'response' }, ($, e, next) => {
    trackNarration(e.message.content, e.agentId ? narrationOf(e.agentId) : main.narration)
    return next(e)
  }).catch(($, e, next) => next(e))

  on('session.append', { door: 'tool-result' }, ($, e, next) => {
    if (e.origin.kind !== 'tool' || e.origin.tool !== 'WebSearch') return next(e)
    return next({ ...e, message: { ...e.message, content: e.message.content.map(withoutSourcesReminder) } })
  }).catch(($, e, next) => next(e))

  on('session.append', { door: 'compaction' }, async ($, e, next) => {
    if (e.agentId || e.message.type !== 'user') return next(e)
    const note = (await readInstruction($, 'compact/after.md')).trim()
    if (!note) return next(e)
    return next({ ...e, message: { ...e.message, content: [...userContentOf(e.message.content), { type: 'text', text: note }] } })
  }).catch(($, e, next) => next(e))

  on('session.append', async ($, e, next) => {
    if (e.agentId || e.message.type !== 'user') return next(e)
    const isEmptyReplyNudge = userContentOf(e.message.content).some(block => block.type === 'text' && typeof block.text === 'string' && block.text.startsWith(EMPTY_REPLY_NUDGE))
    if (!isEmptyReplyNudge) return next(e)
    const note = fillLines(await readInstruction($, 'reminders/empty_reply.md'), { request: (await readTurn($)).request })
    if (!note) return next(e)
    return next({ ...e, message: { ...e.message, content: [{ type: 'text', text: note }] } })
  }).catch(($, e, next) => next(e))

  on('session.compact', async ($, e, next) => {
    const extra = (await readInstruction($, 'compact/summary.md')).trim()
    const instructions = [e.instructions, extra].filter(Boolean).join('\n\n')
    const compacted = await next(instructions ? { ...e, instructions } : e)
    if (!e.agentId && e.trigger !== 'precompute' && !compacted.skip) {
      main.hasReadWebSinceLastLanguage = false
      main.changedLanguages.clear()
      main.isStyleDue = true
    }
    return compacted
  }).catch(($, e, next) => next(e))

  on('classic.PermissionRequest', async ($, e, next) => {
    const result = await next(e)
    const isBypassed = e.permission_mode === 'bypassPermissions' && !PERSON_TOOLS.includes(e.tool_name)
    return isBypassed && !result.decision ? { ...result, decision: { behavior: 'allow' } } : result
  })

  on('tool.describe', async ($, e, next) => {
    const deferred = nonEmptyLines(await readInstruction($, 'tools/deferred.md'))
    const guidance = /^[\w-]+$/.test(e.tool) ? (await readInstruction($, `tools/${e.tool}.md`)).trim() : ''
    const result = await next(e)
    const description = withoutUndoneWorkRequest(result.description)
    const described = { ...result, description: guidance ? `${description}\n\n${guidance}` : description }
    return matchesAny(deferred, e.tool) ? { ...described, isDeferred: true } : described
  })
}
