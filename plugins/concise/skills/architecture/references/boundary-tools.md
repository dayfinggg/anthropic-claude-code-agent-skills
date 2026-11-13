## Pick the tool

| Stack | Tool, version in 2026-11 | Run |
|---|---|---|
| JS or TS, folder and file rules | dependency-cruiser 18.7 (Node 22, 24 or 26+) | `npx depcruise src --output-type err-long` |
| JS or TS, rules in the editor | eslint-plugin-boundaries 7.4 | ESLint rule `boundaries/dependencies` |
| Nx workspace | `@nx/enforce-module-boundaries` (Nx 24) | ESLint rule with project tags |
| Turborepo workspace | `turbo boundaries` (Turborepo 2.11, experimental) | `turbo boundaries` |
| PHP | deptrac 4.7 (`deptrac/deptrac`, PHP 8.2+) | `vendor/bin/deptrac analyse` |
| Python | import-linter 2.16 (Python 3.11+) | `lint-imports` |
| Java, Kotlin | ArchUnit 1.5.1 (`archunit-junit5` or `archunit-junit6`) | rules as tests |
| Rust | the crate graph, plus cargo-deny 0.20 | `cargo deny check bans` |

## dependency-cruiser

- `npx depcruise --init` writes `.dependency-cruiser.js` with rules against cycles, orphans and undeclared dependencies.
- Rule paths are regular expressions over forward-slash paths, not globs: `^src/` rather than `src/**`.
- Set `options.tsPreCompilationDeps: true`. Without it, imports that vanish after compilation, such as `import type`, are invisible to every rule.
- Keep features apart with group matching, where `$1` is the folder the `from` path captured:

```js
{
  name: "no-cross-feature",
  comment: "Import another feature only through its index.ts (ADR-0007).",
  severity: "error",
  from: { path: "^src/features/([^/]+)/" },
  to: {
    path: "^src/features/[^/]+/",
    pathNot: ["^src/features/$1/", "^src/features/[^/]+/index\\.ts$"],
  },
}
```

- Baseline (18.3+): `depcruise src --baseline` writes `.dependency-cruiser-known-violations.json`, `--ignore-known` applies it, and `--baseline-mode shrink-only` removes fixed entries without adding new ones. `depcruise-baseline` is the older way.
- `to: { circular: true, viaOnly: { dependencyTypesNot: ["type-only"] } }` reports only cycles that exist at run time.

## eslint-plugin-boundaries

- v6 (2026-03) renamed the rule `boundaries/element-types` to `boundaries/dependencies`. v7 (2026-07) renamed its `rules` option to `policies`, `no-unknown` to `no-unknown-dependencies` and `no-ignored` to `no-ignored-dependencies`. Old names still run with a deprecation warning.
- The v7 `recommended` and `strict` presets enable only `boundaries/dependencies`. The deprecated `entry-point` and `external` rules do nothing without their own options.
- Classify folders in `settings["boundaries/elements"]` as `{ type, pattern }`, then write `policies` with `default: "disallow"` and object selectors such as `{ from: { element: { type: "feature" } }, allow: { to: { element: { types: ["shared"] } } } }`. A policy's `message` is the error text.

## Nx and Turborepo

- Once `depConstraints` exist, a project without tags can depend on nothing. Tag every project when you create it, for example `scope:billing` and `type:feature`.
- The Oxlint form (`@nx/oxlint`) is experimental. `nx conformance:check`, which works for any language, needs the Nx Enterprise plan.
- `turbo boundaries` flags imports of files outside the package and of packages missing from its `package.json`. Tag rules in the root `turbo.json` (`boundaries.tags.<tag>.dependencies.deny`) also apply through transitive dependencies.

## deptrac

- `qossmic/deptrac` and `qossmic/deptrac-shim` are abandoned. Install `composer require --dev deptrac/deptrac`. `vendor/bin/deptrac init` writes `deptrac.php` (`Layer::withName()`, `ClassLikeConfig`, `Ruleset::forLayer()->accesses()`). A `deptrac.yaml` keeps working with `--config-file`.
- Classes outside every layer are "uncovered" and never violate. Run with `--fail-on-uncovered` so new code cannot slip past the layers.
- `@internal` or `@deptrac-internal` on a class forbids its use outside its layer.
- Baseline: `vendor/bin/deptrac analyse --formatter=baseline` writes `deptrac.baseline.yaml`, which the config then lists under `imports`.

## import-linter

- The root package must be importable, so run it in the project environment (`uv run lint-imports`), not through `uvx`.
- Configure under `[tool.importlinter]` with `root_package`, and one `[[tool.importlinter.contracts]]` table per contract with `name`, `type` and its options.
- Contract types: `layers` (highest first, `a | b` on one line forbids the siblings importing each other, `a : b` allows it), `independence`, `forbidden`, `protected` (2.5+, only listed modules may import) and `acyclic_siblings` (2.6+). Set `exhaustive = true` on a layers contract so a new subpackage has to be placed in a layer.
- Since 2.16 a config without contracts fails instead of passing, and a misspelled contract option is an error.
- `exclude_type_checking_imports = true` ignores imports under `if TYPE_CHECKING:`. `ignore_imports` is the baseline, and an entry that no longer matches is an error by default.

## ArchUnit

- Write `layeredArchitecture().consideringAllDependencies()` followed by `.layer(...)` and `.whereLayer(...)` rules, and check cycles with `slices().matching("com.example.(*)..").should().beFreeOfCycles()`.
- Baseline: `FreezingArchRule.freeze(rule)` records current violations in a text store and reports only new ones. Commit the store. A new store needs `freeze.store.default.allowStoreCreation=true`, so CI with the default fails instead of silently creating one.

## Rust

- The crate is the boundary. A crate uses only crates in its `Cargo.toml`, Cargo rejects cycles between normal dependencies, and `pub(crate)` keeps items inside the crate.
- To confine a third-party crate to one adapter crate, add `deny = [{ crate = "sqlx", wrappers = ["app-db"] }]` under `[bans]` in `deny.toml`. Only `app-db` may then depend on `sqlx` directly.
