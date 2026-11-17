---
name: typescript-javascript
description: JavaScript and TypeScript practice covering ECMAScript features and where they run, Temporal, tsconfig and type patterns, Node.js, npm, pnpm, Bun and Deno, and the Vite, Vitest, ESLint, Biome and Prettier toolchain. Use when writing, reviewing or upgrading .ts, .tsx, .js, .mjs or .cjs code, browser scripts and jQuery in an admin panel, package.json, tsconfig.json or tool configs, or when tsc, lint, build, test or install fails.
---

# JavaScript and TypeScript

This skill matches ECMAScript 2026 plus the ES2027 features already at stage 4, TypeScript 7.0 (and 6.0 for tools that need the compiler API), Node.js 26 LTS, npm 12, pnpm 11 and 12, Bun 1.4, Deno 2.9, Vite 8, Vitest 5, ESLint 10, Biome 2.6 and jQuery 4.0. Run `node -v`, `npx tsc -v` and `npm ls typescript vite vitest eslint @biomejs/biome --depth=0` (or the same through the project's package manager) to see what is installed. Where the installed release is newer, its own release notes and `--help` are right.

## References

Each file below holds what this page only names. Read it in full with the Read tool before the first step its condition describes, also when that step comes late in a long task or after a compaction.

- [references/ecmascript.md](references/ecmascript.md): read before using a built-in or syntax added after ES2024, when choosing `target`, `lib` or a polyfill, and before writing date or time code with Temporal.
- [references/typescript.md](references/typescript.md): read when editing tsconfig, upgrading TypeScript, fixing compiler errors after an upgrade, or writing non-trivial types.
- [references/node-and-packages.md](references/node-and-packages.md): read when choosing a Node.js version, running TypeScript with Node.js, writing `node:test` suites, or installing with npm, pnpm, Bun or Deno.
- [references/build-test-lint.md](references/build-test-lint.md): read when configuring or upgrading Vite, Vitest, ESLint, typescript-eslint, Biome or Prettier, or when one of them fails.

## Check first

- Read the TypeScript version from `node_modules/typescript/package.json` and the lockfile, and every tsconfig in the `extends` chain. TypeScript 7 provides `tsc`, `@typescript/typescript6` provides `tsc6`.
- Find the lowest runtime the code must support: `engines`, `.nvmrc`, `.node-version`, `devEngines.runtime`, CI and Docker images, `browserslist`, Vite `build.target`. For admin-panel scripts without a build step, the target is the browsers the admins use, and the code runs exactly as written.
- Take the package manager from the lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `deno.lock`) and `packageManager` or `devEngines.packageManager`, and run only that one.
- Type-check the whole project with its script or `tsc --noEmit`. Vite, Vitest, tsx, Bun, Deno and Node.js type stripping run TypeScript without checking types.

## Language and runtime

- ES2025 added iterator helpers, Set methods, `Promise.try`, `RegExp.escape`, `Float16Array`, import attributes, RegExp modifiers and duplicate named groups. ES2026 adds `Array.fromAsync`, `Error.isError`, `Math.sumPrecise`, `Uint8Array` base64 and hex, `Iterator.concat`, `Map.prototype.getOrInsert` and `JSON.parse` source access. Temporal, `using`, `Iterator.zip`, `chunks`, `includes`, `join` and `Atomics.pause` reached stage 4 for ES2027.
- TypeScript `target` and `lib`, Vite `build.target`, Oxc and esbuild lower syntax but never add built-ins, so `set.union()` or `Temporal` still throws on an older runtime. Check each ES2025+ built-in against the lowest target in [ecmascript.md](references/ecmascript.md), then add a polyfill or raise the target deliberately.
- Temporal runs in Chrome 144, Firefox 139, Node.js 26, Deno 2.7 and Bun 1.4, but not in shipped Safari (the 27.3 beta has it), so it is not Baseline. Pick the type by meaning: `Instant` for recorded timestamps, `ZonedDateTime` with an IANA zone for an event in a place, `PlainDate`, `PlainTime`, `PlainYearMonth` or `PlainMonthDay` for values that must not shift with time zones.
- Node.js 26 is the Active LTS line until 2027-10-20 and reaches end of life on 2029-04-30, 24 and 22 are in Maintenance, and 20 reached end of life on 2026-04-30. Node.js runs erasable TypeScript by default, reads no tsconfig and checks no types. See [node-and-packages.md](references/node-and-packages.md).
- Standard decorators are back at stage 2.7 on the TC39 list. TypeScript compiles them, Vite 8's Oxc does not lower them and Node.js type stripping rejects them. `experimentalDecorators` stays the form NestJS, Angular and TypeORM use.

## TypeScript

- TypeScript 7.0 (July 2026) is the Go port, about 10 times faster, with no programmatic API. 7.1 (beta) brings the new API and `es2026` for `target` and `lib`. typescript-eslint 8 (peer `typescript` below 6.1), the Vue, Svelte, Astro and MDX tools and Angular templates still need the 6.0 API, so install both compilers as shown in [typescript.md](references/typescript.md).
- 7.0 keeps the 6.0 defaults: `strict` on, `module` `esnext`, `target` `es2025`, `types` `[]`, `rootDir` the tsconfig folder. Options deprecated in 6.0 (`baseUrl`, `moduleResolution: node`, `target: es5`, `outFile`, import `assert`) are hard errors in 7.0.
- `strict` leaves `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `noImplicitOverride` off. Turn them on by name in new projects.

## Simple, safe and fast code

- Type data from outside the program as `unknown` and narrow it once where it enters: a request body, `JSON.parse`, `res.json()` (typed `any` in lib.dom), `localStorage`, `postMessage`, a `$.ajax` response. Use a schema (Zod, Valibot, ArkType) or a type guard there, and let the code behind that point trust the type. `as Foo` on parsed data checks nothing.
- Write `any` only where no type can be expressed, such as an untyped third-party callback, and keep it from spreading past that line. A hand-written `x is T` predicate is unchecked and as unsafe as `as`.
- Use `satisfies` for config and lookup objects: it checks the shape and keeps the literal types, where an annotation widens them and `as` hides errors.
- Model states as discriminated unions (`{ status: 'ok'; data } | { status: 'error'; error }`) instead of objects with several optional fields, and end a `switch` over them with `const unreachable: never = value` so a new variant fails to compile.
- Await, return or explicitly handle every promise. `items.forEach(async ...)` neither waits nor reports rejections: use `for...of` with `await` for order, or `Promise.all(items.map(...))` for parallel work, and `Promise.allSettled` when some may fail. An unhandled rejection exits Node.js. Enforce it with `@typescript-eslint/no-floating-promises` and `no-misused-promises`.
- `catch (e)` gives `unknown`. Check `e instanceof Error` (or `Error.isError(e)` where it exists) before reading `.message`, and rethrow with `new Error(msg, { cause: e })`.
- Avoid accidental quadratic work: `.find`, `.includes`, `.indexOf` or `.filter` inside a loop over another array is O(n*m), so build a `Map` or `Set` once. A `reduce` that spreads its accumulator (`{ ...acc, [k]: v }`, `[...acc, x]`) copies it every step. `shift()` and `unshift()` in a loop move the whole array each time. `Object.groupBy` and `Map.groupBy` (ES2024) replace hand-written grouping.
- Run independent awaits in parallel, and cap concurrency for long lists. Interleaving DOM reads (`offsetHeight`, `getBoundingClientRect`) and writes in one loop forces a layout per item: read all, then write all.
- Use `structuredClone` instead of `JSON.parse(JSON.stringify(x))`, `??` instead of `||` when `0` or `''` are valid values, and `Object.hasOwn` instead of `in` on untrusted objects.
- Keep untrusted keys out of plain objects: use a `Map` or `Object.create(null)`, and never deep-merge untrusted JSON into an object, because `__proto__` and `constructor` keys pollute every object. No `eval`, `new Function` or string `setTimeout`. Build a RegExp from input with `RegExp.escape`.

## Browser scripts and jQuery

- Insert untrusted text with `textContent` or jQuery `.text()`. `innerHTML`, `.html()`, `.append(string)` and `$(string)` parse HTML, so user input there is XSS. jQuery 4 accepts `TrustedHTML` where a site enforces Trusted Types.
- jQuery 4.0 (2026-01-17) removed `$.trim`, `$.parseJSON`, `$.isArray`, `$.type`, `$.now`, `$.isNumeric`, `$.isFunction`, `$.isWindow`, `$.camelCase`, `$.nodeName`, `$.cssNumber`, `$.cssProps` and `$.fx.interval`, and `.push`, `.sort` and `.splice` on jQuery objects. Use the native equivalents. The slim build has no Deferreds or Callbacks, focus events now fire in W3C order (`blur`, `focusout`, `focus`, `focusin`), and IE 10 and older are dropped. Read `jQuery.fn.jquery` before relying on any of this.
- Bind handlers for rows that appear later through delegation, `$(container).on('click', '.row-action', fn)`. Code that re-runs after an AJAX fragment reload binds a second time and fires twice, so namespace and unbind first: `.off('click.myplugin').on('click.myplugin', ...)`.
- Read and set `checked`, `disabled` and `selected` with `.prop()`. `.attr()` reflects only the initial markup.
- Send the admin's CSRF token on every `$.ajax` POST the way existing calls do, and handle failure: a jqXHR is thenable, so `await` it inside `try` or attach `.fail()`.
- Wrap admin scripts in a module (`<script type="module">`) or an IIFE so they add no globals. Module scripts run deferred, after inline scripts that may expect their globals.

## Tooling

- Vite 8 bundles with Rolldown and transforms and minifies with Oxc. It needs Node.js 20.19 or 22.12, and its default `build.target` is Chrome and Edge 111, Firefox 114 and Safari 16.4. `resolve.tsconfigPaths: true` resolves tsconfig `paths` without a plugin.
- Vitest 5 needs Node.js 22.12 and Vite 6.4 or later as a peer dependency, which Yarn does not install automatically.
- ESLint 10 supports only flat config (`eslint.config.*`) on Node.js 20.19, 22.13 or 24 and later. Typed linting with typescript-eslint 8 uses `parserOptions.projectService: true`.
- Use one formatter, Biome 2 or Prettier, not both. Build libraries with tsdown. tsup is no longer maintained and points to tsdown.
- Migration details, renamed options and config traps for these tools are in [build-test-lint.md](references/build-test-lint.md).

## Gotchas

- pnpm passes `--` through to the script, so `pnpm test -- <file>` hands Vitest a literal `--` and it runs the whole suite. Write `pnpm test <file>`. npm and Bun strip the `--`.
- `tsc file.ts` in a folder that has a tsconfig is an error in 7.0 unless `--ignoreConfig` is passed. Pre-commit hooks that pass file names break, so check the whole project instead.
- An ESLint crash reading `'Intrinsic'` means typescript-eslint loaded TypeScript 7. Alias `typescript` to `@typescript/typescript6`.
- Vite 8 resolves the `default` import of a CommonJS module as `module.exports` whenever the importer is ESM or the module lacks `__esModule`, in dev and build alike. Code that relied on `module.exports.default` breaks.
- Vitest 5 clears mock call history before each test, fails tests with unawaited `.resolves`, `.rejects` or file snapshot assertions, throws for `vi.mock` inside a block, and matches `-t` against names joined with `' > '`.
- Node.js type stripping throws `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` for `enum`, parameter properties and namespaces with values, ignores tsconfig `paths`, and needs the `.ts` extension in relative imports.
- On Node.js 26, reading `localStorage` without `--localstorage-file` throws a `DOMException`.
- Iterator helpers live on iterators, not arrays: write `arr.values().map(f).toArray()`. A helper iterator is single-use.

Related skills: concise:react-next for React and Next.js, concise:frontend-ui for CSS, Tailwind, accessibility and Web Vitals, concise:testing for test design and Playwright, concise:codebase-analysis for one change across many files or a version upgrade, concise:php for the PHP side of the CMS admin, concise:web-security for an XSS or injection review.
