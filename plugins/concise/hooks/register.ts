import type { EngineInterface, Register } from 'claude-code'

const CODING_SECTION = 'doing_tasks'
const REMOVED_SECTIONS = ['communication', 'tone', 'willow_tern']
const SECTION_REWRITES: Record<string, [string, string]> = {
  autonomy_append: [
    "Offering follow-ups after the task is done is fine; asking permission before doing the work is not.",
    'Ask no permission before doing the work.',
  ],
}
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

const HEREDOC_WRITE = /^\s*(cat\s*>{1,2}\s*[^\s&].*<<|cat\s*<<-?\s*\S+.*(?<![0-9&])>{1,2}\s*[^\s&]|tee\s+(-a\s+)?[^\s-]\S*.*<<)/

const writesFileWithHeredoc = (command: string) =>
  (command.split('\n')[0] ?? '').split(/&&|\|\||;/).some(segment => HEREDOC_WRITE.test(segment))

const removeSourceListRules = (text: string) => SOURCE_LIST_RULES.reduce((result, rule) => result.replace(rule, ''), text)

const pluginFile = ($: EngineInterface, name: string) => `${$.plugin.root}/instructions/${name}`

export const register: Register = on => {
  on('prompt.attachment', { type: 'auto_mode' }, ($, e, next) => {
    if (!SHELL_OVER_TOOLS.test(e.text)) return next(e)
    const kept = e.text.split(/\n\s*\n/).filter(paragraph => !SHELL_OVER_TOOLS.test(paragraph))
    return kept.every(paragraph => paragraph.trim().endsWith(':')) ? { text: null } : next({ ...e, text: kept.join('\n\n') })
  })

  on('tool.describe', { tool: DEFERRED_TOOLS }, async ($, e, next) => ({ ...(await next(e)), isDeferred: true }))

  on('tool.call', { tool: 'Bash' }, ($, e, next) =>
    writesFileWithHeredoc(e.command)
      ? { deny: `${$.plugin.name}: create or change local files with the Write or Edit tool, not a heredoc. Bash runs programs.` }
      : next(e),
  )

  on('tool.describe', { tool: 'WebSearch' }, async ($, e, next) => {
    const [result, rule] = await Promise.all([next(e), $.fs.read(pluginFile($, 'websearch.md'))])
    return { ...result, description: `${removeSourceListRules(result.description)}\n\n${rule.trim()}` }
  })

  on('tool.describe', { tool: 'WebFetch' }, async ($, e, next) => {
    const [result, rule] = await Promise.all([next(e), $.fs.read(pluginFile($, 'webfetch.md'))])
    return { ...result, description: `${result.description}\n\n${rule.trim()}` }
  })

  on('session.append', { door: 'tool-result' }, ($, e, next) => {
    const tool = e.origin.kind === 'tool' ? e.origin.tool : undefined
    if (tool !== 'WebSearch') return next(e)
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
