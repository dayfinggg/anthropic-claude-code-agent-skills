import type { EngineInterface, Register } from 'claude-code'

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

const systemReminder = (text: string) => `<system-reminder>\n${text}\n</system-reminder>`

const removeSourceListRules = (text: string) => SOURCE_LIST_RULES.reduce((result, rule) => result.replace(rule, ''), text)

const pluginFile = ($: EngineInterface, name: string) => `${$.plugin.root}/instructions/${name}`

export const register: Register = on => {
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
    const note = tool === undefined ? undefined : RESULT_NOTES[tool]
    const text = note === undefined ? [] : [{ type: 'text' as const, text: systemReminder(note) }]
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
      await section('communication', 'communication.md'),
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
