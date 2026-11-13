## Compiler and tsconfig

- Defaults since 6.0: `strict` is `true`, `module` is `esnext`, `target` is the latest stable ES version (`es2025` in 6.0 and 7.0), `types` is `[]`, `rootDir` is the tsconfig directory, `noUncheckedSideEffectImports` is `true` and `libReplacement` is `false`. 7.0 always applies `stableTypeOrdering`.
- Hard errors in 7.0, deprecated in 6.0 and only silenced there by `"ignoreDeprecations": "6.0"`: `target: es5`, `downlevelIteration`, `moduleResolution` `node`, `node10` or `classic`, `module` `amd`, `umd`, `systemjs` or `none`, `outFile`, `baseUrl`, `esModuleInterop` or `allowSyntheticDefaultImports` set to `false`, `alwaysStrict: false`, `module Foo {}` namespaces and import `assert`.
- Upgrade through 6.0: remove `ignoreDeprecations`, turn on `stableTypeOrdering`, fix every error, then switch to 7.0, which should then compile identically.
- typescript-eslint 8 (peer `typescript` below 6.1), the Vue, Svelte, Astro and MDX language tools and Angular templates still need the 6.0 API. Keep both compilers so `tsc` runs 7.0:

```json
"devDependencies": {
  "@typescript/native": "npm:typescript@^7.0.2",
  "typescript": "npm:@typescript/typescript6@^6.0.2"
}
```

- Code that Node.js runs as `.ts` uses the Node.js docs' settings: `module: nodenext`, `target: esnext`, `erasableSyntaxOnly`, `verbatimModuleSyntax` and `rewriteRelativeImportExtensions`, plus `noEmit` when nothing ships as `.js`, and `types: ["node"]`.
- A service compiled by `tsc` uses `module: nodenext` (or the fixed `node20`) with explicit `rootDir` and `outDir`. A bundled app uses `module: preserve`, which implies `moduleResolution: bundler`, with `noEmit`, and since 6.0 `lib: ["dom"]` includes `dom.iterable`. A published library uses `nodenext`, emits declarations, lists `"types"` first in each `exports` condition and passes `npx @arethetypeswrong/cli --pack .`.
- Replace `baseUrl` and `paths` aliases with package.json `imports` (`"#/*": "./src/*"`), which TypeScript 6 resolves and Node.js 24.14 and 25.4 accept. `tsc` never rewrites `paths` in its output.
- TypeScript 7 runs 4 type-checker workers. `--checkers` changes that, `--builders` parallelizes `-b` (it multiplies with checkers), and `--singleThreaded` turns it off. Pin one value across local and CI runs, because counts can change order-dependent results.

## Errors after an upgrade

- "Cannot find name 'process'" (or `describe`, `Bun`) comes from `types: []`. Add `"types": ["node"]` and the test runner's types.
- Output under `dist/src/`, or TS5011, comes from `rootDir` no longer being inferred. Set `"rootDir": "./src"`.
- TS5112 comes from `tsc file.ts` next to a tsconfig, as in pre-commit hooks that pass file names. Check the whole project.
- An ESLint crash reading `'Intrinsic'` means typescript-eslint loaded TypeScript 7. Apply the alias above.
- TypeScript 7 no longer recognizes JSDoc `@enum`, `@class`, Closure types like `function(string): void`, postfix `!` or a bare `?`, and a value cannot stand in for a type. Review `checkJs` projects.
- TypeScript 7 splits template literal types by code point, so helpers that counted UTF-16 units change results.
- `moduleResolution: bundler` accepts extensionless relative imports that fail once Node.js runs the output. Node.js services and libraries need `nodenext` and real extensions.
- `@typescript/native-preview` and `tsgo` were previews. Use `typescript@7`, and `typescript@next` for nightlies.

## Types that models get wrong

- `.filter(x => x !== undefined)` narrows since 5.5 because TypeScript infers the predicate. `.filter(Boolean)` does not narrow, and `x => !!x` does not narrow a union with `number` or `string`. A hand-written `x is T` predicate is unchecked and as unsafe as `as`.
- `<const T extends readonly string[]>` infers literal tuples only from literals written at the call site. A variable argument stays `string[]`, and a mutable constraint (`extends string[]`) silently falls back to it.
- `Error` is assignable to `ErrorOptions`, so `new Error(msg, err)` compiles once `err` is narrowed to `Error`, and the new error's `cause` is `undefined`. Write `new Error(msg, { cause: err })`.
- `erasableSyntaxOnly` rejects `enum`, parameter properties, namespaces holding values and `import x =` aliases. Replace an enum with an `as const` object plus `type T = (typeof O)[keyof typeof O]`.
- `verbatimModuleSyntax` keeps every import without `type` in the output and makes `tsc` reject a type imported as a value (TS1484). That import is exactly what fails at run time under type stripping, so keep the flag on wherever another tool emits the JavaScript.
- `strict` leaves `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `noImplicitOverride` off. Turn them on by name.
