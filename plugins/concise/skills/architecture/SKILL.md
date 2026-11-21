---
name: architecture
description: Load before creating or reorganizing a project or monorepo, deciding where code and tests go, splitting a module or a service, adding dependency rules or breaking import cycles, designing for reliability, scale or data ownership, or writing ADRs, C4 docs or Spec Kit, Kiro or OpenSpec specs. Plans and tickets belong to planning, the blast radius of a change to codebase-analysis.
---

# Architecture

This skill covers where code goes, how modules stay apart, which architecture style to pick, how a system handles failure and load, and how decisions and specs are recorded. It matches dependency-cruiser 18.8, eslint-plugin-boundaries 7.4, Nx 24, Turborepo 2.11, deptrac 4.7, import-linter 2.17, ArchUnit 1.5, cargo-deny 0.21, Composer 2.11, MADR 4.0.0, Spec Kit 1.4.2 and OpenSpec 2.1.0. Check an installed tool with its `--version` flag, and where it is newer, its release notes are right about options and defaults.

## References

- Read [references/boundary-tools.md](references/boundary-tools.md) before adding, configuring, upgrading or debugging a dependency-boundary or cycle check.
- Read [references/spec-formats.md](references/spec-formats.md) when the repo has `.specify/`, `.kiro/` or `openspec/`, or the user asks for spec-driven development.
- Read [references/system-design.md](references/system-design.md) before designing or reviewing how a service handles failure, load, data ownership, interface changes or operation, splitting a service out, or replacing a legacy system.

## Check first

- Before moving or adding modules, read what the repo already decided: ADRs (`docs/decisions/`, `docs/adr/`, `doc/arch/`), specs (`.specify/`, `.kiro/`, `openspec/`) and boundary configs (`.dependency-cruiser.*`, `boundaries/` settings in `eslint.config.*`, `tags` in `project.json`, `boundaries` in `turbo.json`, `deptrac.php` or `deptrac.yaml`, `[tool.importlinter]`, ArchUnit tests, `deny.toml`).
- `git config core.ignorecase` prints `true` on a checkout where a wrong-case file name passes locally and fails on Linux.

## Module design

- Draw a module around the design decision most likely to change, such as a storage format, a provider or a pricing rule, not around processing steps such as read, parse and save. A boundary fits when one user story touches mostly one module.
- Split a module when a second person or source asks for changes to it, not because it is long. One module with a small interface over much functionality beats several shallow ones that only pass calls through.
- Share code between modules only for one concept with one owner, because a wrong shared abstraction costs more than duplication.
- Use bounded contexts, one model and vocabulary inside an explicit boundary of team, code and schema, only when several teams share a large domain.

## Layout

- In new code, put business capabilities at the top level (`billing/`, `catalog/`) and technical roles and layers (interface, application, domain, infrastructure) inside each, because top-level `controllers/`, `services/` and `utils/` folders spread every change across the tree.
- Give each module one public entry point and import only that from outside: its `index.ts`, a package's `exports` map, a Python package's `__init__.py` with `__all__`, or a Rust crate root with internals at `pub(crate)`. Add no re-export `index` files in subfolders.
- In JS and TS workspaces, deployables go in `apps/*` and libraries and shared configs in `packages/*`, one level deep. Depend on a sibling with `"workspace:*"` and import it by name, not by a `../` path. Packages extend a shared tsconfig package, so the root needs no `tsconfig.json`.
- A Rust workspace has a virtual root manifest with `members = ["crates/*"]` and crates flat under `crates/`. `[profile.*]` and `[patch]` work only in the root manifest.
- Python code goes in `src/<package>/` and tests in `tests/`, run by pytest with `--import-mode=importlib`, because the default `prepend` mode fails with "import file mismatch" when two test files share a name.
- PHP's PSR-4 maps a namespace prefix to a base directory, each sub-namespace to a subdirectory of the same case and the class to the file name, with tests under `autoload-dev`. In CI run `composer dump-autoload --optimize --dry-run --strict-psr --strict-ambiguous` (`--strict-ambiguous` needs 2.8+), which fails on mapping errors, on a class found in two files and on paths that differ only in case.
- Use one term per domain concept in module names, code, tests, specs and UI, so one search finds all of it, and name modules after what they hold rather than `utils`, `helpers`, `common` or `misc`.

## Boundaries

- Enforce each dependency rule with a check that fails CI. Domain code imports no framework, database or HTTP code, adapters import the domain, and a feature reaches another only through its entry point.
- Write the fix into the rule's message, because the agent that breaks a rule reads only the error: dependency-cruiser `comment` (shown with `--output-type err-long`), import-linter `broken_contract_guidance` (2.14+), eslint-plugin-boundaries `message`. Name the ADR behind the rule.
- When adding a rule to existing code, baseline today's violations and fail only on new ones. Shrinking the baseline is routine, and growing it is the user's call.
- `disallowWorkspaceCycles: true` in `pnpm-workspace.yaml` turns a package cycle into an install failure, and Cargo rejects crate cycles itself.

## Architecture style

- Default to a modular monolith: one deployable, modules by business capability, each module the only reader and writer of its own tables.
- Inside a module whose features share little logic, use vertical slices, one folder per use case with its handler, validation, data access and tests.
- Add a port with adapters only at a boundary you do not own (a payment provider, a broker, the clock) or where two real implementations exist. A repository interface with one implementation over your own database is a layer without a seam.
- Use events between modules only when the producer must not know its consumers or the work must survive a consumer being down.
- Split out a service only when a separate team owns and deploys it, it needs different scaling, availability or release cadence, its module boundary has stayed stable, and the platform already provisions, monitors and deploys services automatically. A shared database, lockstep deploys or chains of synchronous calls make a distributed monolith.

## Decisions and specs

- Decisions go in `docs/decisions/NNNN-title-with-dashes.md` in MADR 4.0.0 format, unless the repo has another folder or template. Numbers only increase and are not reused.
- Write an ADR for a decision that is costly to reverse or invisible in code, such as the style, a boundary rule, data ownership or a rejected obvious option, and skip routine choices. Its Confirmation section names the check that enforces it, such as a lint rule or a test.
- Keep the decision of an accepted ADR as written, because the record is the history. Write a new ADR and set the old status to `superseded by ADR-NNNN`, fixing only typos and links in place. An ADR you write stays `proposed` until the user accepts it.
- In C4, System Context and Container diagrams suffice for most teams. Add a Component diagram only where it explains something, and skip the Code level. A C4 container is a separately running application or data store, not a Docker container.
- Keep diagrams as text (Structurizr DSL, Mermaid, PlantUML) beside the ADRs so they diff in pull requests. In arc42, keep the 12-section structure, fill only the sections readers need, and let section 9 point to the ADRs.
- Use the repo's existing spec format (Spec Kit, Kiro, OpenSpec) and add no second one. Without one, a concise:planning plan is enough, and a format is worth adopting only when the user asks or specs must stay a current contract after the change ships.
- A spec states observable behavior, meaning inputs, outputs, errors and constraints. Libraries, class names and steps belong in the plan or design file.

## Repos agents work in

- Give agents one non-interactive command each for build, test, lint and typecheck, one that runs all four, and one for a single test file, each exiting non-zero on failure.
- Keep test and build output short: a few lines on success, one line per failure that starts with `ERROR` and holds the reason, totals at the end, and the full log in a file.
- A project script that agents call takes every input as a flag and answers a missing one with a correct example call, not a prompt. It prints `--json` results alone on stdout and progress on stderr, exits zero on an empty result, and offers `--dry-run` for writes.
- Run a fast tier after every change, affected-only (`nx affected -t test`, `turbo run test --affected`) or a fixed sample of a long suite, and the full suite before commit and in CI.
- One script takes a fresh clone to a running app: copy `.env.example`, install, migrate and seed idempotently, start the server, run a smoke test.
- Generated code sits in its own directory or under a fixed suffix (`gen/`, `*.generated.ts`), starts with a header naming its regenerate command, and is marked `linguist-generated` in `.gitattributes`. Add `Read` deny rules for checked-in generated and vendored paths in `.claude/settings.json`, and change the generator input, not the output.
- For a long autonomous build, track features in a JSON file rather than Markdown, with a `passes` field that sessions may only flip.

## Gotchas

- A case-only rename with plain `mv` on Windows or macOS leaves Git tracking the old name, so imports pass locally and fail on Linux. Use `git mv old.ts Old.ts`.
- Two tracked paths that differ only in case lose one file on Windows and macOS checkouts. List them with `git ls-files | sort -f | uniq -di`.
- `tsc` rejects a wrong-case import (`forceConsistentCasingInFileNames` defaults to true), but bundlers, test runners and Node.js resolve it on a case-insensitive file system, so only the Linux build fails.
- An `index.ts` that re-exports a folder makes Vite load every re-exported file and is the usual knot in import cycles. `ReferenceError: Cannot access 'X' before initialization` at import time is an ESM cycle, so import the file directly.
- `ImportError: cannot import name 'X' from partially initialized module` is a Python cycle. Move the shared code into a lower module, because an import inside a function only hides the cycle. Imports under `if TYPE_CHECKING:` are fine.
- A Python module named like a stdlib or installed package (`random.py`, `email.py`, `types.py`) shadows it, and Python 3.13 and later add "consider renaming" to the error. Rename the module.
- Vitest's default include `**/*.{test,spec}.?(c|m)[jt]s?(x)` also matches Playwright specs and compiled tests in `dist/`, since its default exclude covers only `node_modules` and `.git`, and "Playwright Test did not expect test() to be called here" is the symptom. Set Playwright `testDir: './e2e'` and Vitest `exclude: [...configDefaults.exclude, 'e2e/**', 'dist/**']`, because `exclude` replaces the default.
- Jest runs every file under `__tests__/` as a test, so a helper there fails with "Your test suite must contain at least one test". Keep helpers outside it.
- Each `tests/*.rs` file is its own crate in Rust, so shared helpers go in `tests/common/mod.rs`, not `tests/common.rs`.
- Turborepo errors on nested packages such as `apps/a` and `apps/a/b`. Group them with a `packages/group/*` glob and no `package.json` in `packages/group/`.
- pnpm's `linkWorkspacePackages` defaults to false, so a plain version range for a workspace package can install a same-named package from the registry. Use `workspace:*`.

Related skills: concise:planning for plans and tickets, concise:codebase-analysis for mapping existing code and a change's blast radius, concise:typescript-javascript, concise:python, concise:rust and concise:php for each ecosystem's tooling, concise:backend-api for queues and the outbox, concise:orchestration for parallel agents.
