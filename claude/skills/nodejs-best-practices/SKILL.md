---
name: nodejs-best-practices
description: "Node.js best practices. Use when reading or editing JavaScript or TypeScript that runs on Node.js, such as servers, bots, workers, CLIs and scripts, or a package.json. Browser-only code needs typescript-best-practices alone."
paths: ["**/*.js", "**/*.mjs", "**/*.cjs", "**/*.ts", "**/*.mts", "**/*.cts", "**/package.json"]
---

# Node.js best practices

Apply the **typescript-best-practices** skill as well when the code is TypeScript. Read the Node.js version the code runs on before using an API: `engines.node` in `package.json`, `.nvmrc` or `.node-version`, the Docker image, or `node --version` on the host that runs it. Use APIs up to that version and none above it. In existing files, match the file's style and touch only the code the task changes.

| Rule | Summary |
|------|---------|
| Module system | Follow `"type"` in `package.json`: ES modules when it is `"module"`, CommonJS otherwise. Do not mix them in one package. Import built-ins with the `node:` prefix, such as `node:fs/promises`. |
| TypeScript on Node | Use the project's build or runner (tsc, tsx, esbuild) when it has one. Running `.ts` files directly through type stripping (on by default from 22.18 and 23.6, stable from 24.12) allows erasable syntax only: no `enum`, no `namespace` with values, no parameter properties, no `paths` aliases, `.ts` extensions in relative imports and `import type` for types. |
| Plain JavaScript | Stay in the project's language and do not convert files to TypeScript unless asked. Without a compiler, validate every boundary with the project's schema library or explicit checks. |
| Async | `async` and `await` throughout, and the promise APIs (`node:fs/promises`, `node:timers/promises`). Every promise is awaited, returned, or handed to code that handles its rejection. `Promise.all` for independent work, `Promise.allSettled` when partial failure is acceptable. Wrap old callback APIs with `util.promisify`. |
| Event loop | No synchronous I/O (`readFileSync`, `execSync`, sync crypto) on request or message paths. Startup code and CLI scripts may use it. Move CPU-heavy work to `worker_threads` or a queue. Limit the size of request bodies and uploads. |
| Timeouts and cancellation | Every outbound call has a deadline, such as `fetch(url, { signal: AbortSignal.timeout(10_000) })`. Accept an `AbortSignal` in long operations and pass it down. |
| Streams | Chain streams with `pipeline` from `node:stream/promises`, never bare `.pipe()`, so errors and backpressure propagate. Stream large files and responses instead of reading them whole. |
| Errors | Throw `Error` subclasses and pass `{ cause }` when wrapping. Handle errors at the boundary: the HTTP handler, the message handler, the CLI entry. Never `.catch(() => {})`. Let `uncaughtException` and `unhandledRejection` log and exit, and let the process manager restart the service. |
| Configuration | Read `process.env` once at startup into a validated, frozen config object and fail fast on missing values. On Node 20.12 and newer, load `.env` files with `--env-file` or `process.loadEnvFile` instead of adding a package. |
| Lifecycle | Handle `SIGTERM` and `SIGINT`: stop taking new work, finish requests in flight, close servers and database pools, then exit. Call `process.exit` only in a CLI entry point. |
| Child processes | `execFile` or `spawn` with an argument array and no shell. Never `exec` with interpolated input. |
| Injection and parsing | Parameterized queries or the ORM's bindings, never values in SQL strings. No `eval`, `new Function` or `node:vm` as a sandbox for untrusted code. Do not merge parsed JSON into existing objects without rejecting `__proto__`, `constructor` and `prototype` keys. Use `Map` or `Object.create(null)` for dictionaries keyed by input. |
| Files and paths | Resolve with `path.resolve` and check that the result stays inside the allowed base directory before reading or writing a path built from input. |
| Crypto | `crypto.randomUUID` and `crypto.randomBytes` for ids and tokens, `crypto.timingSafeEqual` to compare secrets, `crypto.scrypt` or the project's bcrypt or argon2 for passwords. Secrets come from the environment, never from code or logs. |
| Dependencies | Lockfile committed, and a frozen install (`npm ci`, `pnpm install --frozen-lockfile`, `yarn install --immutable`) in CI and deploys. Prefer what the target version has built in (`fetch`, `node:test`, `util.parseArgs`) over a package. Add a package only after checking it on npm. |
| Real tests | The project's test runner, or `node:test` for a project without one. Test HTTP code through a real server on an ephemeral port and a real database in a container or SQLite. Mock only third-party network calls and the clock. |
| Logging | The project's structured logger with context such as request and user ids. No `console.log` in shipped service code. It stays only for a CLI's real output. |
| Style | The project's ESLint and Prettier, or Biome, with its config. `const` by default, `let` only when reassigned, never `var`, and `===` only. |
| No comments | No JSDoc or comments, per the Comments house rule of the **poteto-mode** skill. One exception: in a JavaScript project that type-checks with `checkJs` or `// @ts-check`, JSDoc type tags such as `@type`, `@param {T}`, `@returns` and `@typedef`, with no prose, stay, because the checker needs them. |

Examples: `references/patterns.md`.
