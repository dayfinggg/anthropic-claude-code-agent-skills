## Any worker outside the Agent tool

- No worker reads Claude skills, auto memory or this conversation, and Codex and Gemini CLI read no `CLAUDE.md`. Codex reads `AGENTS.md` and skills in `.agents/skills`. Gemini CLI reads `GEMINI.md` (or the names in its `context.fileName` setting) and skills in `.gemini/skills` or `.agents/skills`. Cursor CLI reads `.cursor/rules` plus `AGENTS.md` and `CLAUDE.md` at the project root.
- Make the brief self-contained: the project rules that apply, exact file paths, the exact build and test commands, and what done looks like. Describe actions, not Claude tool names: Read, Edit, Agent and SendMessage mean nothing to another harness.
- Never put a secret in the brief, the command line or a prompt file. They land in transcripts, process lists and the provider's logs. Let the CLI use its stored login, or set its API key variable for that one command only.
- Give an editing worker its own checkout: commit, run `git worktree add`, and point the CLI at that directory. Do not run two agents in one checkout.
- Run the CLI through Bash with `run_in_background` and a timeout. A CLI that stops at an approval or trust prompt hangs until killed, so pass the non-interactive flags below.
- Its report is a claim. Check the exit code, take the final message from the output file or JSON field, read `git -C <worktree> diff`, and run the tests yourself before merging its branch.
- A worker on another provider bills that provider's account or plan, not this session's usage.
- Short flags differ between CLIs: `-p` is the prompt in Gemini, print mode in Cursor and Claude, and a config profile in `codex exec`. `-o` is an output file in Codex and the output format in Gemini.

## Codex CLI: `codex exec`

- Editing run: `codex exec -s workspace-write -C <worktree> -o <file> "<brief>"`. The default sandbox is `read-only`, which suits review and research.
- `--full-auto` is no longer supported. `--approve-for-me` sends approval requests to automatic review inside `workspace-write`. Use `--dangerously-bypass-approvals-and-sandbox` only inside an external sandbox such as a container.
- `workspace-write` has no network, so installs and downloads fail. Add `-c sandbox_workspace_write.network_access=true` only when the task needs it.
- stdout carries only the final message, and progress goes to stderr. `--json` streams JSONL events (`turn.completed`, `turn.failed`, `item.*`), `-o` writes the final message to a file, and `--output-schema <file>` makes the final message match a JSON Schema.
- It refuses to run outside a git repository unless given `--skip-git-repo-check`. `-m` picks the model. `codex exec resume --last "<follow-up>"` continues the last run with its context.

## Gemini CLI: `gemini -p`

- In headless mode a tool call that would ask for approval is denied, so the default mode cannot edit. Use `--approval-mode auto_edit` to edit, `plan` for read-only work, and `yolo` only together with `-s` (sandbox).
- With folder trust on, a headless run in an untrusted folder exits with `FatalUntrustedWorkspaceError`. Pass `--skip-trust` for that run.
- `-o json` prints one object with `response`, `stats` and `error`. Exit codes: 0 success, 1 error, 42 invalid input, 53 turn limit exceeded.
- `-m` takes an alias (`pro`, `flash`) or a model name. `-r latest` resumes the last session. Its `--worktree` needs `experimental.worktrees` in settings, so create the worktree yourself.

## Cursor CLI: `agent -p`

- Print mode edits workspace files even without `--force`, and it rejects shell commands, MCP tools and web fetches that would need approval. `--force` (alias `--yolo`) runs everything that `permissions.deny` and team policy allow.
- Read-only work: `--mode ask` or `--mode plan`. `--trust` skips the workspace trust prompt in headless mode, `--sandbox enabled` sandboxes shell commands, and `--workspace <path>` sets the directory.
- `--output-format json` prints one object with `result`, `is_error` and `session_id` on success. On failure it prints no JSON, only a non-zero exit and stderr.
- `agent models` lists the account's models for `--model`. `--resume <chatId>` or `--continue` resumes. `CURSOR_API_KEY` authenticates scripts.

## Claude Code: `claude -p`

- Use it over the Agent tool when the worker needs its own session, settings or account. Print mode skips the workspace trust dialog.
- `--permission-mode acceptEdits` lets it edit. `dontAsk` denies anything not pre-approved with `--allowedTools`. `--max-turns` and `--max-budget-usd` cap the run.
- `--output-format json` returns `result` and `total_cost_usd`, plus `structured_output` with `--json-schema`. Check that `structured_output` exists before using it.
- `--bare` skips `CLAUDE.md`, hooks, plugin sync and auto memory and authenticates only with `ANTHROPIC_API_KEY` or an `apiKeyHelper`. Pass context with `--append-system-prompt`, `--settings` or `--mcp-config`.

## Host delegation tools

- T3 Code: call `orchestrator_capabilities` for its providers, models and options, then `delegate_task` with that `target`. Use `isolation: "worktree"` for edits (it branches from the parent commit, so uncommitted edits stay out). Leave `runtimeMode` unset unless the user asks for a supervised child. Wait for the completion wake-up instead of polling `task_status`.
- Other hosts ship their own tools. Read their descriptions for isolation, approval mode and how results come back before the first dispatch.
