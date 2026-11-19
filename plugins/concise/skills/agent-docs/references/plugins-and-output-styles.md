# Instructions in plugins and custom output styles

## Plugins

- A plugin cannot ship a `CLAUDE.md`. One at the plugin root is not loaded, and `claude plugin validate` warns `CLAUDE.md at the plugin root is not loaded as project context`.
- A plugin with a hooks module (a mod) delivers always-on text through prompt hooks. A `prompt.context` hook adds `{ path, kind, content }` entries to `instructionFiles`, which reach the main conversation and every subagent that loads `CLAUDE.md`, the way Claude Code's built-in `agents-md` mod loads `AGENTS.md`. A `prompt.compose` hook returns the system prompt's `sections`, a list of `{ id, text, scope }`, and can append one.
- Claude Code loads a built-in guard on a machine with managed settings or `managed-mcp.json` and in a session signed in to a Team or Enterprise plan. There the `prompt.compose`, `prompt.section`, `prompt.context` and `prompt.attachment` hooks of user-installed mods never run, and `/plugin` shows a note, while skills and output styles still load.
- Plugin skills run as `/plugin:skill`, and a `name` in frontmatter replaces only the last segment. A single `SKILL.md` at the plugin root loads as one skill when there is no `skills/` directory and no `skills` manifest key. Give it a `name`, or a marketplace install names it after its cache directory.
- The `skills` manifest key adds directories to the `skills/` scan, while the `commands`, `agents` and `outputStyles` keys replace their default scans.
- Reference bundled files with `${CLAUDE_PLUGIN_ROOT}` and data that must survive updates with `${CLAUDE_PLUGIN_DATA}`. Both are substituted in skill bodies and in `allowed-tools` rules.
- `skillOverrides` does not affect plugin skills, which users manage through `/plugin`. Skills named `verify` or `simplify` in a plugin do not get the built-in run-before-commit instruction.
- A plugin agent whose frontmatter does not parse still loads under its file name with every field ignored.
- A personal or project skill folder with a `.claude-plugin/plugin.json` loads as a plugin named `<name>@skills-dir` with its own agents, hooks and MCP servers. There `SKILL.md` edits apply live, but changes to `agents/`, `output-styles/`, `hooks/` or `.mcp.json` need `/reload-plugins`.

## Validating and testing a plugin

- `claude plugin validate <plugin-dir>` checks manifests and frontmatter and type-checks a TypeScript hooks module, but not behavior.
- `claude plugin eval` (v2.1.269 and later) runs each case as a fresh non-interactive session with only the plugin loaded, 3 runs per case by default, and repeats it without the plugin. `Δ` is what the plugin contributed, so a case scoring 1.0 with and without the plugin does not show the plugin helped.
- The eval directory is `evals/`, or a relative path set with `--eval-dir` or `experimental.evals` in `plugin.json`, and it always sits inside the plugin, so its cases ship with every install.
- `claude plugin eval init` interviews the author and writes cases and graders. Grader types `regex`, `tool_used`, `tool_order` and `file_exists` are free, while `llm` and `baseline` call a judge model and cost tokens, as do all runs.
- Give each case one grader on the result and one on the steps, such as `tool_used` with `tool: Skill`. A `Δ` near zero with that grader failing means Claude does not choose the skill on natural phrasing, so change the description and rerun.
- `--threshold` defaults to `1.0`, and any case below it makes the command exit 1, so CI usually passes a lower value such as `0.8`. A quick single case runs with `claude plugin eval . --case <name> --runs 1 --ablation none`.
- The skill-creator plugin's `evals/evals.json` format and `claude plugin eval` cases are not interchangeable.

## Custom output styles

- A style is a Markdown file in `~/.claude/output-styles/`, `.claude/output-styles/`, the managed settings directory, or a plugin's `output-styles/` (listed as `<plugin>:<name>`). The file name is the style name unless `name` is set.
- The frontmatter fields are `name`, `description`, `keep-coding-instructions` and, in plugins only, `force-for-plugin`. On the full system prompt, a custom style drops Claude Code's software engineering instructions (scope, comments, verification) unless `keep-coding-instructions: true` is set. Models newer than Haiku 4.5, Sonnet 5 and Opus 4.7 get a shorter system prompt that lacks that section anyway, unless `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT=0` selects the full one. Set it for any style used while coding.
- `force-for-plugin: true` applies the plugin's style whenever the plugin is enabled and overrides the user's `outputStyle`. If several plugins set it, the first loaded wins.
- `outputStyle` in settings is case-sensitive (`Concise`, not `concise`), and a mismatch silently gives the Default style. `/output-style <name>` ignores case.
- In the terminal, style files are read at startup, so restart after creating or editing one.
- A style shapes only the main conversation and forks. Other subagents run their own system prompt, so rules for their replies go in their definition or brief.
