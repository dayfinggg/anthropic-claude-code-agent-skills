# Workers outside the Agent tool: Codex, Gemini CLI, Cursor CLI, claude -p and host tools

## Any worker outside the Agent tool

- No such worker reads Claude skills, auto memory or this conversation. Codex reads `AGENTS.md` (or `AGENTS.override.md`) and skills in `.agents/skills`, not `CLAUDE.md`. Gemini CLI reads `GEMINI.md` (or the names in its `context.fileName` setting) and skills in `.gemini/skills` or `.agents/skills`. Cursor CLI reads `.cursor/rules` plus `AGENTS.md` and `CLAUDE.md` at the project root.
- Make the brief self-contained, with the project rules that apply, exact paths, the exact build and test commands and what done looks like, and describe actions rather than Claude tool names, which mean nothing to another harness.
- Keep secrets out of the brief, the command line and prompt files, because these land in transcripts, process lists and the provider's logs. Let the CLI use its stored login, or set its API key variable for that one command only.
- Give an editing worker its own checkout. Commit first, then use the CLI's worktree option or `git worktree add` and point the CLI at that directory.
- Pass the non-interactive flags below, because a CLI that stops at an approval or trust prompt hangs until killed.
- Its report is a claim. Check the exit code, take the final message from the output file or JSON field, read `git -C <worktree> diff`, and run the tests yourself before merging its branch.
- A worker on another provider bills that provider's account or plan, not this session's usage.
- Short flags differ between CLIs. `-p` is the prompt in Gemini, print mode in Cursor and Claude, and a config profile in `codex exec`, and `-o` is an output file in Codex and the output format in Gemini.

## Codex CLI, `codex exec`

- Run an editing task with `codex exec -s workspace-write -C <worktree> -o <file> "<brief>"`. The default sandbox is `read-only`, which suits review and research, and `--worktree` runs the session in a new Codex-managed worktree instead.
- `--full-auto` is no longer supported, and `--approve-for-me` sends approval requests to automatic review inside `workspace-write`. Use `--dangerously-bypass-approvals-and-sandbox` or `-s danger-full-access` only inside an external sandbox such as a container.
- `workspace-write` has no network, so installs and downloads fail. Add `-c sandbox_workspace_write.network_access=true` only when the task needs it.
- stdout carries only the final message, and progress goes to stderr. `--json` streams JSONL events (`thread.started`, `turn.completed`, `turn.failed`, `item.*`, `error`), `-o` writes the final message to a file, and `--output-schema <file>` makes the final message match a JSON Schema.
- It refuses to run outside a git repository unless given `--skip-git-repo-check`. `-m` picks the model, and `codex exec resume --last "<follow-up>"` or `codex exec resume <SESSION_ID>` continues a run with its context.
- `--ignore-user-config` skips `$CODEX_HOME/config.toml` for a reproducible run. An MCP server marked `required = true` that fails to start makes `codex exec` exit with an error.

## Gemini CLI, `gemini -p`

- In headless mode a tool call that would ask for approval is denied, so the default mode cannot edit. Use `--approval-mode auto_edit` to edit and `plan` for read-only work, while `yolo` approves everything and turns the sandbox on by default.
- With folder trust on, a headless run in an untrusted folder exits with `FatalUntrustedWorkspaceError`, so pass `--skip-trust` for that run.
- `-o json` prints one object with `response`, `stats` and `error`, and `-o stream-json` streams JSONL events ending in `result`. The exit codes are 0 for success, 1 for an error, 42 for invalid input and 53 when the turn limit is exceeded.
- `-m` takes an alias (`pro`, `flash`) or a model name, and `-r latest` resumes the last session. Its `--worktree` needs `experimental.worktrees` in settings, so create the worktree yourself.

## Cursor CLI, `agent -p`

- Print mode edits workspace files even without `--force`, and it rejects shell commands, MCP tools and web fetches that would need approval, plus writes outside the workspace. `--force` (alias `--yolo`) runs everything that `permissions.deny` and team policy allow.
- For read-only work use `--mode ask` or `--mode plan`. `--trust` skips the workspace trust prompt in headless mode, `--sandbox enabled` sandboxes shell commands, and `--workspace <path>` sets the directory.
- `-w, --worktree [name]` runs in a new worktree under `~/.cursor/worktrees/<repo>/`, based on the current `HEAD` unless `--worktree-base <ref>` is given.
- `--output-format json` prints one object with `result`, `is_error` and `session_id` on success. On failure it prints no JSON, only a non-zero exit and stderr.
- `agent models` lists the account's models for `--model`, `--resume <chatId>` or `--continue` resumes, and `CURSOR_API_KEY` authenticates scripts.

## Claude Code, `claude -p`

- Use it over the Agent tool when the worker needs its own session, settings or account.
- A `-p` run shows no workspace trust dialog, and without `--bare` it runs the project's `.claude/settings.json` hooks and connects its `.mcp.json` servers even in a folder never trusted. In a repository you did not write, read those two files first or run with `--bare`.
- `--permission-mode acceptEdits` lets it edit, `dontAsk` denies anything not pre-approved with `--allowedTools`, and `--max-turns` and `--max-budget-usd` cap the run.
- `--output-format json` returns `result` and `total_cost_usd`, plus `structured_output` with `--json-schema`. Check that `structured_output` exists before using it, because a declined run omits it.
- `--bare` skips `CLAUDE.md`, hooks, skills, plugins, MCP servers and auto memory, and authenticates only with `ANTHROPIC_API_KEY` or an `apiKeyHelper`. Pass context with `--append-system-prompt`, `--settings` or `--mcp-config`.

## Host delegation tools

- In T3 Code, call `orchestrator_capabilities` for its providers, models and options, then `delegate_task` with that `target`. The default `isolation` is `shared`, the parent checkout, so pass `isolation: "worktree"` for edits, which branches from the parent commit and leaves uncommitted edits out. Leave `runtimeMode` unset unless the user asks for a supervised child. The default `mode` is `async`, so wait for the completion wake-up instead of polling `task_status`.
- Other hosts ship their own tools, so read their descriptions for isolation, approval mode and how results come back before the first dispatch.
