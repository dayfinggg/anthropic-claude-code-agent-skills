import type { EngineInterface, Register } from 'claude-code'

const STYLE = 'Concise output style is active.'
const GENERIC_REMINDER = 'Remember to follow the specific guidelines for this style.'
const CODING_SECTION = 'doing_tasks'
const REMOVED_SECTIONS = ['communication', 'tone']
const SHELL_OVER_TOOLS = 'instead of the dedicated Read, Edit, or Write tools'
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

  on('prompt.attachment', { type: 'silent_turn_reminder' }, () => ({ text: null }))

  on('prompt.attachment', { type: 'auto_mode' }, ($, e, next) => (e.text.includes(SHELL_OVER_TOOLS) ? { text: null } : next(e)))

  on('tool.describe', { tool: DEFERRED_TOOLS }, async ($, e, next) => ({ ...(await next(e)), isDeferred: true }))

  on('tool.describe', { tool: 'Bash' }, async ($, e, next) => {
    const [result, rule] = await Promise.all([next(e), $.fs.read(pluginFile($, 'bash.md'))])
    return { ...result, description: `${result.description}\n\n${rule.trim()}` }
  })

  on('tool.describe', { tool: 'Skill' }, async ($, e, next) => {
    const [result, rule] = await Promise.all([next(e), $.fs.read(pluginFile($, 'skill.md'))])
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
    if (!e.outputStyle?.isKeepingCodingInstructions || e.traits.includes('bare')) return result

    const coding = await $.fs.read(pluginFile($, 'coding.md'))
    const sections = result.sections
      .filter(section => !REMOVED_SECTIONS.includes(section.id))
      .map(section => (section.id === CODING_SECTION ? { ...section, text: coding } : section))
    const hasCoding = sections.some(section => section.id === CODING_SECTION)
    return { sections: hasCoding ? sections : [...sections, { id: `${$.plugin.name}:coding`, text: coding, scope: 'session' as const }] }
  })
}
