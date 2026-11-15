# Vite, Vitest, ESLint, Biome and Prettier

## Vite 8

- Vite 8 bundles with Rolldown and transforms and minifies with Oxc instead of esbuild and Rollup. CSS minifies with Lightning CSS. It needs Node.js 20.19 or 22.12.
- The default `build.target` is Chrome and Edge 111, Firefox 114 and Safari 16.4 (Baseline Widely available on 2026-01-01).
- Renamed options: `build.rollupOptions` to `build.rolldownOptions`, `worker.rollupOptions` to `worker.rolldownOptions`, `esbuild` to `oxc`, `optimizeDeps.esbuildOptions` to `optimizeDeps.rolldownOptions`. The old keys still convert but are deprecated. `build.commonjsOptions` is a no-op.
- The object form of `output.manualChunks` is removed and the function form deprecated. Use Rolldown's `codeSplitting`.
- `resolve.tsconfigPaths: true` resolves tsconfig `paths` without a plugin, but only for files the tsconfig `include` or `files` match, and not inside `.less` files.
- `server.forwardConsole` prints browser errors and warnings in the dev server terminal. It is on by default when a coding agent is detected.
- `esbuild` is now an optional dependency. Plugins that call `transformWithEsbuild` (deprecated, use `transformWithOxc`), `build.minify: 'esbuild'` and `build.cssMinify: 'esbuild'` need `esbuild` installed.
- `build()` throws a `BundleError` whose plugin errors sit in `.errors`.
- Oxc does not lower standard decorators, RegExp modifiers or duplicate named capture groups, so they reach the browser unchanged. Lower decorators with `@rolldown/plugin-babel` or SWC. TypeScript `experimentalDecorators` and `emitDecoratorMetadata` are supported.
- `import.meta.url` is no longer polyfilled in UMD and IIFE output, `require` of externalized modules stays `require`, and the `system` and `amd` output formats are gone.

## Vitest 5

- Needs Node.js 22.12 and Vite 6.4 or later as a peer dependency. Yarn does not install peers, so add `vite` to `package.json` there.
- `clearMocks` is `true` by default: call history is cleared before each test, implementations stay.
- Unawaited `.resolves`, `.rejects` and `toMatchFileSnapshot` assertions fail the test.
- `vi.mock`, `vi.unmock` and `vi.hoisted` inside a function, block or `describe` throw.
- `-t` matches the full name joined with `' > '`, so `-t 'math adds'` no longer selects `describe('math')` with `test('adds')`. Use `-t 'math > adds'` or `-t 'math.*adds'`.
- Inline projects in `test.projects` inherit the root config, including plugins and `resolve.alias`, and share its Vite server. Set `extends: false` on a project that must not inherit. Arrays such as `setupFiles` are merged.
- Config files are no longer searched in parent folders. Pass `--config ../vitest.config.ts` when running from a subfolder.
- Artifacts moved under `.vitest/`. The `json` and `junit` reporters write to `.vitest/json/output.json` and `.vitest/junit/output.xml` instead of stdout, so `vitest --reporter=json | jq` reads nothing unless the reporter sets `stdout: true`.
- `test.sequential` and `describe.sequential` are removed. Use `{ concurrent: false }`.
- From Vitest 4: `projects` replaces `workspace`, `maxWorkers` replaces `maxThreads` and `maxForks`, `poolOptions` is gone, and browser providers are packages such as `@vitest/browser-playwright`.

## ESLint 10 and typescript-eslint

- Only flat config (`eslint.config.*`) on Node.js 20.19, 22.13 or 24 and later. `npx codemod @eslint/v9-to-v10` migrates a v9 setup.
- Write configs with `defineConfig()` and `globalIgnores()` from `eslint/config`, using `extends` inside a config object for shared configs.
- `eslint:recommended` gained `no-unassigned-vars`, `no-useless-assignment` and `preserve-caught-error`. JSX references now count as uses.
- The config is looked up from each linted file's folder upward, so a nested config wins inside its subtree. `--config path` restores a single config.
- `/* eslint-env */` comments are errors. On Node.js, `eslint.config.ts` needs `jiti` 2.2 or later.
- ESLint lints only `*.js`, `*.mjs` and `*.cjs` unless a config object's `files` covers TypeScript, which typescript-eslint's configs add.
- A config object holding only `ignores` ignores globally, while `ignores` next to other keys applies to that object alone, where `"build/"` ignores nothing. Use `globalIgnores()` for global ignores and `"build/**"` elsewhere.
- Typed linting: `tseslint.configs.recommendedTypeChecked` with `parserOptions.projectService: true` and `tsconfigRootDir: import.meta.dirname`, not `parserOptions.project` globs.

## Biome 2 and Prettier

- Biome 2.6 lints and formats JavaScript, TypeScript, JSON, CSS, GraphQL and HTML, and since 2.6 also Markdown, YAML and SCSS. It has Tailwind-aware rules such as the nursery `useTailwindStaticClassStrings`.
- Biome's type-aware rules such as `noFloatingPromises` are in the nursery group and the `types` domain. They infer types without the TypeScript compiler and catch most, not all, of what typescript-eslint finds.
- Biome 2 replaced `include` and `ignore` with `files.includes`, resolves paths relative to the config file, and needs `"root": false` in every nested `biome.json`, which inherits nothing unless it sets `"extends": "//"`. Run `npx @biomejs/biome migrate --write` after upgrading.
- Prettier 3 is stable and 4.0 is in alpha. Use one formatter per project, Biome or Prettier.
