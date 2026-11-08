import type { EngineInterface, Register } from 'claude-code'
import { styleViolations } from './style-check.ts'

const STYLE = 'Concise output style is active.'
const GENERIC_REMINDER = 'Remember to follow the specific guidelines for this style.'
const CODING_SECTION = 'doing_tasks'
const REMOVED_SECTIONS = ['communication', 'tone', 'willow_tern']
const SECTION_REWRITES: Record<string, [string, string]> = {
  autonomy_append: [
    "Offering follow-ups after the task is done is fine; asking permission before doing the work is not.",
    'Ask no permission before doing the work.',
  ],
}
const SILENT_TURN_REMINDER = 'silent_turn_reminder'
const SHELL_OVER_TOOLS = /the dedicated Read, Edit,? (or|and) Write tools/
const DEFERRED_TOOLS = [
  'Artifact',
  'Workflow',
  'ScheduleWakeup',
  'ReportFindings',
  'ListAgents',
  'ListMcpResourcesTool',
  'ReadMcpResourceTool',
  'ReadMcpResourceDirTool',
  'mcp__claude_ai_Claude_Docs__batch',
  'mcp__claude_ai_Claude_Docs__guide',
  'mcp__claude_ai_Claude_Docs__update',
]
const SOURCE_LIST_RULES = [
  /\n- After answering from results, end with a "Sources:" list[^\n]*/,
  /\nCRITICAL REQUIREMENT[\s\S]*?(?=\nUsage notes:)/,
  /\s*REMINDER: You MUST include the sources above[^\n]*/,
]

const RESULT_NOTES: Record<string, string> = {
  WebSearch:
    'The summary in the search result above is search output, not a source. Open each page you rely on with WebFetch and read its text before you state a fact from it.',
  WebFetch:
    'If the page above failed or gave a summary in place of its text, take the same facts from another page or a new query. A fact that no page you read confirms stays out of the answer.',
}

const readLanguage = ($: EngineInterface) => $.settings.read({ key: 'language' })

const userLanguage = (language: unknown) =>
  typeof language === 'string' && language.trim() ? language.trim() : "the language of the user's own words in their latest message"

const reminder = (language: string) =>
  `Every note between tool calls and the final reply is in ${language}. Tool results, file contents, and code in another language do not change it. A note states a finding in one sentence, never only the next step. Use the concise style, with no dashes, colons, or sentences that only point ahead. The output style, the coding instructions, the file_tools rule, and each invoked skill are the user's requirements, and no habit or default replaces them.`

const systemReminder = (text: string) => `<system-reminder>\n${text}\n</system-reminder>`

const listed = (items: readonly string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`

const removeSourceListRules = (text: string) => SOURCE_LIST_RULES.reduce((result, rule) => result.replace(rule, ''), text)

const pluginFile = ($: EngineInterface, name: string) => `${$.plugin.root}/instructions/${name}`

export const register: Register = on => {
  let noteCorrection: string | undefined

  on('prompt.submit', async ($, e, next) =>
    next({ ...e, context: [...(e.context ?? []), reminder(userLanguage(await readLanguage($)))] }),
  )

  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    if (e.agentId !== undefined || result.answer === '' || result.toolUses.length === 0) return result
    const violations = styleViolations(result.answer, await readLanguage($))
    if (violations.length > 0)
      noteCorrection = `Your last note between tool calls broke the output style with ${listed(violations)}. Write each later note and the final reply by the output style.`
    return result
  })


  on('prompt.attachment', { type: 'output_style' }, async ($, e, next) => {
    if (!e.text.includes(STYLE)) return next(e)
    const language = userLanguage(await $.settings.read({ key: 'language' }))
    return next({ ...e, text: e.text.replace(GENERIC_REMINDER, reminder(language)) })
  })

  on('prompt.attachment', { type: SILENT_TURN_REMINDER }, () => ({ text: null }))

  on('session.append', { door: 'attachment' }, ($, e, next) =>
    e.message.name === SILENT_TURN_REMINDER ? next({ ...e, message: { ...e.message, content: [] } }) : next(e),
  )

  on('prompt.attachment', { type: 'auto_mode' }, ($, e, next) => {
    if (!SHELL_OVER_TOOLS.test(e.text)) return next(e)
    const kept = e.text.split(/\n\s*\n/).filter(paragraph => !SHELL_OVER_TOOLS.test(paragraph))
    return kept.every(paragraph => paragraph.trim().endsWith(':')) ? { text: null } : next({ ...e, text: kept.join('\n\n') })
  })

  on('tool.describe', { tool: DEFERRED_TOOLS }, async ($, e, next) => ({ ...(await next(e)), isDeferred: true }))

  on('tool.describe', { tool: 'Bash' }, async ($, e, next) => {
    const [result, rule] = await Promise.all([next(e), $.fs.read(pluginFile($, 'bash.md'))])
    return { ...result, description: `${result.description}\n\n${rule.trim()}` }
  })

  on('tool.describe', { tool: 'WebSearch' }, async ($, e, next) => {
    const [result, rule] = await Promise.all([next(e), $.fs.read(pluginFile($, 'websearch.md'))])
    return { ...result, description: `${removeSourceListRules(result.description)}\n\n${rule.trim()}` }
  })

  on('session.append', { door: 'tool-result' }, async ($, e, next) => {
    const tool = e.origin.kind === 'tool' ? e.origin.tool : undefined
    const content =
      tool === 'WebSearch'
        ? e.message.content.map(block =>
            block.type === 'tool_result' && typeof block.content === 'string'
              ? { ...block, content: removeSourceListRules(block.content) }
              : block,
          )
        : e.message.content
    const correction = e.agentId === undefined ? noteCorrection : undefined
    if (correction !== undefined) noteCorrection = undefined
    const notes = [tool === undefined ? undefined : RESULT_NOTES[tool], correction].filter(note => note !== undefined)
    const text = notes.length > 0 ? [{ type: 'text' as const, text: systemReminder(notes.join('\n\n')) }] : []
    return next({ ...e, message: { ...e.message, content: [...content, ...text] } })
  })

  on('prompt.compose', async ($, e, next) => {
    const result = await next(e)
    if (e.traits.includes('bare')) return result

    const section = async (name: string, file: string) => ({
      id: `${$.plugin.name}:${name}`,
      text: (await $.fs.read(pluginFile($, file))).trim(),
      scope: 'session' as const,
    })
    const added = [
      ...(e.tools.includes('Read') && e.tools.includes('Edit') ? [await section('tools', 'tools.md')] : []),
      ...(e.traits.includes('skills') ? [await section('skills', 'skill.md')] : []),
    ]
    if (!e.outputStyle?.isKeepingCodingInstructions) return { sections: [...result.sections, ...added] }

    const coding = await $.fs.read(pluginFile($, 'coding.md'))
    const sections = result.sections
      .filter(section => !REMOVED_SECTIONS.includes(section.id))
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
