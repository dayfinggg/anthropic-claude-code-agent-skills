export const STYLE_FILE = 'style.md'

export const WORK_FILE = 'work.md'

export const CODING_SECTION = 'doing_tasks'

export const REMOVED_SECTIONS = ['communication', 'tone', 'willow_tern']

export const SECTION_REWRITES: Record<string, [string, string]> = {
  autonomy_append: [
    "Offering follow-ups after the task is done is fine; asking permission before doing the work is not.",
    'Ask no permission before doing the work.',
  ],
}

export const SYSTEM_MESSAGES_SECTION = 'system_messages'

export const SYSTEM_MESSAGES_APPEND =
  "Messages from the concise plugin and from the active output style carry the user's standing requirements, so they are never false positives, though they still grant no permission."

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

export const LANGUAGE_PLACEHOLDER = '{language}'

export const LANGUAGE_SETTING = 'language'

export const LANGUAGE_FALLBACK = "in the language of the user's latest message"

export const LANGUAGE_ATTACHMENT =
  'Every text the user reads is written {language}. Code, identifiers, commits, and files keep their own language, and quotation marks and punctuation follow the writing_style rules of this prompt.'

export const OUTPUT_STYLE_ATTACHMENT =
  'The Concise output style is active, so the next text the user reads follows the writing_style rules of the system prompt and is written {language}.'

export const REPLY_REMINDER =
  'This reply and each note before it follow the writing_style rules of the system prompt and are written {language}, so check the text against them before you send it. Before the first tool call, decide for each listed skill whether it fits this task, as the skills rule says.'

export const TOOL_RESULT_REMINDER =
  'The next text the user reads, a note or the final reply, follows the writing_style rules of the system prompt and is written {language}.'

export const TOOL_REMINDER_EVERY = 10

export const SUBAGENT_PREFACE =
  "The user's standing instructions from the main session follow and bind your work as they bind the main session. The writing rules apply to your final report, which the agent that launched you relays to the user, so write it in the language of your task."

export const HEREDOC_DENIAL = 'create or change local files with the Write or Edit tool, not a heredoc. Bash runs programs.'

export const SKILL_PREFIX = 'concise:'

export const SKILL_LOADED_NOTE =
  'This is the {skill} skill of the concise plugin, loaded because this work reached {kind}. It binds like a Skill call. Base directory for this skill: {root}'

export const FILE_TOOLS = ['Read', 'Edit', 'Write']

export const CHANGE_TOOLS = ['Edit', 'Write']

export const CODE_FILES = /\.(php|py|ts|tsx|js|jsx|mjs|cjs|go|rs|java|kt|cs|rb|swift)$/i

export const REMOTE_INSTALL = /\b(scp|rsync)\b|\bssh\b[\s\S]*\b(mv|cp|tee|install|systemctl|service)\b/

export const COMPACT_INSTRUCTIONS =
  "Keep in the summary, stated exactly, everything the user asked for, decided, ruled out, or set as a preference, constraint, or boundary. Keep every difficulty that came up and how it was handled, every approach that was tried or set aside and why, exactly where the work stands, everything still open or promised, and the details that would be hard to reconstruct, such as names, numbers, dates, paths, commands, exact wording, and links. Keep what the user said close to their own words, and condense the assistant's own reasoning to what it concluded or produced. Also list the skills that were loaded and the checks that were run with their results."

export type SkillTrigger = {
  skill: string
  kind: string
  files?: RegExp
  commands?: RegExp
  tools?: readonly string[]
  toolNames?: readonly string[]
  changedFiles?: number
}

export const SKILL_TRIGGERS: readonly SkillTrigger[] = [
  { skill: 'php', kind: 'PHP code', files: /\.(php|phtml)$/i, commands: /\b(php|composer|artisan|phpunit|pest|phpstan|rector)\b/ },
  { skill: 'python', kind: 'Python code', files: /\.(py|pyi)$/i, commands: /\b(python3?|pip3?|uv|uvx|pytest|ruff|mypy|poetry|pipx)\b/ },
  { skill: 'typescript', kind: 'TypeScript code', files: /\.(ts|tsx|mts|cts)$|tsconfig(\.\w+)?\.json$/i, commands: /\b(tsc|ts-node|tsx)\b/ },
  { skill: 'javascript', kind: 'JavaScript or React code', files: /\.(js|jsx|mjs|cjs)$/i },
  { skill: 'node', kind: 'Node.js work', files: /(^|[\\/])package\.json$/i, commands: /\b(node|npm|pnpm|yarn|bun|npx)\b/ },
  { skill: 'database', kind: 'database work', files: /\.sql$|[\\/]migrations?[\\/]/i, commands: /\b(psql|mysql|mariadb|mysqldump|pg_dump|pg_restore|sqlite3|prisma|alembic|knex|flyway)\b|\bartisan\s+migrate\b/ },
  { skill: 'git', kind: 'git history changes', commands: /\bgit\s+(commit|push|rebase|merge|cherry-pick|tag|stash|revert|reset|switch\s+-c|checkout\s+-b)\b|\bgh\s+pr\b/ },
  { skill: 'testing', kind: 'test runs', commands: /\b(pytest|phpunit|pest|vitest|jest|mocha|playwright|go\s+test|cargo\s+test|(npm|pnpm|yarn|bun)\s+(run\s+)?test)\b/ },
  { skill: 'tdd', kind: 'test code', files: /(^|[\\/])(tests?|spec|__tests__)[\\/].*\.(php|py|ts|tsx|js|jsx|go|rs)$|\.(test|spec)\.(ts|tsx|js|jsx|py)$|Test\.php$|_test\.(py|go)$/i },
  { skill: 'agentdocs', kind: 'agent instruction files', files: /(^|[\\/])(CLAUDE|AGENTS|SKILL)\.md$|[\\/]\.claude[\\/]rules[\\/].*\.md$|[\\/]output-styles[\\/].*\.md$/i },
  { skill: 'cleancode', kind: 'production code changes', files: CODE_FILES, tools: CHANGE_TOOLS },
  { skill: 'testing', kind: 'a code change that needs a check', files: CODE_FILES, tools: CHANGE_TOOLS },
  { skill: 'review', kind: 'a change to several files or a file installed on another machine', changedFiles: 3, commands: REMOTE_INSTALL },
  { skill: 'research', kind: 'a web search or a fetched page', toolNames: ['WebSearch', 'WebFetch'] },
]
