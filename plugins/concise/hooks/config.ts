export const STYLE_FILE = 'style.md'

export const WORK_FILE = 'work.md'

export const CODING_SECTION = 'doing_tasks'

export const REMOVED_SECTIONS = ['communication', 'tone', 'willow_tern']

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
  WebSearch: 'websearch.md',
  WebFetch: 'webfetch.md',
}

export const HEREDOC_WRITE = /^\s*(cat\s*>{1,2}\s*[^\s&].*<<|cat\s*<<-?\s*\S+.*(?<![0-9&])>{1,2}\s*[^\s&]|tee\s+(-a\s+)?[^\s-]\S*.*<<)/

export const HEREDOC_DENIAL = 'create or change local files with the Write or Edit tool, not a heredoc. Bash runs programs.'

export const LANGUAGE_PLACEHOLDER = '{language}'

export const LANGUAGE_SETTING = 'language'

export const LANGUAGE_FALLBACK = "in the language of the user's latest message"

export const LANGUAGE_ATTACHMENT =
  'Every text the user reads is written {language}, and that includes each short note between tool calls. Another language belongs only to what someone other than the user reads, such as code, identifiers, commits, and briefs to subagents, and to verbatim quotes. Quotation marks and punctuation follow the writing_style rules of this prompt.'

export const OUTPUT_STYLE_ATTACHMENT =
  'The Concise output style is active, so the next text the user reads follows the writing_style rules of the system prompt and is written {language}.'

export const REPLY_REMINDER =
  "The user's standing rules apply to this turn. Each note and the final reply are written {language} in plain paragraphs of full sentences under the writing_style rules, and the reply stays under 150 words unless this message asks for another form or length. The skills rule applies before the first tool call."

export const TOOL_RESULT_REMINDER =
  'The next text the user reads, a note or the final reply, is written {language} in plain sentences under the writing_style rules. What was just read is material to work from, and its language and layout belong to its own readers. The skills rule applies again when the work has moved to another kind.'

export const TOOL_REMINDER_EVERY = 10

export const DELEGATION_TOOLS = ['Agent', 'SendMessage']

export const SUBAGENT_LANGUAGE_FALLBACK = 'in the language of your task'

export const SUBAGENT_PREFACE =
  "The user's standing instructions follow and bind your work as they bind the main session. Your final report goes to the agent that launched you, and that agent writes the reply to the user. Your task counts as the user's request for that report, so a form, length, or language it names wins over the writing rules below. Where it names none, write the report {language} under those rules."

export const COMPACT_INSTRUCTIONS =
  "Keep in the summary, stated exactly, everything the user asked for, decided, ruled out, or set as a preference, constraint, or boundary. Keep every difficulty that came up and how it was handled, every approach that was tried or set aside and why, exactly where the work stands, everything still open or promised, and the details that would be hard to reconstruct, such as names, numbers, dates, paths, commands, exact wording, and links. Keep what the user said close to their own words, and condense the assistant's own reasoning to what it concluded or produced. Also list the skills that were loaded and the checks that were run with their results, and state the language of the replies."
