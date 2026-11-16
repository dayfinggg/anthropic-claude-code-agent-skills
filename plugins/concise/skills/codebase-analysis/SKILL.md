---
name: codebase-analysis
description: Mapping unfamiliar code, finding everything a change can break, and then making a wide mechanical change everywhere. Use when starting in code you have not read, when asked what calls or uses something or whether it is safe to remove, rename or retype, for the blast radius of a change, when renaming or replacing something across many files, for codemods (ast-grep, ts-morph, LibCST, Rector, OpenRewrite) and for framework or library upgrades.
---

# Codebase analysis

This skill covers reading code you have not seen, finding every reader of what a change touches, and applying one change across many files. It matches ast-grep 0.51, dependency-cruiser 18.7, madge 8.0, knip 6.45, grimp 3.20, deptrac 4.7 and Git 2.56. Check what is installed with `ast-grep --version`, `npx <tool> --version` and `git version`. Where the installed release is newer, its own `--help` and release notes are right.

## References

Each file below holds what this page only names. Read it in full with the Read tool before the first step its condition describes, also when that step comes late in a long task or after a compaction.

- [references/graph-tools.md](references/graph-tools.md): read before running a dependency graph, reverse dependency or unused-code tool (dependency-cruiser, madge, knip, pnpm filters, pydeps, grimp, cargo tree, go list, deptrac, jdeps).
- [references/codemods.md](references/codemods.md): read before renaming, moving or replacing something across many files, writing or running an ast-grep, jscodeshift, ts-morph, LibCST, Rector, OpenRewrite or Codemod registry transform, or planning a framework, library or runtime upgrade.

## Check first

- Read how the code is built, run and deployed before any source: manifests, lockfiles and workspace files, Dockerfile and Compose, CI workflows, Procfile, Helm or Kubernetes manifests, serverless, cron and queue definitions, `.env.example`. Entry points usually live in deployment config, and without it most top-level modules look unreachable.
- List the navigation tools this session has. Claude Code's `LSP` tool stays inactive until a code intelligence plugin is installed and its server binary is on `PATH`, and it never starts in cloud sessions. Also look for graph tools the repo already configures (`.dependency-cruiser.*`, `.madgerc`, `knip.json`, `[tool.importlinter]`, `deptrac.php`).
- `git rev-parse --is-shallow-repository` prints `true` when history is cut off. Log then stops early and blame charges every older line to the oldest fetched commit (marked `^`), so run `git fetch --unshallow` first.

## Mapping an area

- Map from the outside in: entry points, then the module graph from a tool, then the source on the path the task touches. Stop when you can name the files to change, every reader of what changes, and the data each one reads and writes.
- A README, docs and diagrams often describe the intended architecture, not the current one. Check each claim you rely on against the tree, and report where they disagree.
- Runtime truth can sit outside the files you read: a config server, Vault, Helm values, environment substitution, a feature flag service, build logic in a shared config package. When tests run another stack than production (SQLite or H2 in tests, Postgres in production), persistence behavior differs.
- Read structure before bodies. `ast-grep outline <file>` lists a file's items and members with line numbers, `ast-grep outline <dir>` lists the exported names of a subtree. Then read only the range you need.
- Resolve a symbol through imports, re-exports and aliases with the compiler or language server (definition, references, implementations, call hierarchy), not a regex. Text search is for what has no symbol: config keys, routes, SQL, serialized names, code in other languages.
- When a subagent maps an area, give it questions about how the code works today and leave the task out, so its report describes what exists instead of what the task expects.
- For transitive reach, run the stack's graph tool with machine-readable output and spot-check a few edges against the source before acting on them.
- Read a dependency at the version the lockfile resolves, not its default branch or your memory. The installed copy is what runs (`node_modules/<pkg>`, `vendor/`, the module's `__file__`, `manifest_path` from `cargo metadata`), plus any local patch (`patches/`, `patchedDependencies`, Cargo `[patch]`). For history, clone the tag once into the scratchpad with `git clone --filter=blob:none --branch <tag> <url> <dir>`. `npm view <pkg>@<version> gitHead` names the published commit when the package records it.

## Blast radius

- Start from what the change takes away, adds or loosens: a removed or renamed symbol, key, route or column, a new required input, a changed default, return shape, error or timing, a newly accepted value. Each one is a search for its readers.
- Let the compiler list typed consumers: copy the file, make the breaking edit, run the typecheck in every package that can depend on it (`pnpm --filter "...<pkg>" run typecheck`, `cargo check --workspace --all-targets`), then restore the copy. Each error is a consumer. Dynamic and untyped readers are still missing.
- Follow what a symbol search misses: JSON an API returns, a DB column, a wire format, another language reading the same bytes, a feature flag. Search serialized names (JSON tags, `serde(rename)`, field aliases, camelCase conversion), generated clients and fixtures, SQL strings, views, migrations, analytics jobs, CI, scripts and infrastructure code.
- String-keyed wiring escapes every static tool: DI containers and service config, routes, event and queue names, templates, pytest fixtures requested by parameter name, reflection and `getattr`. Search for the literal string.
- For a take-away change (remove, rename, hide, tighten a validator, prune data), search the remote default branch: after `git fetch`, `git grep -n '<name>' origin/main` searches that tree without a checkout. Cover every entry point (web, CLI, cron, workers, other workspace packages, release branches), not only the one you tested.
- Loosened acceptance breaks unchanged consumers. For a new enum value, status, accepted format or wider type, read every consumer that switches on, filters, stores or displays it. The broken code is usually outside the diff.
- During a rolling deploy old and new code run side by side, and rows, cache entries and queued messages written by the current version reach the new code.
- A search that finds nothing is not proof of no use. Public APIs, published packages, webhooks, routes, columns and environment variables can have readers outside the repository: report "no consumer found", not "unused". Code that could be the target of a dynamic call (reflection, string-built names, convention-based DI or routing) is not dead either.
- Name the one fact the change's safety rests on, such as "this path only evicts entries that already expired", and check it with a script or test that runs the real code. A cited `file:line` is weaker evidence, and your own summary is none.
- Report each reader as `path:symbol` with its entry point and why it still works or how it breaks, plus the check that shows it. Then list what you cleared, the searches that found nothing, and the safety fact marked proven or unproven.

## History

- `git log -G'<regex>' -- <path>` finds commits that added or removed a matching line, `git log -L :<name>:<file>` follows one function, and `git blame -w -C -C -C` follows lines moved or copied from other files.
- Files that keep changing with the target are coupled even without an import: `git log --format= --name-only --full-diff -- <path> | sort | uniq -c | sort -rn | head -20`. Without `--full-diff` the path limit also hides the other files.

## Wide mechanical changes

- Once the readers are known, make a change that must reach many files with a syntax-aware engine (ast-grep, ts-morph, jscodeshift, LibCST, Rector, OpenRewrite), not `sed` or a regex, which also rewrites strings, comments and lookalike names.
- Count the sites before the run, give the transform fixtures, run it twice to prove it is idempotent, apply it in shards that each build, then search the old form as plain text. Engine choice, flags and traps are in the reference below.
- For a framework, library or runtime upgrade, keep only the breaking changes this code uses, and move one major version and one component at a time.
- For a migration or rewrite that must keep behavior, use the old system as the oracle: run old and new on the same generated inputs or a sample of production traffic and diff the outputs. concise:testing has the details of such a differential test.

## Gotchas

- Find references covers only what the language server loaded, in one build configuration. gopls answers for the queried file's build tags and OS, rust-analyzer enables no extra Cargo features by default, and TypeScript leaves projects out when a tsconfig sets `disableReferencedProjectLoad` or `disableSolutionSearching`. Grep the code that other configurations build.
- Call hierarchy leaves out dynamic calls (function values, interface dispatch, callbacks). Run find references as well, and find implementations for an interface or abstract method.
- In a monorepo, a language server not configured for the workspace reports internal imports as unresolved. That is not breakage: confirm with the repo's typecheck command.
- `rg` skips hidden paths (`.github/`, `.husky/`), gitignored files (often generated code) and binary files. Add `--hidden`, or `-uu` to also search ignored files. `rg` is recursive already and `-r` means `--replace`, so `rg -r name .` prints every line.
- Claude Code's Grep tool skips gitignored files, so pass a generated file's path directly. Its Glob tool does list gitignored files.
- `git grep` searches tracked files only, hidden ones included. Add `--untracked` for new files and `--recurse-submodules` for submodules.
- `ast-grep outline` is syntax only: it resolves no references, types or re-export chains. A directory shows only exported names unless you pass `--items structure` or `--items all`.
- `git log -S'<text>'` lists only commits that change how often the text occurs, so it misses an edit to a line that contains it. Use `-G'<regex>'`.
- `git log -L :<name>:<file>` finds the function by the diff driver's hunk-header rule. Without a `diff` attribute only lines starting with a letter, `_` or `$` count, so an indented method fails with "no match". Add `*.py diff=python` (built-ins include `python`, `rust`, `php`, `java`, `golang`, `csharp`, `kotlin`, `ruby`) to `.git/info/attributes`, or give a range such as `-L 120,180:<file>`. JavaScript and TypeScript have no built-in driver.
- `--follow` works for one file only, and `git log -- <dir>` stops at the commit that moved the directory. Pass the old path as a second pathspec.
- `git blame` applies `.git-blame-ignore-revs` only when `blame.ignoreRevsFile` is set. Pass `--ignore-revs-file .git-blame-ignore-revs` so reformatting commits do not hide a line's author.
- `vitest related --run <files>` runs only tests that import those files statically, so a test that reaches them through a dynamic `import(path)` is left out.

Related skills: concise:planning for expand-contract ticket order, concise:database for schema changes, concise:php for Rector configuration, concise:typescript-javascript, concise:python and concise:rust for each stack's upgrade facts and official codemods.
