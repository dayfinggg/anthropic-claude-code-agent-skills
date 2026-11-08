export const CODING_SECTION = 'doing_tasks'

export const REMOVED_SECTIONS = ['communication', 'tone', 'willow_tern']

export const SECTION_REWRITES: Record<string, [string, string]> = {
  autonomy_append: [
    "Offering follow-ups after the task is done is fine; asking permission before doing the work is not.",
    'Ask no permission before doing the work.',
  ],
}

export const SHELL_OVER_TOOLS = /the dedicated Read, Edit,? (or|and) Write tools/

export const DEFERRED_TOOLS = [
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

export const SOURCE_LIST_RULES = [
  /\n- After answering from results, end with a "Sources:" list[^\n]*/,
  /\nCRITICAL REQUIREMENT[\s\S]*?(?=\nUsage notes:)/,
  /\s*REMINDER: You MUST include the sources above[^\n]*/,
]

export const TOOL_RULES: Record<string, string> = {
  WebSearch: 'websearch.md',
  WebFetch: 'webfetch.md',
}

export const HEREDOC_WRITE = /^\s*(cat\s*>{1,2}\s*[^\s&].*<<|cat\s*<<-?\s*\S+.*(?<![0-9&])>{1,2}\s*[^\s&]|tee\s+(-a\s+)?[^\s-]\S*.*<<)/

export const REPLY_REMINDER =
  'Before you reply, check it against the output style. Answer first, plain prose, no headings, bold, labels, em dashes, semicolons, colons, recap, or closing offer, each term explained, under 150 words unless the user asked for detail.'

export const TOOL_REMINDER_EVERY = 5

export const TOOL_REMINDER =
  'Style check for the next text you write. A note only names a finding or a change of direction, in plain sentences with no colons, semicolons, dashes, or angle quotes, and each term explained.'

export const SUBAGENT_PREFACE =
  "The user's standing instructions from the main session follow and bind your work as they bind the main session. The output style applies to your final report, which the agent that launched you relays to the user, so write it in the language of your task."

export const HEREDOC_DENIAL = 'create or change local files with the Write or Edit tool, not a heredoc. Bash runs programs.'
