---
name: architecture
description: Current practice for project structure, file and folder naming, module boundaries, architecture style and the decision and spec documents kept in a repo. Use when creating or reorganizing a project, monorepo or workspace (pnpm, npm, Turborepo, Nx, Cargo, Composer PSR-4, Python src layout), asking where code, tests or files should go or how to name them, adding or fixing dependency rules (dependency-cruiser, eslint-plugin-boundaries, Nx tags, deptrac, import-linter, ArchUnit), untangling circular imports, barrel files or imports that break on Linux after a rename, choosing a modular monolith, vertical slices, hexagonal, event-driven or microservices, writing ADRs, MADR, C4 or arc42 docs, working with Spec Kit, Kiro specs or OpenSpec, or making a codebase easier for agents to work in autonomously.
---

## Check first

- Before moving or adding modules, read what the repo already decided: ADRs (`docs/decisions/`, `docs/adr/`, `doc/arch/`), specs (`.specify/`, `.kiro/`, `openspec/`) and boundary configs (`.dependency-cruiser.*`, `boundaries/` settings in `eslint.config.*`, `tags` in `project.json`, `boundaries` in `turbo.json`, `deptrac.php`, `[tool.importlinter]`, ArchUnit tests, `deny.toml`).
- `git config core.ignorecase` prints `true` on a checkout where a wrong-case file name passes locally and fails on Linux.
- Current Spec Kit release: https://github.com/github/spec-kit/tags.atom
- Current OpenSpec release: https://registry.npmjs.org/@fission-ai/openspec/latest
- Facts verified 2026-11.

## Defaults

- In new code, put business capabilities at the top level (`billing/`, `catalog/`) and technical roles inside each. Top-level `controllers/`, `services/` and `utils/` folders spread every change across the tree.
- Give each module one public entry point, and import only that from outside the module: its `index.ts`, a package's `exports` map, a Python package's `__init__.py` with `__all__`, a Rust crate root with internals at `pub(crate)`. Add no re-export `index` files in subfolders.
- JS and TS workspaces: deployables in `apps/*`, libraries and shared configs in `packages/*`, one level deep. Depend on a sibling with `"workspace:*"` and import it by name, not by a `../` path. Packages extend a shared tsconfig package, so the root needs no `tsconfig.json`. Package managers are in concise:typescript-javascript.
- Rust workspaces: a virtual root manifest with `members = ["crates/*"]` and crates flat under `crates/`. `[profile.*]` and `[patch]` work only in the root manifest. The rest is in concise:rust.
- Python: `src/<package>/`, tests in `tests/`, pytest with `--import-mode=importlib`. The default `prepend` mode fails with "import file mismatch" when two test files share a name. Packaging is in concise:python.
- PHP: PSR-4 maps a namespace prefix to a base directory, each sub-namespace to a subdirectory of the same case and the class to the file name. Tests go under `autoload-dev`. In CI run `composer dump-autoload --optimize --dry-run --strict-psr --strict-ambiguous` (Composer 2.8+) to fail on mapping errors and case-only duplicates. More in concise:php.
- Use one term per domain concept in module names, code, tests, specs and UI, so one search finds all of it. Do not create `utils`, `helpers`, `common` or `misc` modules.
- Every dependency rule is a check that fails CI. Domain code imports no framework, database or HTTP code, adapters import the domain, and a feature reaches another only through its entry point. Tool syntax is in references/boundary-tools.md.
- Write the fix into the rule's message, since the agent that breaks a rule reads only the error: dependency-cruiser `comment` (shown with `--output-type err-long`), import-linter `broken_contract_guidance` (2.14+), eslint-plugin-boundaries policy `message`. Name the ADR behind the rule.
- Adding a rule to existing code: baseline today's violations and fail only on new ones. Shrinking the baseline is routine, growing it is the user's call.
- `disallowWorkspaceCycles: true` in `pnpm-workspace.yaml` turns pnpm's package-cycle warning into an install failure. Cargo rejects crate cycles itself.
- Default to a modular monolith: one deployable, modules by business capability, each module the only reader and writer of its own tables.
- Inside a module whose features share little logic, use vertical slices: one folder per use case with its handler, validation, data access and tests.
- Add a port with adapters only at a boundary you do not own (payment provider, broker, clock) or where two real implementations exist. A repository interface with one implementation over your own database is a layer without a seam.
- Layering (interface, application, domain, infrastructure) is the dependency rule inside a module, not the top-level folder structure.
- Use events between modules only when the producer must not know its consumers or the work must survive a consumer being down. Queues and the outbox are in concise:backend-api.
- Split out a service only when a separate team owns and deploys it, it needs different scaling, availability or release cadence, its module boundary has stayed stable, and the platform already provisions, monitors and deploys services automatically. A shared database, lockstep deploys or chains of synchronous calls make a distributed monolith.
- Decisions go in `docs/decisions/NNNN-title-with-dashes.md` in MADR 4.0.0 format, unless the repo has another folder or template. Numbers only increase and are never reused.
- Write an ADR for a decision that is costly to reverse or invisible in code: the style, a boundary rule, data ownership, a rejected obvious option. Skip routine choices.
- Follow accepted ADRs that touch the area or propose a superseding ADR. Never rewrite the decision of an accepted ADR. Write a new one and set the old status to `superseded by ADR-NNNN`. Fix typos and links in place. An ADR you write stays `proposed` until the user accepts it.
- Fill MADR's Confirmation section with the check that enforces the decision (a lint rule name, a test).
- C4: draw System Context and Container diagrams, which suffice for most teams. Add a Component diagram only where it explains something, and skip the Code level. A C4 container is a separately running application or data store, not a Docker container.
- Keep diagrams as text (Structurizr DSL, Mermaid, PlantUML) beside the ADRs so they diff in pull requests. In arc42, keep the 12-section structure but fill only the sections readers need, and let section 9 point to the ADRs.
- Use the repo's existing spec format (Spec Kit, Kiro, OpenSpec) and do not add a second. Without one, a concise:planning plan is enough. Adopt a format only when the user asks or specs must stay a current contract after the change ships.
- A spec states observable behavior: inputs, outputs, errors, constraints. Libraries, class names and steps belong in the plan or design file.
- Give agents one non-interactive command each for build, test, lint and typecheck, one that runs all four, and one for a single test file, each exiting non-zero on failure.
- Test and build output for agents: a few lines on success, one line per failure starting with `ERROR` and holding the reason so grep finds it, totals at the end, the full log in a file.
- A project script or CLI that agents call takes every input as a flag and answers a missing one with a correct example call, not a prompt. It prints `--json` results alone on stdout and progress on stderr, exits zero on an empty result, and offers `--dry-run` for writes.
- A fast tier runs after every change: affected-only (`nx affected -t test`, `turbo run test --affected`) or a fixed sample of a long suite. The full suite runs before commit and in CI.
- One script takes a fresh clone to a running app: copy `.env.example`, install, migrate and seed idempotently, start the server, run a smoke test. Run it at session start to catch breakage left by the previous session.
- Generated code sits in its own directory or under a fixed suffix (`gen/`, `*.generated.ts`), starts with a header naming its regenerate command, and is marked `linguist-generated` in `.gitattributes`. Add `Read` deny rules for checked-in generated and vendored paths in `.claude/settings.json`. Change the generator input, not the output.
- For a long autonomous build, track features in a JSON file, not Markdown, with a `passes` field that sessions may only flip. Multi-session plans are in concise:planning, parallel agents in concise:orchestration.

## Gotchas

- A case-only rename with plain `mv` on Windows or macOS leaves Git tracking the old name, so imports pass locally and fail on Linux. Use `git mv old.ts Old.ts`.
- Two tracked paths that differ only in case lose one file on Windows and macOS checkouts. List them with `git ls-files | sort -f | uniq -di`.
- `tsc` rejects a wrong-case import (`forceConsistentCasingInFileNames` defaults to true), but bundlers, test runners and Node.js resolve it on a case-insensitive file system, so only the Linux build fails.
- An `index.ts` that re-exports a folder makes Vite load every re-exported file and is the usual knot in import cycles. `ReferenceError: Cannot access 'X' before initialization` at import time is an ESM cycle. Import the file directly.
- `ImportError: cannot import name 'X' from partially initialized module` is a Python cycle. Move the shared code into a lower module. An import inside a function only hides the cycle. Imports under `if TYPE_CHECKING:` are fine.
- A Python module named like a stdlib or installed package (`random.py`, `email.py`, `types.py`) shadows it. Python 3.13 and later add "consider renaming" to the error.
- Vitest's default include `**/*.{test,spec}.?(c|m)[jt]s?(x)` also matches Playwright specs and compiled tests in `dist/`, since its default exclude covers only `node_modules` and `.git`, and Playwright scans its config directory for the same suffixes. Set Playwright `testDir: './e2e'` and Vitest `exclude: [...configDefaults.exclude, 'e2e/**', 'dist/**']`, because `exclude` replaces the default. "Playwright Test did not expect test() to be called here" is the symptom.
- Jest runs every file under `__tests__/` as a test, so a helper there fails with "Your test suite must contain at least one test". Keep helpers outside it.
- Each `tests/*.rs` file is its own crate in Rust. Shared helpers go in `tests/common/mod.rs`, not `tests/common.rs`.
- Turborepo errors on nested packages such as `apps/a` and `apps/a/b`. Group with a `packages/group/*` glob and no `package.json` in `packages/group/`.
- pnpm's `linkWorkspacePackages` defaults to false, so a plain version range for a workspace package can install a same-named package from the registry. Use `workspace:*`.

## References

- Read references/boundary-tools.md when adding, configuring, upgrading or debugging a dependency-boundary or cycle check.
- Read references/spec-formats.md when the repo has `.specify/`, `.kiro/` or `openspec/`, or the user asks for spec-driven development.
