---
name: codemods
description: Structural code search and large mechanical code changes, plus framework, library and runtime version upgrades. Use when one change must reach many files or call sites (rename or move a symbol, replace a deprecated API, change a signature or import path, swap a library), when the user says "codemod", "rename it everywhere", "replace all calls to", "migrate from X to Y" or "upgrade to the next major", when writing or running ast-grep (sg, sgconfig.yml, rule YAML), jscodeshift, ts-morph, LibCST, Rector, OpenRewrite or a Codemod registry package, when a sed or regex replace across files is tempting, when an ast-grep pattern matches nothing, or when sequencing a multi-version upgrade.
---

## Read first

Do these steps now, in order, before anything else and whatever the task. The files hold the traps this skill depends on, and a skipped file or page is the usual cause of a wrong result.

1. Open https://ast-grep.github.io/llms.txt (ast-grep docs index, every page also served as `.md`) and compare it with the facts below.
2. Open https://registry.npmjs.org/@ast-grep/cli/latest (Current ast-grep release) and compare it with the facts below.

## Check first

- Start from a clean working tree, so `git diff` after a run shows only what the tool wrote.
- Look for the official migration path before writing a transform: the upgrade guide of every version between the current and the target, and the project's own codemod. `npx codemod search <terms>` searches the Codemod registry, and `npx codemod run <package> --dry-run` previews one. Version facts and official codemods per stack live in concise:typescript-javascript, concise:python, concise:php (Rector) and concise:rust (`cargo fix`).
- Current releases in 2026-11: ast-grep 0.51.2, jscodeshift 17.4.0, ts-morph 28.0.0, LibCST 1.9.0, Codemod CLI 1.18.7. Run ast-grep without installing it as `npx -p @ast-grep/cli@0.51.2 ast-grep` or `uvx --from ast-grep-cli ast-grep`. Plain `npx @ast-grep/cli` fails with "could not determine executable to run".
- Facts verified 2026-11.

## Defaults

- Edit code with a syntax-aware engine, not `sed` or a regex, which also rewrites strings, comments and lookalike names.
- Pick the engine by what decides a match:
  - Syntax alone, any language: ast-grep (`run -p ... -r ...` for one pattern, `scan` with YAML rules for several).
  - TypeScript or JavaScript symbols and types (rename an export in every file, follow imports, aliases and re-exports, find calls on one type): ts-morph.
  - An existing jscodeshift transform, which many frameworks ship: jscodeshift.
  - Python: LibCST, run as `python -m libcst.tool codemod <module.Class> <paths>`.
  - PHP: Rector, configured as in concise:php.
  - JVM: OpenRewrite. `mvn rewrite:dryRun` writes `target/rewrite/rewrite.patch` and leaves sources alone. Maven Central stops at rewrite-recipe-bom 3.38.0 and rewrite-maven-plugin 6.46.1 (2026-08). Newer releases come only from the Code Genome Project repository, which needs a download token in `settings.xml` or `~/.gradle/gradle.properties`.
- Count the sites before changing anything: run the search with `ast-grep run ... --json=stream` and keep the matches per file. Compare that count with what the run changed and with what is left.
- Give every transform three fixtures: a matching input with its expected output, an input that must stay unchanged, and an edge case. Every transform must be safe on non-matching code. For ast-grep rules, write them as `valid` and `invalid` cases in a `testConfigs` directory named in `sgconfig.yml` and run `ast-grep test`.
- Run the transform again on its own output and expect no change. A second pass that edits again is a bug.
- "If your recipe cannot determine that a change is safe, it should make no changes rather than making a potentially wrong change." Skip such sites and list them for hand review.
- Apply in shards, one package or directory each, that each build and pass their tests and can each be committed. Commit the generated change apart from hand fixes, and put the exact command in the commit message so a reviewer can rerun it and compare.
- Run the project's formatter on the changed files only.
- After the run, search the old form as plain text with `git grep -n '<old>'`. Strings, docs, config, generated code and other languages still hold it, and a pattern that stops matching proves only that it stops matching.
- When every caller has moved, delete the old path. Keep an alias, shim or fallback only for a named contract: a public API, CLI, config or stored data, a tagged upgrade, a security boundary or observed production state. Tests alone are not a contract. Ask when unsure. Ticket order for expand, migrate and contract is in concise:planning, readers that a symbol search misses are in concise:codebase-analysis.
- For an upgrade, list the breaking and behavioral changes between the two versions, then keep only what this code uses, each with `file:line`. Only deltas in the intersection matter.
- Mark each delta mechanical (a codemod applies it) or judgment. A change that compiles and runs but returns a different result (defaults, encoding, locale, serialization, time zones, security defaults) gets a characterization test before any edit.
- Split a move across several majors, or of two things at once such as a runtime and a framework, into hops that each build and pass their tests before the next starts, such as Java 8, 11, 17, 21. Upgrade one authority at a time: runtime, build tool, compiler, framework, then libraries.
- Record the old version's per-test results before the first edit. The upgraded code must reproduce them test by test, not only end green.
- Migrate one representative module first, not the easiest one. Add every surprise it shows to the delta list, then batch the rest.
- Check test and build tooling against the target before the bump: Testcontainers, MockK, bytecode instrumentation, and coverage tooling often lag core platform upgrades.
- A migration tool that is installed but could not restore or build the project here found nothing. Report that coverage as missing, not as clean.

## Gotchas

- On Linux `sg` is the `setgroups` command. Call `ast-grep`.
- `ast-grep --lang ts` covers `.ts`, `.cts` and `.mts` only. Run `.tsx` again with `--lang tsx`. `--lang js` includes `.jsx`. Without `--lang` the language follows each file's extension.
- ast-grep skips hidden and gitignored files, such as `.github/` and generated code. Pass `--no-ignore hidden --no-ignore vcs` when they are in scope.
- `ast-grep run -r` and `scan` with a `fix` print a diff and change nothing until you add `-U`.
- `ast-grep run` exits 0 when something matched and 1 when nothing did. `scan` exits 1 only when a rule with `severity: error` matched. A rule without `severity`, or at `warning`, exits 0, so a gate needs `severity: error` or `--error`.
- A pattern matches the syntax as written, not the resolved symbol. `env::var($X)` does not match `std::env::var("X")`, and a call through an alias or re-export never matches. ast-grep has no scope or type information, so run every spelling or use the compiler (ts-morph, the language server) when names resolve through imports.
- `has` and `inside` look only one level down or up. Add `stopBy: end` to search the whole subtree or every ancestor.
- A metavariable is one whole node, so `use$HOOK` is literal text. Match `$HOOK($$$ARGS)` with `constraints: { HOOK: { regex: '^use' } }`.
- In a fix, `$VARName` reads as the metavariable `$VARN` followed by `ame`, and a metavariable the rule did not capture becomes an empty string, so `bar($A, $MISSING)` writes `bar(1, )`. Build new names with a `transform`.
- A pattern must parse on its own. `"key": $V` fails as a JSON pattern, so give the parser context and select the node: `pattern: { context: '{"key": "$V"}', selector: pair }`. A `kind` next to a `pattern` is a second rule, not a parse hint.
- Rule keys apply in no fixed order, and the first rule that captures a metavariable fixes its value. Put rules that share a capture under `all:` in the order they must run.
- `--json` line numbers start at 0. Inspect a pattern that matches nothing with `--debug-query=pattern`.
- jscodeshift parses every file with `--parser=babel` unless the transform exports `parser`, and that parser fails on TypeScript. Parse errors still exit 0 unless `--fail-on-error` is set. Run `--extensions=ts --parser=ts` and `--extensions=tsx --parser=tsx` as separate passes, because the tsx parser rejects `<T>value` assertions.
- jscodeshift transforms `node_modules` and gitignored output under the paths it gets. Pass `--gitignore` and `--ignore-pattern='**/node_modules/**'`, or feed `git ls-files` output through `--stdin`.
- ts-morph `rename()` turns `{ a }` into `{ b }`, which changes the object's key, and renames the exported name in `export { a }`. Pass `{ usePrefixAndSuffixText: true }` to get `{ a: b }` and `export { b as a }`. Comments and strings keep the old name unless `renameInComments` and `renameInStrings` are set.
- ts-morph writes nothing until `project.save()`. `replaceWithText()` forgets the replaced node, and `insertText()`, `replaceText()` or `removeText()` on a node forgets every descendant you navigated to. A forgotten node throws when used, so navigate to it again. Collect everything that needs the type checker before the first edit, since every edit resets the program.
- ts-morph 28 bundles TypeScript 6.0.2 and ignores the project's `typescript` package.
- LibCST `leave_*` methods must build on `updated_node`. A change made to `original_node` throws away every edit already applied to its children.
- Pass `config=module.config_for_parsing` to `parse_statement()` and `parse_expression()`, or inserted code can get other line endings and indentation than the module.
- Without a `.libcst.codemod.yaml`, `libcst.tool codemod` pipes each result through `black -` and counts the file as failed when black is missing or cannot parse the syntax. Pass `--no-format` and run the project's formatter, and preview with `-u` placed after the paths. It also skips files marked `@generated` unless `--include-generated` is set.
- LibCST before 1.9.0 (2026-07) fails to parse Python 3.15 `lazy import`. 1.8.4 added t-strings.
