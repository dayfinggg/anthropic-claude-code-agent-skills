export const STYLE_FILE = 'style.md'

export const WORK_FILE = 'work.md'

export const REPORT_FILE = 'report.md'

export const CODING_SECTION = 'doing_tasks'

export const REMOVED_SECTIONS = ['communication', 'tone', 'willow_tern']

export const REPORTING_REWRITE: [string, string] = [
  'if a step was skipped, say that',
  'complete required checks before reporting success and disclose any unresolved material blocker',
]

export const SECTION_REWRITES: Record<string, [string, string]> = {
  autonomy_append: [
    "Offering follow-ups after the task is done is fine; asking permission before doing the work is not.",
    'Begin the requested work without asking permission for it.',
  ],
}

export const MODEL_RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [/fable|mythos/, 'models/fable.md'],
  [/opus/, 'models/opus.md'],
  [/sonnet/, 'models/sonnet.md'],
  [/haiku/, 'models/haiku.md'],
]

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
  Bash: 'bash.md',
  PowerShell: 'powershell.md',
  Read: 'read.md',
  Edit: 'edit.md',
  Write: 'write.md',
  WebSearch: 'websearch.md',
  WebFetch: 'webfetch.md',
}

export const LANGUAGE_PLACEHOLDER = '{language}'

export const LANGUAGE_SETTING = 'language'

export const LANGUAGE_FALLBACK = "in the language of the user's latest message"

export const LANGUAGE_ATTACHMENT =
  'Every text the user reads is written {language}, as the writing_style rules of the system prompt describe.'

export const OUTPUT_STYLE_ATTACHMENT =
  'The Concise output style is active, so the next text the user reads follows the writing_style rules of the system prompt and is written {language}.'

export const REPLY_REMINDER =
  'The working rules and writing_style rules of the system prompt apply to this turn, including their exceptions and the user\'s explicit requests. Visible notes and replies are written {language}. Required checks support completion claims, and material blockers remain explicit.'

export const SUBAGENT_LANGUAGE_FALLBACK = 'in the language of your task'

export const SUBAGENT_PREFACE =
  "The user's standing working rules follow and bind your work as they bind the main session. Your task comes after them, and the report contract comes last. Your caller does not see the text you write between tool calls. Your final message returns to it as the report, so collect the results of jobs you started before you send it."

export const COMPACT_INSTRUCTIONS =
  "Keep in the summary, stated exactly, everything the user asked for, decided, ruled out, or set as a preference, constraint, or boundary. Keep every difficulty that came up and how it was handled, every approach that was tried or set aside and why, exactly where the work stands, everything still open or promised, and the details that would be hard to reconstruct, such as names, numbers, dates, paths, commands, exact wording, links, and the ids of jobs and agents that still run. Keep what the user said close to their own words, and keep from the assistant's own turns only what it concluded or produced. List the loaded skills and executed checks with their results. Preserve the user's reply language and explicit output constraints. Earlier assistant wording records past work and is not a style example for the continuation."
