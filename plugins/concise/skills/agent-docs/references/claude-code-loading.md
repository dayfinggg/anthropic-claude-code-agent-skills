# How Claude Code loads CLAUDE.md, AGENTS.md, rules and auto memory

## AGENTS.md in Claude Code

- Claude Code reads `AGENTS.md` and `.claude/AGENTS.md` only when no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` exists in the working directory or above. `~/.claude/CLAUDE.md`, a managed `CLAUDE.md` and `.claude/rules/` do not count for that check and load alongside it.
- Adding a `CLAUDE.local.md` to a project that relies on `AGENTS.md` silently stops Claude reading `AGENTS.md`. Set Project instructions to `claude-md-and-agents-md` in `/config`, or import the file.
- Project instructions takes `claude-md-or-agents-md` (the default), `claude-md-and-agents-md`, `claude-md` or `managed-only`. In a settings file the key is `pluginConfigs."cc-plugin-agents-md@builtin".options.instructionFiles`, read only from `~/.claude/settings.json`, `--settings` or managed settings. Before v2.1.285 the ID was `agents-md@builtin`.
- A `CLAUDE.md` sentence telling Claude to read `AGENTS.md` loads it only if Claude decides to open it. The `@AGENTS.md` import always loads it and never twice.
- A `CLAUDE.md` symlinked to `AGENTS.md` breaks in Windows clones, where git without `core.symlinks` checks it out as a one-line text file, and the Edit and Write tools refuse to write through the link. Use the import.
- A `SessionStart` hook that prints `AGENTS.md` adds a second copy once Claude reads the file directly. Remove it.
- Claude Code ignores `AGENTS.override.md`, `AGENTS.local.md` and anything under `.agents/`. A subdirectory's `AGENTS.md` loads when Claude opens a file there with the Read tool and that subdirectory has no `CLAUDE.md` of its own.
- An `AGENTS.md` read through the setting fires no `InstructionsLoaded` hook and does not load from `--add-dir` directories.

## Load order and size

- Every `CLAUDE.md` from the filesystem root down to the working directory is concatenated, root first, with `CLAUDE.local.md` after `CLAUDE.md` at each level, and nothing overrides anything. User rules load before project rules, and on a conflict Claude may follow either.
- Files above the working directory load at launch. A subdirectory's `CLAUDE.md` and matching path-scoped rules load when Claude reads, writes or edits a file there, including a Bash read of one file such as `cat` or `head`.
- Files that load on demand (a subdirectory's `CLAUDE.md`, its imports, path-scoped rules) are cut to their start past 40,000 characters in a 200K context, or 150,000 in a 1M context on models after Opus 4.6 and Sonnet 4.6 (v2.1.309 and later). Check with `wc -m`.
- A file loaded at launch arrives whole up to 4 MiB and is skipped above that. Long files, and files that add up past a combined limit, get a startup warning.
- The project-root `CLAUDE.md` is re-read after compaction. Nested files and path-scoped rules return only when a matching file is touched again.
- `claudeMdExcludes` takes glob patterns on absolute paths in any settings layer and skips other teams' files in a monorepo, but not the managed `CLAUDE.md`.
- `--add-dir` directories load their `CLAUDE.md` and rules only with `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1`, and then only rules without `paths`.
- A gitignored `CLAUDE.local.md` exists only in the worktree where it was created. For personal instructions across worktrees, import a file from the home directory.
- An `InstructionsLoaded` hook logs which files load and why.

## Imports and comments

- An `@path` import expands inline and costs the same context as pasting the file. Paths resolve relative to the importing file, and imports nest at most four hops.
- `@path` inside backticks or a code block stays literal. A path with spaces needs a backslash before each space, and a quoted path is not imported at all.
- An import that resolves outside the working directory shows a one-time approval dialog, and if the user declines, the import stays disabled with no further prompt.
- Block-level HTML comments are stripped before the file reaches Claude, except inside code blocks, so they hold maintainer notes at no token cost.

## Rules files

- `.claude/rules/**/*.md` files without frontmatter load at launch with the same priority as `.claude/CLAUDE.md`. Give each file one topic.
- `paths:` is the only frontmatter field a rule reads, and other fields are ignored without an error. If the YAML does not parse, the rule loads as if it had no `paths` and applies everywhere.
- Project rule patterns resolve against the directory that holds the `.claude` folder, user rules against the session's working directory. Brace expansion works (`src/**/*.{ts,tsx}`), and a literal `[` is escaped as `\[` inside single quotes.
- A symlinked rule that points outside the working directory waits for the external-import approval, after which only its rules without `paths` load. A symlink to a network path (a UNC share, `/net`, `/Network`) is not followed.

## Auto memory

- Claude writes notes to `~/.claude/projects/<project>/memory/`, one machine-local directory per git repository shared by all its worktrees. Types are `user`, `feedback`, `project` and `reference`, and Claude skips what the code or `CLAUDE.md` already says.
- The first 200 lines or 25 KB of `MEMORY.md` load into every session, and topic files load only when Claude reads them. Writes past the limit succeed, but the excess is dropped on the next load.
- Main-conversation memory does not reach subagents, except a fork. A subagent's `memory` field gives it its own directory.
- Audit memory with `/memory` along with the instruction files, because old cautions live there too. A request to remember something goes to auto memory, and one to add it to `CLAUDE.md` goes to the file.
- Turn it off with the `/memory` toggle, `autoMemoryEnabled: false` per project, or `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`.

## Other agents' instruction files

- Codex reads `AGENTS.override.md` in place of `AGENTS.md` in a directory, at most one file per directory from the project root down, and stops adding files at 32 KiB combined by default (`project_doc_max_bytes`). Its skills live in `.agents/skills`.
- Gemini CLI reads `GEMINI.md` by default and reads `AGENTS.md` only when `context.fileName` in its `settings.json` lists it. Its skills live in `.gemini/skills` or `.agents/skills`.
- Cursor ignores plain `.md` files in `.cursor/rules`, where project rules need `.mdc`. Cursor CLI also reads `AGENTS.md` and `CLAUDE.md` at the project root.
- Devin injects only the first 16 KiB of each `AGENTS.md` and always-on rule file, so critical lines go near the top.
