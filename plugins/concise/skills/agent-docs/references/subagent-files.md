# Subagent definition files

## Fields

- Only `name` and `description` are required. `name` is at most 256 characters, contains no `:` and does not start with `-`. The file name does not have to match, and subfolders under `.claude/agents/` do not change the name.
- Multi-word fields are camelCase (`disallowedTools`, `maxTurns`, `omitClaudeMd`, `autoCompactWindow`), unlike skill fields. A misspelled field is ignored silently. `claude --debug` writes `does not recognize or apply` with the likely intended name to `~/.claude/debug/<session-id>.txt` (v2.1.296 and later).
- `tools` is an allowlist and `disallowedTools` a denylist applied first. An entry with a specifier such as `Bash(git push *)` in `disallowedTools` removes the whole tool. To block one command, use a `permissions.deny` rule instead. If nothing in `tools` resolves, the agent fails to launch with an error naming the entries.
- Omit `Agent` from `tools` (or add it to `disallowedTools`) for a worker that must not spawn its own subagents. `Agent(type, ...)` allowlists work only for an agent run as the main session with `--agent`.
- `model` takes `sonnet`, `opus`, `haiku`, `fable`, a full model ID or `inherit`. A per-invocation model from the caller overrides it, and it overrides `CLAUDE_CODE_SUBAGENT_MODEL`. Use a full ID when the tier matters, because aliases resolve to older models on some providers.
- `skills` preloads the full content of up to 32 skills at startup. Skills with `disable-model-invocation: true` cannot be preloaded. Without the field the agent can still invoke skills through the Skill tool.
- `memory: project | user | local` gives the agent its own `MEMORY.md` (first 200 lines or 25 KB) and turns on Read, Write and Edit for it. It has no effect while auto memory is off.
- `omitClaudeMd: true` starts the agent without user, project and local `CLAUDE.md` (v2.1.271 and later). Use it for agents that take everything from the brief.
- `isolation: worktree` runs the agent in a temporary worktree branched from the default branch, not from `HEAD`, unless `worktree.baseRef` is `"head"`.
- `autoCompactWindow` takes a plain integer from `100000` to `1000000`. `200k` reads as 200 and is ignored.

## What the agent sees

- The markdown body replaces the Claude Code system prompt, plus environment details. Write it as a complete prompt for one job.
- A non-fork subagent starts with its body, the brief, `CLAUDE.md`, a git status snapshot and preloaded skills. It does not see the conversation, invoked skills, files already read, the output style or auto memory.
- The built-in Explore and Plan agents skip `CLAUDE.md` and git status. A rule they must follow goes in the brief. A user or project agent named `Explore` overrides the built-in, for example to pin `model: haiku`.
- Subagents started in the background, the default, keep only a reduced built-in tool set (Read, Grep, Glob, LSP, Bash, PowerShell, Edit, Write, WebFetch, WebSearch, Skill, SendMessage and a few more) plus every MCP tool. A definition can resolve to different tools in the foreground and the background.

## Descriptions and delegation

- Claude routes work by the description. Make each one specific enough to single out one agent. "Use proactively" in a description encourages automatic delegation, so add it only where delegation is wanted.
- The combined descriptions of custom agents over 15,000 tokens trigger a startup warning. Move detail into the body, which loads only when the agent runs.

## Files Claude Code skips

- A file in a project, user or managed `agents` directory is skipped without a notice in the session when it has no `name`, no `description`, a `name` with `:` or longer than 256 characters, frontmatter not on the first line, or YAML that does not parse. The reason goes to the debug log.
- `claude plugin validate .claude/agents` finds files whose frontmatter does not parse, but not files missing `name`.
- Two files in one `agents` tree with the same `name`: one loads, chosen by filesystem order. `/doctor` reports the duplicate.
- A new `agents` directory created after the session started is not watched. Restart once to load its first file.

## Scope and trust

- Priority for the same name: managed, then `--agents` JSON, then project, then user, then plugin.
- Frontmatter `hooks` and inline `mcpServers` in a project agent run only after the folder holding the file is trusted. Plugin agents ignore `permissionMode`, `hooks`, `mcpServers` and `initialPrompt`, so a plugin restricts its agents through `tools` and ships hooks and MCP servers at plugin level.
