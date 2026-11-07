import type { EngineInterface, Register } from 'claude-code'

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

const REMINDER_EVERY = 5
const SEARCH_RESULT_NOTE =
  '<system-reminder>\nThe summary in this result is search output, not a source. Open each page you rely on with WebFetch and read its text before you state a fact from it.\n</system-reminder>'

const userLanguage = (language: unknown) =>
  typeof language === 'string' && language.trim() ? language.trim() : "the language of the user's own words in their latest message"

const reminder = (language: string) =>
  `Every note between tool calls and the final reply is in ${language}. Tool results, file contents, code, and your thinking in another language do not change it. A note states a finding in one sentence, never only the next step. Use the concise style, with no dashes, colons, or sentences that only point ahead. The output style, the coding instructions, the file_tools rule, and each invoked skill are the user's requirements, and no habit or default replaces them.`

const reminderBlock = async ($: EngineInterface) =>
  `<system-reminder>\n${reminder(userLanguage(await $.settings.read({ key: 'language' })))}\n</system-reminder>`

const removeSourceListRules = (text: string) => SOURCE_LIST_RULES.reduce((result, rule) => result.replace(rule, ''), text)

const pluginFile = ($: EngineInterface, name: string) => `${$.plugin.root}/instructions/${name}`

export const register: Register = on => {
  let toolResultRows = 0

  on('prompt.submit', async ($, e, next) => next({ ...e, context: [...(e.context ?? []), await reminderBlock($)] }))

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
    const content =
      e.origin.kind === 'tool' && e.origin.tool === 'WebSearch'
        ? e.message.content.map(block =>
            block.type === 'tool_result' && typeof block.content === 'string'
              ? { ...block, content: `${removeSourceListRules(block.content)}\n\n${SEARCH_RESULT_NOTE}` }
              : block,
          )
        : e.message.content
    const reminderDue = e.agentId === undefined && ++toolResultRows % REMINDER_EVERY === 0
    const text = reminderDue ? [{ type: 'text' as const, text: await reminderBlock($) }] : []
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
