import type { EngineInterface, Register, ToolCallInput } from 'claude-code'
import {
  CODING_SECTION,
  DEFERRED_TOOLS,
  FILE_TOOLS,
  HEREDOC_DENIAL,
  HEREDOC_WRITE,
  LANGUAGE_PLACEHOLDER,
  LANGUAGE_SETTING,
  MODEL_RULES,
  REMOVED_SECTIONS,
  REPLY_REMINDER,
  SECTION_REWRITES,
  SHELL_OVER_TOOLS,
  SILENT_TURN_REMINDER,
  SKILL_PREFIX,
  SKILL_TRIGGERS,
  SOURCE_LIST_RULES,
  SUBAGENT_PREFACE,
  TOOL_REMINDERS_PER_TURN,
  TOOL_REMINDER_EVERY,
  TOOL_RESULT_REMINDER,
  TOOL_RULES,
  type SkillTrigger,
} from './config'

const loadedSkills = new Set<string>()
let toolCallsThisTurn = 0
let remindersThisTurn = 0

const writesFileWithHeredoc = (command: string) =>
  (command.split('\n')[0] ?? '').split(/&&|\|\||;/).some(segment => HEREDOC_WRITE.test(segment))

const removeSourceListRules = (text: string) => SOURCE_LIST_RULES.reduce((result, rule) => result.replace(rule, ''), text)

const stripFrontmatter = (text: string) => text.replace(/^---[\s\S]*?\n---\s*/, '').trim()

const readInstruction = async ($: EngineInterface, name: string) =>
  (await $.fs.read(`${$.plugin.root}/instructions/${name}`)).trim()

const readStyle = async ($: EngineInterface) => stripFrontmatter(await $.fs.read(`${$.plugin.root}/output-styles/concise.md`))

const languagePhrase = async ($: EngineInterface) => {
  const value = await $.settings.read({ key: LANGUAGE_SETTING })
  const language = typeof value === 'string' ? value.trim() : ''
  return language ? `in ${language.charAt(0).toUpperCase()}${language.slice(1)}` : "in the user's language"
}

const withLanguage = async ($: EngineInterface, text: string) => text.replace(LANGUAGE_PLACEHOLDER, await languagePhrase($))

const subagentTask = async ($: EngineInterface, task: string) => {
  const [style, ...rules] = await Promise.all([
    readStyle($),
    ...['coding.md', 'tools.md', 'skill.md'].map(name => readInstruction($, name)),
  ])
  return `<main_session_instructions>\n${SUBAGENT_PREFACE}\n\n${style}\n\n${rules.join('\n\n')}\n</main_session_instructions>\n\n<task>\n${task}\n</task>`
}

const triggerTarget = (e: ToolCallInput): { tool: string; file: string; command: string } => {
  if (e.tool === 'Bash') return { tool: e.tool, file: '', command: e.command }
  if (e.tool === 'Read' || e.tool === 'Edit' || e.tool === 'Write') return { tool: e.tool, file: e.file_path, command: '' }
  return { tool: e.tool, file: '', command: '' }
}

const triggerMatches = (trigger: SkillTrigger, target: { tool: string; file: string; command: string }) => {
  const fileTools = trigger.tools ?? FILE_TOOLS
  if (target.file && trigger.files && fileTools.includes(target.tool)) return trigger.files.test(target.file)
  if (target.command && trigger.commands) return trigger.commands.test(target.command)
  return false
}

const skillContext = async ($: EngineInterface, trigger: SkillTrigger) => {
  const root = `${$.plugin.root}/skills/${trigger.skill}`
  const body = stripFrontmatter(await $.fs.read(`${root}/SKILL.md`))
  return `The plugin loaded the skill ${SKILL_PREFIX}${trigger.skill} because this work reached ${trigger.kind}. It binds as a Skill call does.\nBase directory for this skill: ${root}\n\n${body}`
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) =>
    next({ ...e, context: [...(e.context ?? []), await withLanguage($, REPLY_REMINDER)] }),
  ).catch(($, e, next) => next(e))

  on('prompt.attachment', { type: 'auto_mode' }, ($, e, next) => {
    if (!SHELL_OVER_TOOLS.test(e.text)) return next(e)
    const kept = e.text.split(/\n\s*\n/).filter(paragraph => !SHELL_OVER_TOOLS.test(paragraph))
    return kept.every(paragraph => paragraph.trim().endsWith(':')) ? { text: null } : next({ ...e, text: kept.join('\n\n') })
  })

  on('prompt.attachment', { type: 'silent_turn_reminder' }, async ($, e, next) =>
    next({ ...e, text: await withLanguage($, SILENT_TURN_REMINDER) }),
  ).catch(($, e, next) => next(e))

  on('agent.spawn', async ($, e, next) =>
    e.subagentType === 'fork' ? next(e) : next({ ...e, prompt: await subagentTask($, e.prompt) }),
  ).catch(($, e, next) => next(e))

  on('tool.describe', { tool: DEFERRED_TOOLS }, async ($, e, next) => ({ ...(await next(e)), isDeferred: true }))

  on('tool.describe', { tool: Object.keys(TOOL_RULES) }, async ($, e, next) => {
    const [result, rule] = await Promise.all([next(e), readInstruction($, TOOL_RULES[e.tool] ?? '')])
    return { ...result, description: `${removeSourceListRules(result.description)}\n\n${rule}` }
  })

  on('tool.call', { tool: 'Bash' }, ($, e, next) =>
    writesFileWithHeredoc(e.command) ? { deny: `${$.plugin.name}: ${HEREDOC_DENIAL}` } : next(e),
  ).catch(($, e, next) => (next.called ? next(e) : { deny: `${$.plugin.name}: the heredoc guard failed.` }))

  on('turn.start', ($, e, next) => {
    if (!e.agentId) {
      toolCallsThisTurn = 0
      remindersThisTurn = 0
    }
    return next(e)
  })

  on('session.compact', ($, e, next) => {
    loadedSkills.clear()
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.tool === 'Skill' && typeof e.skill === 'string' && e.skill.startsWith(SKILL_PREFIX)) {
      loadedSkills.add(e.skill.slice(SKILL_PREFIX.length))
    }
    const result = await next(e)
    if (e.agentId || 'deny' in result) return result
    const additions: string[] = []
    const target = triggerTarget(e)
    for (const trigger of SKILL_TRIGGERS) {
      if (loadedSkills.has(trigger.skill) || !triggerMatches(trigger, target)) continue
      loadedSkills.add(trigger.skill)
      additions.push(await skillContext($, trigger))
    }
    toolCallsThisTurn += 1
    if (toolCallsThisTurn % TOOL_REMINDER_EVERY === 0 && remindersThisTurn < TOOL_REMINDERS_PER_TURN) {
      remindersThisTurn += 1
      additions.push(await withLanguage($, TOOL_RESULT_REMINDER))
    }
    return additions.length === 0 ? result : { ...result, context: [...(result.context ?? []), ...additions] }
  }).catch(($, e, next) => (next.called ? next(e) : next(e)))

  on('session.append', { door: 'tool-result' }, ($, e, next) => {
    if (e.origin.kind !== 'tool' || e.origin.tool !== 'WebSearch') return next(e)
    const content = e.message.content.map(block =>
      block.type === 'tool_result' && typeof block.content === 'string'
        ? { ...block, content: removeSourceListRules(block.content) }
        : block,
    )
    return next({ ...e, message: { ...e.message, content } })
  })

  on('prompt.compose', async ($, e, next) => {
    const result = await next(e)
    if (e.traits.includes('bare')) return result

    const section = async (name: string, file: string) => ({
      id: `${$.plugin.name}:${name}`,
      text: await readInstruction($, file),
      scope: 'session' as const,
    })
    const modelRule = MODEL_RULES.find(([pattern]) => pattern.test(e.model || e.promptModel))
    const added = [
      await section('communication', 'communication.md'),
      ...(e.tools.includes('Read') && e.tools.includes('Edit') ? [await section('tools', 'tools.md')] : []),
      ...(e.traits.includes('skills') ? [await section('skills', 'skill.md')] : []),
      ...(modelRule ? [await section('model', modelRule[1])] : []),
    ]
    if (!e.outputStyle?.isKeepingCodingInstructions) return { sections: [...result.sections, ...added] }

    const coding = await readInstruction($, 'coding.md')
    const sections = result.sections
      .filter(section => !REMOVED_SECTIONS.some(id => section.id.startsWith(id)))
      .map(section => {
        if (section.id === CODING_SECTION) return { ...section, text: coding }
        const rewrite = SECTION_REWRITES[section.id]
        return rewrite ? { ...section, text: section.text.replace(...rewrite) } : section
      })
    const hasCoding = sections.some(section => section.id === CODING_SECTION)
    const codingSection = hasCoding ? [] : [{ id: `${$.plugin.name}:coding`, text: coding, scope: 'session' as const }]
    return { sections: [...sections, ...codingSection, ...added] }
  })
}
