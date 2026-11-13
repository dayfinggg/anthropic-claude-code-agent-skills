---
name: codebase-analysis
description: Mapping an unfamiliar codebase or area and finding everything a change can break before planning or editing it. Use when starting work in a repo, package or module you have not read, when asked how something works, where it is handled, what calls or uses it, whether it is dead or safe to remove, rename, retype or tighten, or for the blast radius or impact of changing a function, type, field, endpoint, column, config key, flag or event. Also use when reading a dependency's or another repo's source, and when running LSP find references or call hierarchy, ast-grep outline, dependency-cruiser, madge, knip, pydeps, grimp, cargo tree, go list, deptrac, jdeps, git log -S or -L, or git blame.
---

## Read first

Do these steps now, in order, before anything else and whatever the task. The files hold the traps this skill depends on, the pages tell you whether its versions are still current, and a skipped file or page is the usual cause of a wrong result.

1. Read `references/graph-tools.md` in full with the Read tool (Commands, Traps).
2. Fetch https://raw.githubusercontent.com/ast-grep/ast-grep.github.io/main/website/reference/cli/outline.md (`ast-grep outline` flags and JSON shape) with `curl -sL` or WebFetch and compare it with the facts below. Where the page shows a newer version than this skill names, follow the page.

## Check first

- Read how the code is built, run and deployed before any source: manifests, lockfiles and workspace files, Dockerfile and Compose, CI workflows, Procfile, Helm or Kubernetes manifests, serverless, cron and queue definitions, `.env.example`. Entry points usually live in deployment config, and without it most top-level modules look unreachable.
- List the navigation tools this session has: an `LSP` tool (present only with a code intelligence plugin and its server binary on `PATH`, inactive in cloud sessions), `ast-grep --version` (`outline` is an alpha preview since 0.44), and graph tools the repo already configures (`.dependency-cruiser.*`, `.madgerc`, `knip.json`, `[tool.importlinter]`, `deptrac.php`).
- `git rev-parse --is-shallow-repository` prints `true` when history is cut off. Log then stops early and blame charges every older line to the oldest fetched commit (marked `^`), so run `git fetch --unshallow` first.
- Facts verified 2026-11.

## Defaults

- Map from the outside in: entry points, then the module graph from a tool, then the source on the path the task touches. Stop when you can name the files to change, every reader of what changes, and the data each one reads and writes.
- A README, docs and diagrams often describe the intended architecture, not the current one. Check each claim you rely on against the tree, and report where they disagree.
- Runtime truth can sit outside the files you read: a config server, Vault, Helm values, environment substitution, a feature flag service, build logic in a shared config package or plugin. Note when tests run another stack than production, such as SQLite or H2 in tests and Postgres in production, since persistence behavior then differs.
- Read structure before bodies. `ast-grep outline <dir>` lists a subtree's exported items, `ast-grep outline <file>` lists a file's items and members with line numbers. Then read only the range you need.
- Use the compiler or language server, not regex, to resolve a symbol through imports, re-exports and aliases: go to definition, find references, find implementations, call hierarchy. Text search is for what has no symbol: config keys, routes, SQL, serialized names, code in other languages.
- When a subagent maps an area, give it questions about how the code works today and leave the task out, so its report describes what exists instead of what the task expects.
- Spot-check a sample of edges and paths from a graph tool or code map against the source before acting on them.
- Read a dependency at the version the lockfile resolves, not its default branch or your memory. The installed copy is what runs (`node_modules/<pkg>`, `vendor/`, the module's `__file__`, the `manifest_path` from `cargo metadata`), together with any local patch (a `patches/` folder, `patchedDependencies`, Cargo `[patch]`). For source with history, clone the tag once per session into the scratchpad with `git clone --filter=blob:none --branch <tag> <url> <dir>`. `npm view <pkg>@<version> gitHead` names the published commit when the package records it.
- Start from what the change takes away, adds or loosens: a removed or renamed symbol, key, route or column, a new required input, a changed default, return shape, error or timing, a newly accepted value. Each one is a search for its readers.
- Let the compiler list typed consumers: copy the file, make the breaking edit (delete or rename the symbol, change its type), run the typecheck in every package that can depend on it (`pnpm --filter "...<pkg>" run typecheck`, `cargo check --workspace --all-targets`), then restore the copy. Each error is a consumer. Dynamic and untyped readers are still missing.
- Follow what a symbol search misses: the JSON an API returns, a DB column, a wire format, another language reading the same bytes, a feature flag, code three hops downstream. Search serialized names (JSON tags, `serde(rename)`, field aliases, camelCase conversion), generated clients and fixtures, SQL strings, views, migrations and analytics jobs, CI, scripts and infrastructure code.
- String-keyed wiring escapes every static tool: DI containers and service config, routes, event and queue names, templates, pytest fixtures requested by parameter name, reflection and `getattr`. Search for the literal string.
- During a rolling deploy old and new code run side by side, and the rows, cache entries and queued messages the current version wrote reach the new code. Expand-contract sequencing is in concise:planning, schema changes in concise:database.
- For a take-away change (remove, rename, hide, tighten a validator, prune data), grep the remote default branch (`origin/main`) for every reader of the thing you take away. After `git fetch`, `git grep -n '<name>' origin/main` searches that tree without a checkout. Cover every entry point, not only the one you tested: web, CLI, cron, workers, other apps and packages in the workspace, release branches. Do not derive the list from the goal or from the docs.
- Loosened acceptance breaks unchanged consumers. For a new enum value, status, accepted format or wider type, read every consumer that switches on, filters, stores or displays it. The broken code is usually outside the diff.
- For transitive reach, run the stack's graph tool in machine-readable output and read the data, not a picture.
- History explains why code has its shape. `git log -G'<regex>' -- <path>` finds the commits that added or removed a matching line, `git log -L` follows one function, `git blame -w -C -C -C` follows lines moved or copied from other files in any commit. Files that keep changing with the target are coupled even without an import: `git log --format= --name-only --full-diff -- <path> | sort | uniq -c | sort -rn | head -20`. Without `--full-diff` the path limit also hides the other files.
- A search that finds nothing is not proof of no use. Public APIs, published packages, webhooks, routes, columns and environment variables can have readers outside the repository. Report them as "no consumer found", not as unused.
- Do not call code dead while it could be the target of a dynamic call (reflection, string-built names, convention-based DI or routing). Record those call sites instead.
- Name the one fact the change's safety rests on, such as "this path only evicts entries that already expired", and check it with a script or test that runs the real code. A cited `file:line` is weaker evidence, and your own summary is none.
- Report each reader as `path:symbol` with its entry point and why it still works or how it breaks, plus the check that shows it. Then name what you cleared, the searches that found nothing, and the safety fact marked proven or unproven.

## Gotchas

- Find references covers only what the language server loaded, in one build configuration. gopls answers for the queried file's build tags and OS, rust-analyzer enables no extra Cargo features by default and treats code under a disabled `#[cfg]` as inactive, and TypeScript leaves projects out when a tsconfig sets `disableReferencedProjectLoad` or `disableSolutionSearching`. Grep the code that other configurations build.
- Call hierarchy leaves out dynamic calls (function values, interface dispatch, callbacks), so incoming calls are not exhaustive. Run find references as well, and find implementations for an interface or abstract method.
- In a monorepo, a language server that is not configured for the workspace reports internal imports as unresolved. Those diagnostics are not breakage. Confirm with the repo's typecheck command.
- `rg` skips hidden paths (`.github/`, `.husky/`, `.storybook/`), gitignored files (often generated code) and binary files by default. Add `--hidden`, or `-uu` to also search ignored files.
- `rg` is recursive already, and `-r` means `--replace`. `rg -r name .` takes `name` as replacement text and `.` as the pattern, so it prints every line.
- Claude Code's Grep tool skips gitignored files, so pass a generated file's path directly. Its Glob tool does list gitignored files.
- `git grep` searches tracked files only, hidden ones included. Add `--untracked` for new files and `--recurse-submodules` for submodules.
- `ast-grep outline` is syntax only. It resolves no references, types or re-export chains, and a directory shows only exported names unless you pass `--items structure` or `--items all`. Pattern syntax and its traps, such as `-l ts` skipping `.tsx` and skipped hidden files, are in concise:codemods.
- `git log -S'<text>'` lists only commits that change how often the text occurs, so it misses a commit that edits a line containing it. Use `-G'<regex>'` for any added or removed line that matches.
- `git log -L :<name>:<file>` finds the function by the diff driver's hunk-header rule. Without a `diff` attribute only lines starting with a letter, `_` or `$` count, so an indented method fails with "no match". Add `*.py diff=python` (built-ins include `python`, `rust`, `php`, `java`, `golang`, `csharp`, `kotlin`, `ruby`) to `.git/info/attributes`, or give a line range such as `-L 120,180:<file>`. JavaScript and TypeScript have no built-in driver.
- `--follow` works for one file only, and `git log -- <dir>` stops at the commit that moved the directory. Pass the old path as a second pathspec.
- `git blame` applies `.git-blame-ignore-revs` only when `blame.ignoreRevsFile` is set. Pass `--ignore-revs-file .git-blame-ignore-revs` so reformatting commits do not hide the author of a line.
- `vitest related --run <files>` runs only the tests that import those files statically, so a test reaching them through a dynamic `import(path)` is left out.
