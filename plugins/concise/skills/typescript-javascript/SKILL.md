---
name: typescript-javascript
description: Current JavaScript and TypeScript practice, covering ES2025 to ES2027 features and where they run, TypeScript 6 and 7, tsconfig and type patterns, Node.js LTS lines and runtime, npm, pnpm, Bun and Deno, and Vite, Rolldown, Vitest, ESLint, Biome and Prettier. Use when writing, reviewing, debugging or upgrading .ts, .tsx, .js, .mjs or .cjs code or package.json, including browser scripts, jQuery and editor plugins in a site or admin panel, tsconfig.json, vite.config, vitest.config, eslint.config, biome.json, bunfig.toml or deno.json, fixing tsc, lint, build, test runner or install errors, choosing a target, lib, module setting, runtime or package manager, running .ts files with node, bun or deno, or answering any plain JavaScript or TypeScript question, such as which version or feature is current.
---

## Read first

Go through these steps before you act on this skill. Do each step whose condition fits the task, and read each such file in full with the Read tool. When you cannot tell whether a step fits, do it. When the work later reaches a step you skipped, do it then.

1. Read `references/ecmascript.md` before using a built-in or syntax added after ES2024, or when choosing `target`, `lib` or a polyfill.
2. Read `references/typescript.md` when editing tsconfig, upgrading TypeScript, fixing compiler errors or writing non-trivial types.
3. Read `references/node-and-packages.md` when running TypeScript with Node.js, choosing a Node.js version, writing `node:test` suites, or installing dependencies with npm, pnpm, Bun or Deno.
4. Fetch https://registry.npmjs.org/typescript/latest (Current TypeScript release) with `curl -sL` or WebFetch when the task depends on that version or rule, and follow the page where it is newer than this skill.
5. Fetch https://raw.githubusercontent.com/nodejs/Release/main/schedule.json (Node.js release lines and dates) with `curl -sL` or WebFetch when the task depends on that version or rule, and follow the page where it is newer than this skill.

## Check first

- Read the TypeScript version from `node_modules/typescript/package.json` and the lockfile, and every tsconfig in the `extends` chain. TypeScript 7 provides `tsc`, `@typescript/typescript6` provides `tsc6`.
- Read the lowest runtime the code must support: `engines`, `.nvmrc`, `.node-version`, `devEngines.runtime`, CI and container images, `browserslist` or Vite `build.target`.
- Take the package manager from the lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `deno.lock`) and `packageManager` or `devEngines.packageManager`, and run only that one.
- Type-check the whole project with its script or `tsc --noEmit`. Vite, Vitest, tsx, Bun, Deno run and Node.js type stripping execute TypeScript without checking it.
- Facts verified 2026-11.

## Defaults

- ES2025 added iterator helpers, Set methods, `Promise.try`, `RegExp.escape`, `Float16Array`, import attributes and RegExp modifiers. ES2026 adds `Array.fromAsync`, `Error.isError`, `Math.sumPrecise`, `Uint8Array` base64 and hex, `Iterator.concat`, `Map.prototype.getOrInsert` and `JSON.parse` source access. `using` and `Temporal` reached stage 4 for ES2027 and are not Baseline yet, because shipped Safari lacks them.
- Check every ES2025+ built-in against the lowest target in [ecmascript.md](references/ecmascript.md). TypeScript `target` and `lib`, Vite `build.target`, Oxc and esbuild lower syntax but never add built-ins, so `set.union()` or `Temporal` still throws on an older runtime. Add a polyfill (`core-js`, `temporal-polyfill`) or raise the target deliberately.
- TypeScript 7.0 (July 2026, latest 7.0.2) is the Go native port with no programmatic API, 7.1 is in beta with a new API and `es2026`, and 6.0 is the transition release whose new defaults 7.0 keeps. See [typescript.md](references/typescript.md).
- Node.js 26 is the Active LTS line and 20 is end of life. See [node-and-packages.md](references/node-and-packages.md) for the other lines and for runtime and package manager changes.
- Vite 8 (March 2026, latest 8.3.8) bundles with Rolldown and transforms and minifies with Oxc instead of esbuild and Rollup. It needs Node.js 20.19 or 22.12, and its default `build.target` is Chrome 111, Firefox 114 and Safari 16.4. `resolve.tsconfigPaths: true` resolves tsconfig `paths` without a plugin, and `server.forwardConsole` (on by default when a coding agent is detected) prints browser console errors in the dev server terminal.
- Vite 8 renames `build.rollupOptions` to `build.rolldownOptions`, `esbuild` to `oxc` and `optimizeDeps.esbuildOptions` to `optimizeDeps.rolldownOptions`. The old keys still convert automatically but are deprecated. The object form of `output.manualChunks` is removed and the function form deprecated, so use Rolldown's `codeSplitting`.
- Vitest 5 (September 2026, latest 5.1.0) needs Node.js 22.12 and Vite 6.4 or later as a peer dependency, which Yarn does not install automatically. Since Vitest 4, `projects` replaces `workspace`, `maxWorkers` replaces `maxThreads` and `maxForks`, `poolOptions` is gone, and browser providers are packages such as `@vitest/browser-playwright`.
- ESLint 10 (February 2026, latest 10.14.0) supports only flat config (`eslint.config.*`) on Node.js 20.19, 22.13 or 24 and later. `npx codemod @eslint/v9-to-v10` migrates a v9 setup. Write configs with `defineConfig()` and `globalIgnores()` from `eslint/config`, using `extends` inside a config object for shared configs. Its `recommended` set gained `no-unassigned-vars`, `no-useless-assignment` and `preserve-caught-error`.
- Typed linting with typescript-eslint 8 uses `tseslint.configs.recommendedTypeChecked` with `parserOptions.projectService: true` and `tsconfigRootDir: import.meta.dirname`, not `parserOptions.project` globs.
- Biome 2 (latest 2.6.7) lints and formats, since 2.6 also Markdown, YAML and SCSS. Its type-aware rules such as `noFloatingPromises` run without TypeScript in the `project` domain and catch most, not all, of what typescript-eslint finds.
- Use one formatter, Biome or Prettier (latest 3.10.1, 4.0 in alpha), not both.
- Build libraries with tsdown (Rolldown-based). tsup is no longer maintained and points to tsdown.

## Gotchas

- Vite 8 resolves the `default` import of a CommonJS module as `module.exports` whenever the importer is ESM (`.mjs`, `.mts` or `"type": "module"`) or the module lacks `__esModule`, in dev and build alike. Code that relied on getting `module.exports.default` breaks. `legacy.inconsistentCjsInterop: true` restores the old behavior temporarily.
- Vite 8 dropped esbuild as a dependency. Plugins that call `transformWithEsbuild`, `build.minify: 'esbuild'` and `build.cssMinify: 'esbuild'` (CSS now minifies with Lightning CSS) need `esbuild` installed. `build()` now throws a `BundleError` whose plugin errors sit in `.errors`.
- Oxc in Vite 8 does not lower standard decorators, RegExp modifiers or duplicate named capture groups, so they reach the browser unchanged. TypeScript `experimentalDecorators` and `emitDecoratorMetadata` are supported.
- Vitest 5 clears mock call history before each test (`clearMocks: true`), fails tests with unawaited `.resolves`, `.rejects` or file snapshot assertions, throws for `vi.mock` written inside a block, and stops searching parent folders for a config file.
- Vitest 5 matches `-t` against the full name joined with `' > '`, so `-t 'math adds'` no longer selects `describe('math')` with `test('adds')`. Use `-t 'math > adds'`.
- pnpm passes `--` through to the script, so `pnpm test -- <file>` hands Vitest a literal `--` and it runs the whole suite. Write `pnpm test <file>`. npm and Bun strip the `--`.
- Vitest 5 inline projects inherit the root config, including plugins and `resolve.alias`, and share its Vite server. Set `extends: false` on a project that must not inherit them.
- ESLint lints only `*.js`, `*.mjs` and `*.cjs` unless a config object's `files` covers TypeScript, which typescript-eslint's configs add.
- An ESLint config object holding only `ignores` ignores globally, while `ignores` next to other keys applies to that object alone, where a pattern like `"build/"` ignores nothing. Use `globalIgnores()` for global ignores and `"build/**"` elsewhere.
- ESLint 10 looks up `eslint.config.*` from each linted file's folder upward, so a nested config now wins inside its subtree. `/* eslint-env */` comments are errors. On Node.js, `eslint.config.ts` needs `jiti` 2.2 or later installed.
- Biome 2 replaced `include` and `ignore` with `files.includes`, resolves paths relative to the config file, and needs `"root": false` in every nested `biome.json`, which inherits nothing unless it uses `extends`. Run `npx @biomejs/biome migrate --write` after upgrading.
