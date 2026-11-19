---
name: typescript-javascript
description: JavaScript and TypeScript practice covering ECMAScript features and where they run, Temporal, tsconfig and type patterns, Node.js, npm, pnpm, Bun and Deno, and the Vite, Vitest, ESLint, Biome and Prettier toolchain. Use when writing, reviewing or upgrading .ts, .tsx, .js, .mjs or .cjs code, browser scripts and jQuery in an admin panel, package.json, tsconfig.json or tool configs, or when tsc, lint, build, test or install fails. React and Next.js code belongs to react-next, and CSS, accessibility and Web Vitals to frontend-ui.
---

# JavaScript and TypeScript

This skill matches ECMAScript 2026 plus the ES2027 features already at stage 4, TypeScript 7.0 (and 6.0 for tools that need the compiler API), Node.js 26 LTS, npm 12, pnpm 11 and 12, Bun 1.4, Deno 2.9, Vite 8, Vitest 5, ESLint 10, Biome 2.6 and jQuery 4.1. Run `node -v`, `npx tsc -v` and `npm ls typescript vite vitest eslint @biomejs/biome --depth=0`, or the same through the project's package manager, to see what is installed. Where the installed release is newer, its own release notes and `--help` are right.

## References

- Read [references/ecmascript.md](references/ecmascript.md) before you use a built-in or syntax added after ES2024, choose `target`, `lib` or a polyfill, or write date and time code with Temporal.
- Read [references/typescript.md](references/typescript.md) before you edit a tsconfig, upgrade TypeScript or write non-trivial types, and when the compiler reports new errors after an upgrade.
- Read [references/node-and-packages.md](references/node-and-packages.md) before you choose a Node.js version, run TypeScript with Node.js, write `node:test` suites, or install with npm, pnpm, Bun or Deno.
- Read [references/build-test-lint.md](references/build-test-lint.md) before you configure or upgrade Vite, Vitest, ESLint, typescript-eslint, Biome or Prettier, and when one of them fails.

## Check first

- Read the TypeScript version from `node_modules/typescript/package.json` and the lockfile, plus `node_modules/@typescript/native/package.json` in a project that keeps both compilers, and every tsconfig in the `extends` chain. TypeScript 7 provides `tsc`, and `@typescript/typescript6` provides `tsc6`.
- Find the lowest runtime the code must support in `engines`, `.nvmrc`, `.node-version`, `devEngines.runtime`, CI and Docker images, `browserslist` and Vite `build.target`. An admin-panel script without a build step runs exactly as written in the browsers the admins use.
- Take the package manager from the lockfile (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `deno.lock`) and from `packageManager` or `devEngines.packageManager`, and run only that one.
- Type-check the whole project with its script or `tsc --noEmit`, because Vite, Vitest, tsx, Bun, Deno and Node.js type stripping run TypeScript without checking types.

## Language, compiler and runtime

- TypeScript `target` and `lib`, Vite `build.target`, Oxc and esbuild lower syntax but add no built-ins, so `set.union()` or `Temporal` still throws on an older runtime. Check each built-in from ES2025 on against the lowest target in [ecmascript.md](references/ecmascript.md), then add a polyfill or raise the target deliberately.
- TypeScript 7.0, released in July 2026, is the Go port, about 10 times faster and without a programmatic API, and 7.1 was in beta on 2026-11-19. typescript-eslint 8 (peer `typescript` below 6.1), the Vue, Svelte, Astro and MDX tools and Angular templates still need the 6.0 API, so install both compilers as [typescript.md](references/typescript.md) shows.
- `strict` leaves `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `noImplicitOverride` off, so turn them on by name in new projects.
- Standard decorators were back at stage 2.7 on the TC39 list on 2026-11-19. TypeScript compiles them, Vite 8's Oxc does not lower them and Node.js type stripping rejects them, while NestJS, Angular and TypeORM use `experimentalDecorators`.

## Safe and fast code

- Type data from outside the program as `unknown` and parse it once where it enters, with a schema (Zod, Valibot, ArkType) or a type guard. That covers a request body, `JSON.parse`, `res.json()` (typed `any` in lib.dom), `localStorage`, `postMessage` and a `$.ajax` response. `as Foo` on parsed data and a hand-written `x is T` predicate check nothing.
- Use `satisfies` for config and lookup objects, which checks the shape and keeps the literal types, where an annotation widens them and `as` hides errors.
- Await, return or handle every promise. `items.forEach(async ...)` neither waits nor reports rejections, so use `for...of` with `await` for order or `Promise.all(items.map(...))` for parallel work, and lint with `@typescript-eslint/no-floating-promises` and `no-misused-promises`. An unhandled rejection exits Node.js.
- Build a `Map` or `Set` once instead of calling `.find`, `.includes` or `.filter` inside a loop over another array, and do not spread the accumulator of a `reduce` (`{ ...acc, [k]: v }`, `[...acc, x]`), which copies it on every step.
- Keep untrusted keys out of plain objects by using a `Map` or `Object.create(null)`, and validate untrusted JSON instead of deep-merging it into an object, because its `__proto__` and `constructor` keys pollute every object. Build a RegExp from input with `RegExp.escape`, and pass no strings to `eval`, `new Function` or `setTimeout`.

## Browser scripts and jQuery

- Insert untrusted text with `textContent` or jQuery `.text()`. `innerHTML`, `.html()`, `.append(string)` and `$(string)` parse HTML, so user input there is XSS. jQuery 4 accepts `TrustedHTML` where a site enforces Trusted Types.
- jQuery 4.0 (2026-01-17) removed `$.trim`, `$.parseJSON`, `$.isArray`, `$.type`, `$.now`, `$.isNumeric`, `$.isFunction`, `$.isWindow`, `$.camelCase`, `$.nodeName`, `$.cssNumber`, `$.cssProps` and `$.fx.interval`, and `.push`, `.sort` and `.splice` on jQuery objects, so use the native equivalents. Its slim build has no Deferreds or Callbacks, focus events fire in W3C order (`blur`, `focusout`, `focus`, `focusin`), and IE 10 and older are dropped. Read `jQuery.fn.jquery` before relying on any of this.
- Bind handlers for rows that appear later through delegation, as in `$(container).on('click', '.row-action', fn)`. Code that runs again after an AJAX fragment reload binds a second time and fires twice, so namespace and unbind first, as in `.off('click.myplugin').on('click.myplugin', ...)`.
- Send the admin's CSRF token on every `$.ajax` POST the way the existing calls do, and handle failure. A jqXHR is thenable, so `await` it inside `try` or attach `.fail()`.
- Wrap admin scripts in a module (`<script type="module">`) or an IIFE so that they add no globals. Module scripts run deferred, after inline scripts that may expect their globals.

## Tooling

- Use one formatter, Biome 2 or Prettier, not both, and build libraries with tsdown, because tsup is no longer maintained and points to tsdown.

## Gotchas

- pnpm passes `--` through to the script, so `pnpm test -- <file>` hands Vitest a literal `--` and it runs the whole suite. Write `pnpm test <file>`. npm and Bun strip the `--`.
- `tsc file.ts` in a folder that has a tsconfig fails with TS5112 in 7.0 unless `--ignoreConfig` is passed, which breaks pre-commit hooks that pass file names. Check the whole project instead.
- An ESLint crash reading `'Intrinsic'` means typescript-eslint loaded TypeScript 7, so alias `typescript` to `@typescript/typescript6`.
- Vite 8 resolves the `default` import of a CommonJS module as `module.exports` whenever the importer is ESM or the module lacks `__esModule`, in dev and build alike, so code that relied on `module.exports.default` breaks. The deprecated `legacy.inconsistentCjsInterop: true` restores the old behavior as a stopgap until the package is fixed.
- Vitest 5 clears mock call history before each test (`clearMocks` is `true` by default), fails tests with unawaited `.resolves`, `.rejects` or `toMatchFileSnapshot`, throws for `vi.mock`, `vi.unmock` and `vi.hoisted` inside a function, block or `describe`, and matches `-t` against the full name joined with `' > '`, as in `-t 'math > adds'`.
- Node.js type stripping throws `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` for `enum`, parameter properties, namespaces holding values and `import x =` aliases, fails to parse decorators, refuses `.tsx` and `.ts` under `node_modules`, ignores tsconfig `paths`, and needs the `.ts` extension in relative imports.
- Iterator helpers live on iterators, not arrays, so write `arr.values().map(f).toArray()`. A helper iterator is lazy and single-use, so a second pass over it yields nothing.

Related skills: concise:react-next for React and Next.js, concise:frontend-ui for CSS, Tailwind, accessibility and Web Vitals, concise:testing for test design and Playwright, concise:codebase-analysis for one change across many files or a version upgrade, concise:php for the PHP side of the CMS admin, concise:web-security for an XSS or injection review.
