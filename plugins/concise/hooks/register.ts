import type { EngineInterface, Register, ToolCallInput } from 'claude-code'
import {
  CHANGE_TOOLS,
  CODING_SECTION,
  COMPACT_INSTRUCTIONS,
  DEFERRED_TOOLS,
  FILE_TOOLS,
  HEREDOC_DENIAL,
  HEREDOC_WRITE,
  LANGUAGE_ATTACHMENT,
  LANGUAGE_FALLBACK,
  LANGUAGE_PLACEHOLDER,
  LANGUAGE_SETTING,
  MODEL_RULES,
  OUTPUT_STYLE_ATTACHMENT,
  REMOVED_SECTIONS,
  REPLY_REMINDER,
  SECTION_REWRITES,
  SHELL_OVER_TOOLS,
  SKILL_LOADED_NOTE,
  SKILL_PREFIX,
  SKILL_TRIGGERS,
  SOURCE_LIST_RULES,
  STYLE_FILE,
  SUBAGENT_PREFACE,
  SYSTEM_MESSAGES_APPEND,
  SYSTEM_MESSAGES_SECTION,
  TOOL_REMINDER_EVERY,
  TOOL_RESULT_REMINDER,
  TOOL_RULES,
  WORK_FILE,
  type SkillTrigger,
} from './config'

type Target = { tool: string; file: string; command: string }

const loadedSkills = new Map<string, Set<string>>()
const changedFilesThisTurn = new Set<string>()
let toolCallsThisTurn = 0

const skillsOf = (agentId?: string) => {
  const key = agentId ?? 'main'
  const loaded = loadedSkills.get(key) ?? new Set<string>()
  loadedSkills.set(key, loaded)
  return loaded
}

const writesFileWithHeredoc = (command: string) =>
  (command.split('\n')[0] ?? '').split(/&&|\|\||;/).some(segment => HEREDOC_WRITE.test(segment))

const removeSourceListRules = (text: string) => SOURCE_LIST_RULES.reduce((result, rule) => result.replace(rule, ''), text)

const stripFrontmatter = (text: string) => text.replace(/^---[\s\S]*?\n---\s*/, '').trim()

const readInstruction = async ($: EngineInterface, name: string) =>
  (await $.fs.read(`${$.plugin.root}/instructions/${name}`)).trim()

const languagePhrase = async ($: EngineInterface) => {
  const value = await $.settings.read({ key: LANGUAGE_SETTING })
  const language = typeof value === 'string' ? value.trim() : ''
  return language ? `in ${language.charAt(0).toUpperCase()}${language.slice(1)}` : LANGUAGE_FALLBACK
}

const withLanguage = async ($: EngineInterface, text: string) => text.replaceAll(LANGUAGE_PLACEHOLDER, await languagePhrase($))

const readStyle = async ($: EngineInterface) => withLanguage($, await readInstruction($, STYLE_FILE))

const subagentTask = async ($: EngineInterface, task: string) => {
  const [style, work] = await Promise.all([readStyle($), readInstruction($, WORK_FILE)])
  return `<main_session_instructions>\n${SUBAGENT_PREFACE}\n\n${style}\n\n${work}\n</main_session_instructions>\n\n<task>\n${task}\n</task>`
}

const triggerTarget = (e: ToolCallInput): Target => {
  if (e.tool === 'Bash') return { tool: e.tool, file: '', command: e.command }
  if (e.tool === 'Read' || e.tool === 'Edit' || e.tool === 'Write') return { tool: e.tool, file: e.file_path, command: '' }
  return { tool: e.tool, file: '', command: '' }
}

const triggerMatches = (trigger: SkillTrigger, target: Target, changed: ReadonlySet<string>) => {
  if (trigger.changedFiles !== undefined && changed.size >= trigger.changedFiles) return true
  if (trigger.toolNames?.includes(target.tool)) return true
  const fileTools = trigger.tools ?? FILE_TOOLS
  if (target.file && trigger.files && fileTools.includes(target.tool)) return trigger.files.test(target.file)
  if (target.command && trigger.commands) return trigger.commands.test(target.command)
  return false
}

const skillContext = async ($: EngineInterface, trigger: SkillTrigger) => {
  const root = `${$.plugin.root}/skills/${trigger.skill}`
  const body = stripFrontmatter(await $.fs.read(`${root}/SKILL.md`))
  const note = SKILL_LOADED_NOTE.replace('{skill}', `${SKILL_PREFIX}${trigger.skill}`).replace('{kind}', trigger.kind).replace('{root}', root)
  return `${note}\n\n${body}`
}

const resetSkills = () => loadedSkills.clear()

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) =>
    next({ ...e, context: [...(e.context ?? []), await withLanguage($, REPLY_REMINDER)] }),
  ).catch(($, e, next) => next(e))

  on('prompt.attachment', { type: 'auto_mode' }, ($, e, next) => {
    if (!SHELL_OVER_TOOLS.test(e.text)) return next(e)
    const kept = e.text.split(/\n\s*\n/).filter(paragraph => !SHELL_OVER_TOOLS.test(paragraph))
    return kept.every(paragraph => paragraph.trim().endsWith(':')) ? { text: null } : next({ ...e, text: kept.join('\n\n') })
  })

  on('prompt.attachment', { type: 'silent_turn_reminder' }, () => ({ text: null }))

  on('prompt.attachment', { type: 'language' }, async ($, e, next) =>
    next({ ...e, text: await withLanguage($, LANGUAGE_ATTACHMENT) }),
  ).catch(($, e, next) => next(e))

  on('prompt.attachment', { type: 'output_style' }, async ($, e, next) =>
    next({ ...e, text: await withLanguage($, OUTPUT_STYLE_ATTACHMENT) }),
  ).catch(($, e, next) => next(e))

  on('prompt.section', { name: SYSTEM_MESSAGES_SECTION }, async ($, e, next) => {
    const result = await next(e)
    return result.text ? { text: `${result.text.trimEnd()}\n\n${SYSTEM_MESSAGES_APPEND}` } : result
  }).catch(($, e, next) => next(e))

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
      changedFilesThisTurn.clear()
    }
    return next(e)
  })

  on('session.start', ($, e, next) => {
    resetSkills()
    return next(e)
  })

  on('session.compact', ($, e, next) => {
    resetSkills()
    return next({ ...e, instructions: [e.instructions, COMPACT_INSTRUCTIONS].filter(Boolean).join('\n\n') })
  })

  on('tool.call', async ($, e, next) => {
    const loaded = skillsOf(e.agentId)
    if (e.tool === 'Skill' && typeof e.skill === 'string' && e.skill.startsWith(SKILL_PREFIX)) {
      loaded.add(e.skill.slice(SKILL_PREFIX.length))
    }
    const result = await next(e)
    if ('deny' in result) return result
    const additions: string[] = []
    const target = triggerTarget(e)
    const changed = e.agentId ? new Set<string>() : changedFilesThisTurn
    if (target.file && CHANGE_TOOLS.includes(target.tool)) changed.add(target.file)
    for (const trigger of SKILL_TRIGGERS) {
      if (loaded.has(trigger.skill) || !triggerMatches(trigger, target, changed)) continue
      loaded.add(trigger.skill)
      additions.push(await skillContext($, trigger))
    }
    if (!e.agentId) {
      toolCallsThisTurn += 1
      if (toolCallsThisTurn % TOOL_REMINDER_EVERY === 0) additions.push(await withLanguage($, TOOL_RESULT_REMINDER))
    }
    return additions.length === 0 ? result : { ...result, context: [...(result.context ?? []), ...additions] }
  }).catch(($, e, next) => next(e))

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

    const section = (name: string, text: string) => ({ id: `${$.plugin.name}:${name}`, text, scope: 'session' as const })
    const work = await readInstruction($, WORK_FILE)
    const modelRule = MODEL_RULES.find(([pattern]) => pattern.test(e.model || e.promptModel))
    const tail = [
      ...(modelRule ? [section('model', await readInstruction($, modelRule[1]))] : []),
      section('style', await readStyle($)),
    ]
    if (!e.outputStyle?.isKeepingCodingInstructions) return { sections: [...result.sections, section('work', work), ...tail] }

    const sections = result.sections
      .filter(section => !REMOVED_SECTIONS.some(id => section.id.startsWith(id)))
      .map(section => {
        if (section.id === CODING_SECTION) return { ...section, text: work }
        const rewrite = SECTION_REWRITES[section.id]
        return rewrite ? { ...section, text: section.text.replace(...rewrite) } : section
      })
    const hasWork = sections.some(section => section.id === CODING_SECTION)
    return { sections: [...sections, ...(hasWork ? [] : [section('work', work)]), ...tail] }
  })
}
