import type { EngineInterface, Register } from 'claude-code'
import {
  CODING_SECTION,
  COMPACT_INSTRUCTIONS,
  DEFERRED_TOOLS,
  LANGUAGE_ATTACHMENT,
  LANGUAGE_FALLBACK,
  LANGUAGE_PLACEHOLDER,
  LANGUAGE_SETTING,
  MODEL_RULES,
  OUTPUT_STYLE_ATTACHMENT,
  REMOVED_SECTIONS,
  REPORTING_REWRITE,
  REPLY_REMINDER,
  REPORT_FILE,
  SECTION_REWRITES,
  SHELL_OVER_TOOLS,
  SOURCE_LIST_RULES,
  STYLE_FILE,
  SUBAGENT_LANGUAGE_FALLBACK,
  SUBAGENT_PREFACE,
  TOOL_RULES,
  WORK_FILE,
} from './config'

const removeSourceListRules = (text: string) => SOURCE_LIST_RULES.reduce((result, rule) => result.replace(rule, ''), text)

const readInstruction = async ($: EngineInterface, name: string) =>
  (await $.fs.read(`${$.plugin.root}/instructions/${name}`)).trim()

const languagePhrase = async ($: EngineInterface, fallback: string) => {
  const value = await $.settings.read({ key: LANGUAGE_SETTING })
  const language = typeof value === 'string' ? value.trim() : ''
  return language ? `in ${language.charAt(0).toUpperCase()}${language.slice(1)}` : fallback
}

const withLanguage = async ($: EngineInterface, text: string, fallback = LANGUAGE_FALLBACK) =>
  text.replaceAll(LANGUAGE_PLACEHOLDER, await languagePhrase($, fallback))

const readStyle = async ($: EngineInterface) => withLanguage($, await readInstruction($, STYLE_FILE))

const subagentTask = async ($: EngineInterface, task: string) => {
  const [work, report] = await Promise.all([
    readInstruction($, WORK_FILE),
    readInstruction($, REPORT_FILE).then(text => withLanguage($, text, SUBAGENT_LANGUAGE_FALLBACK)),
  ])
  return `<main_session_instructions>\n${SUBAGENT_PREFACE}\n\n${work}\n</main_session_instructions>\n\n<task>\n${task}\n</task>\n\n${report}`
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

  on('prompt.attachment', { type: 'silent_turn_reminder' }, () => ({ text: null }))

  on('prompt.attachment', { type: 'language' }, async ($, e, next) =>
    next({ ...e, text: await withLanguage($, LANGUAGE_ATTACHMENT) }),
  ).catch(($, e, next) => next(e))

  on('prompt.attachment', { type: 'output_style' }, async ($, e, next) =>
    next({ ...e, text: await withLanguage($, OUTPUT_STYLE_ATTACHMENT) }),
  ).catch(($, e, next) => next(e))

  on('agent.spawn', async ($, e, next) =>
    e.subagentType === 'fork' ? next(e) : next({ ...e, prompt: await subagentTask($, e.prompt) }),
  ).catch(($, e, next) => next(e))

  on('tool.describe', { tool: DEFERRED_TOOLS }, async ($, e, next) => ({ ...(await next(e)), isDeferred: true }))

  on('tool.describe', { tool: Object.keys(TOOL_RULES) }, async ($, e, next) => {
    const [result, rule] = await Promise.all([next(e), readInstruction($, TOOL_RULES[e.tool] ?? '')])
    const description = e.tool === 'WebSearch' || e.tool === 'WebFetch'
      ? removeSourceListRules(result.description)
      : result.description
    return { ...result, description: `${description}\n\n${rule}` }
  })

  on('session.compact', ($, e, next) =>
    next({ ...e, instructions: [e.instructions, COMPACT_INSTRUCTIONS].filter(Boolean).join('\n\n') }),
  )

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
      ...(modelRule ? [section('model', await withLanguage($, await readInstruction($, modelRule[1])))] : []),
      section('style', await readStyle($)),
    ]
    const baseSections = result.sections.map(item => ({ ...item, text: item.text.replace(...REPORTING_REWRITE) }))
    if (!e.outputStyle?.isKeepingCodingInstructions) return { sections: [...baseSections, section('work', work), ...tail] }

    const sections = baseSections
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
