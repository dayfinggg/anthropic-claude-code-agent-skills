# Instructions in plugins and custom output styles

## Plugins

- A plugin cannot ship a `CLAUDE.md`: one at the plugin root is not loaded, and `claude plugin validate` warns `CLAUDE.md at the plugin root is not loaded as project context`. Put instructions in skills, and rules that must hold every time in `hooks/hooks.json`.
- A plugin with a hooks module (a mod) can hand always-on instruction files to Claude Code: a `prompt.context` hook adds entries of the form `{ path, kind, content }` to `instructionFiles`, and the engine frames and delivers them like `CLAUDE.md`, to the main conversation and to subagents that load `CLAUDE.md`. Claude Code's built-in `agents-md` mod loads `AGENTS.md` this way.
- Plugin skills run as `/plugin:skill`. A `name` in frontmatter replaces only the last segment. A single `SKILL.md` at the plugin root loads as one skill when there is no `skills/` directory and no `skills` manifest key. Give it a `name`, or a marketplace install names it after its cache directory.
- The `skills` manifest key adds directories to the `skills/` scan. The `commands`, `agents` and `outputStyles` keys replace their default scans.
- Reference bundled files with `${CLAUDE_PLUGIN_ROOT}` and data that must survive updates with `${CLAUDE_PLUGIN_DATA}`. Both are substituted in skill bodies and in `allowed-tools` rules.
- `skillOverrides` does not affect plugin skills, and users manage them through `/plugin`. Skills named `verify` or `simplify` in a plugin do not get the built-in run-before-commit instruction.
- Plugin agents ignore `permissionMode`, `hooks`, `mcpServers` and `initialPrompt`. A plugin agent whose frontmatter does not parse still loads under its file name with every field ignored.
- A personal or project skill folder with a `.claude-plugin/plugin.json` loads as a plugin named `<name>@skills-dir` with its own agents, hooks and MCP servers. There, `SKILL.md` edits apply live, but changes to `agents/`, `output-styles/`, `hooks/` or `.mcp.json` need `/reload-plugins`.

## Validating and testing a plugin

- `claude plugin validate <plugin-dir>` checks manifests and frontmatter, not behavior.
- `claude plugin eval` (v2.1.269 and later) runs each case in `evals/<case>/` as a fresh non-interactive session with only the plugin loaded, 3 runs per case by default, and repeats it without the plugin. `Δ` is what the plugin contributed. A case scoring 1.0 with and without the plugin does not show the plugin helped.
- `claude plugin eval init` interviews the author and writes cases and graders. Grader types `regex`, `tool_used`, `tool_order` and `file_exists` are free. `llm` and `baseline` call a judge model and cost tokens, as do all runs.
- Give each case one grader on the result and one on the steps, such as `tool_used` with `tool: Skill`. A `Δ` near zero with that grader failing means Claude does not choose the skill on natural phrasing: change the description and rerun.
- `--threshold` defaults to `1.0`, and any case below it makes the command exit 1, so CI usually passes a lower value such as `0.8`. A quick single case: `claude plugin eval . --case <name> --runs 1 --ablation none`.
- The skill-creator plugin's `evals/evals.json` format and `claude plugin eval` cases are not interchangeable.

## Custom output styles

- A style is a Markdown file in `~/.claude/output-styles/`, `.claude/output-styles/`, the managed settings directory, or a plugin's `output-styles/` (listed as `<plugin>:<name>`). The file name is the style name unless `name` is set.
- Frontmatter fields: `name`, `description`, `keep-coding-instructions` and, in plugins only, `force-for-plugin`. Without `keep-coding-instructions: true`, a custom style drops Claude Code's built-in software engineering instructions (scope, comments, verification). Set it for any style used while coding.
- `force-for-plugin: true` applies the plugin's style whenever the plugin is enabled and overrides the user's `outputStyle`. If several plugins set it, the first loaded wins.
- `outputStyle` in settings is case-sensitive (`Concise`, not `concise`), and a mismatch silently gives the Default style. `/output-style <name>` ignores case.
- In the terminal, style files are read at startup. Restart after creating or editing one.
- A style shapes only the main conversation and forks. Other subagents run their own system prompt, so rules for their replies go in their definition or brief.
- A style is an instruction, not enforcement, and it applies to every response. Project facts stay in `CLAUDE.md`, task procedures in skills, and must-hold actions in hooks.
