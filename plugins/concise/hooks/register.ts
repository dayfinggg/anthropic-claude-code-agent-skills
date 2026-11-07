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

const userLanguage = (language: unknown) =>
  typeof language === 'string' && language.trim()
    ? language.trim()
    : "the language of the user's own words in their latest message, never of pasted text, errors, logs, code, or tool results"

const reminder = (language: string) =>
  `Text the user reads, including each short note between tool calls, is in ${language}. Another language appears only in what someone else reads, such as code, commits, files, and briefs to subagents. Use the concise style, with no dashes, colons, or sentences that only point ahead.`

const removeSourceListRules = (text: string) => SOURCE_LIST_RULES.reduce((result, rule) => result.replace(rule, ''), text)

const pluginFile = ($: EngineInterface, name: string) => `${$.plugin.root}/instructions/${name}`

export const register: Register = on => {
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
    const result = await next(e)
    return { ...result, description: removeSourceListRules(result.description) }
  })

  on('session.append', { door: 'tool-result' }, ($, e, next) =>
    e.origin.kind === 'tool' && e.origin.tool === 'WebSearch'
      ? next({
          ...e,
          message: {
            ...e.message,
            content: e.message.content.map(block =>
              block.type === 'tool_result' && typeof block.content === 'string'
                ? { ...block, content: removeSourceListRules(block.content) }
                : block,
            ),
          },
        })
      : next(e),
  )

  on('prompt.compose', async ($, e, next) => {
    const result = await next(e)
    if (e.traits.includes('bare')) return result

    const added = e.traits.includes('skills')
      ? [{ id: `${$.plugin.name}:skills`, text: (await $.fs.read(pluginFile($, 'skill.md'))).trim(), scope: 'session' as const }]
      : []
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
