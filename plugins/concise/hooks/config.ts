export const CODING_SECTION = 'doing_tasks'

export const REMOVED_SECTIONS = ['communication', 'tone', 'willow_tern']

export const SECTION_REWRITES: Record<string, [string, string]> = {
  autonomy_append: [
    "Offering follow-ups after the task is done is fine; asking permission before doing the work is not.",
    'Ask no permission before doing the work.',
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

export const LANGUAGE_PLACEHOLDER = '{language}'

export const LANGUAGE_SETTING = 'language'

export const REPLY_REMINDER =
  'Before you reply, check it against the output style. Answer first, {language}, in prose paragraphs with straight double quotes, a period or a comma where a colon, dash, or semicolon would go, each term explained, under 150 words unless the user asked for detail, and no headings, bold, labels, recap, or closing offer.'

export const SILENT_TURN_REMINDER =
  'The user has seen no text from you for several steps. In one plain sentence {language}, state a result you have found or confirmed so far, such as a count, a cause, or a check that passed, rather than the action you take next, then continue.'

export const TOOL_RESULT_REMINDER =
  'Style check for the next text the user reads, a note or the final reply alike. Write it {language} as prose, the finding or outcome first, with straight double quotes and a period or a comma where a colon, dash, or semicolon would go, under 150 words unless the user asked for detail.'

export const TOOL_REMINDER_EVERY = 10

export const TOOL_REMINDERS_PER_TURN = 3

export const SUBAGENT_PREFACE =
  "The user's standing instructions from the main session follow and bind your work as they bind the main session. The output style applies to your final report, which the agent that launched you relays to the user, so write it in the language of your task."

export const HEREDOC_DENIAL = 'create or change local files with the Write or Edit tool, not a heredoc. Bash runs programs.'

export const SKILL_PREFIX = 'concise:'

export const FILE_TOOLS = ['Read', 'Edit', 'Write']

export const CHANGE_TOOLS = ['Edit', 'Write']

export type SkillTrigger = {
  skill: string
  kind: string
  files?: RegExp
  commands?: RegExp
  tools?: readonly string[]
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
  { skill: 'cleancode', kind: 'production code changes', files: /\.(php|py|ts|tsx|js|jsx|mjs|cjs|go|rs|java|kt|cs|rb|swift)$/i, tools: CHANGE_TOOLS },
]
