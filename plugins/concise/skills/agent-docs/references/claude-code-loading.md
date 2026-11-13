## `AGENTS.md` in Claude Code

- Claude Code reads `AGENTS.md` only when no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` exists in the working directory or above. `~/.claude/CLAUDE.md`, a managed `CLAUDE.md` and `.claude/rules/` do not count for that check.
- Adding a `CLAUDE.local.md` to a project that relies on `AGENTS.md` silently stops Claude reading `AGENTS.md`. Set Project instructions to `claude-md-and-agents-md` in `/config`, or import the file.
- A `CLAUDE.md` sentence that says "read AGENTS.md" loads it only if Claude decides to open it. Use the `@AGENTS.md` import.
- A `CLAUDE.md` symlinked to `AGENTS.md` breaks for anyone cloning on Windows: without `core.symlinks`, git checks it out as a one-line text file. Use the import.
- Claude Code ignores `AGENTS.override.md`, `AGENTS.local.md` and anything under `.agents/`. Codex reads `AGENTS.override.md` in place of `AGENTS.md` in a directory and stops adding files at 32 KiB combined by default (`project_doc_max_bytes`).
- Gemini CLI reads `AGENTS.md` only when `context.fileName` in its `settings.json` lists it. Devin injects only the first 16 KiB of each `AGENTS.md`. Cursor ignores plain `.md` files in `.cursor/rules`, where project rules need `.mdc`.
- A subdirectory's `AGENTS.md` loads when Claude opens a file there with the Read tool and that subdirectory has no `CLAUDE.md` of its own.

## Load order and size

- Every `CLAUDE.md` from the filesystem root down to the working directory is concatenated, root first, with `CLAUDE.local.md` after `CLAUDE.md` at each level. Nothing overrides anything. User rules load before project rules, and on a conflict Claude may follow either.
- Files above the working directory load at launch. A subdirectory's `CLAUDE.md` and matching path-scoped rules load when Claude reads, writes or edits a file there, which includes viewing one file with `cat`, `head`, `tail`, `grep` or `sed -n` without pipes or redirects.
- Files that load on demand (subdirectory `CLAUDE.md`, their imports, path-scoped rules) are cut to their start past 40,000 characters in a 200K context, or 150,000 in a 1M context on current models (v2.1.309 and later). Check with `wc -m`.
- A `CLAUDE.md` over 4 MiB is skipped entirely. A long file gets a startup warning, and so do files that add up past a combined limit.
- The project-root `CLAUDE.md` is re-read after compaction. Nested files and path-scoped rules return only when a matching file is touched again.
- Auto memory loads the first 200 lines or 25KB of `MEMORY.md` per project into every session, and Claude skips saving what `CLAUDE.md` already says. Audit it with `/memory` along with the instruction files, since old cautions live there too.

## Imports and comments

- An `@path` import expands inline and costs the same context as pasting the file. It organizes, it does not save tokens. Paths resolve relative to the importing file, and imports nest at most four hops.
- `@path` inside backticks or a code block stays literal text. A path with spaces needs a backslash before each space, and a quoted path is not imported at all.
- An import that resolves outside the working directory shows a one-time approval dialog. If the user declines, the import stays disabled with no further prompt.
- Block-level HTML comments (`<!-- note -->`) are stripped before the file reaches Claude. Use them for maintainer notes that cost no tokens.

## Rules files

- `.claude/rules/**/*.md` without frontmatter load at launch with the same priority as `.claude/CLAUDE.md`. Give each file one topic.
- `paths:` is the only frontmatter field a rule reads, and other fields are ignored without an error. If the YAML does not parse, the rule loads as if it had no `paths` and applies everywhere.
- Patterns resolve against the directory that holds the `.claude` folder. Brace expansion works (`src/**/*.{ts,tsx}`). A literal `[` needs escaping as `\[`.
- A symlinked rule that points outside the working directory waits for the external-import approval, and after approval only rules without `paths` load from it.
