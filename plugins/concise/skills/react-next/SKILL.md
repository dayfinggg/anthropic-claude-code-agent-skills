---
name: react-next
description: React and Next.js App Router practice covering Server and Client Components, Server Functions, Cache Components and use cache, revalidation, proxy.ts, Suspense streaming, view transitions and the React Compiler. Use when writing, reviewing or upgrading app/ routes, route.ts, proxy.ts, next.config.ts or files marked 'use client', 'use server' or 'use cache', or on hydration, blocking-prerender or next-request-in-use-cache errors.
---

# React and Next.js App Router

This skill matches React 19.3 and Next.js 16.4. The 16.x line is Active LTS, and 15.x is Maintenance LTS with security releases through 2027-01-31. Run `npm ls next react react-dom` (or the project's package manager) to see what is installed. Where the installed release is newer, the docs bundled in `node_modules/next/dist/docs/` and the release notes are right.

## Check first

- Read `package.json` and the lockfile for `next`, `react`, `react-dom`, `babel-plugin-react-compiler` and `eslint-plugin-react-hooks`, and `next.config.*` for `cacheComponents`, `partialPrefetching`, `reactCompiler` and `experimental` keys.
- Next.js 16.2 and later ship docs that match the installed version in `node_modules/next/dist/docs/`. Read the matching guide there before writing Next.js code. In a monorepo resolve `node_modules/next` from the app folder, and find a page with `find node_modules/next/dist/docs -name '<slug>.md'`.
- Error pages under `/docs/messages/` are not bundled. Every nextjs.org docs page, those included, has a Markdown version at its `.md` URL.
- `next dev` (16.3+) writes a managed block between `nextjs-agent-rules` markers into `AGENTS.md` when it detects a coding agent, and writes it again after it is removed. Either commit it with the work or set `agentRules: false` in `next.config`. Reverting it only recreates the change.
- `next dev` records its PID, port and URL in `.next/dev/lock` and prints the running server when started twice. Reuse it. Its MCP endpoint at `/_next/mcp` reports routes, logs and compilation issues (`get_compilation_issues`, `compile_route`) without a full `next build`.

## Versions and upgrades

- Security releases ship as patches on both LTS lines. The 2026-11-03 release (16.4.5, 15.5.29) fixed cross-tenant and cross-user leaks in `use cache` and a cookie leak in Edge route handlers, so stay on the latest patch.
- React 19.3 made stable: `<ViewTransition>`, `addTransitionType`, `<Fragment ref>` (a `FragmentInstance`), `use(browser())` from `react-dom`, Trusted Types passthrough, and rendering a Context imported from a `'use client'` module directly as its provider in a Server Component. React 19.2 added `<Activity>`, `useEffectEvent`, `cacheSignal` and `prerender` with `resume`.
- Turbopack is the default for `next dev` and `next build` (`--webpack` opts out). `next lint` is gone, so run ESLint directly. `next build` type-checks with TypeScript 7 when the project depends on `typescript@^7` (16.3).
- Upgrade with `npx next@canary upgrade --agent=latest` (16.4), which prepares guides, codemods and checks for an agent. `npx @next/codemod@latest upgrade latest` runs only the codemods.

## Cache Components

- Next.js 16.4 recommends Cache Components for every app, `create-next-app` enables it, and Next.js 17 makes it the default. Set both `cacheComponents: true` and `partialPrefetching: true`. Leaving `partialPrefetching` unset logs a warning.
- Data is uncached and runs at request time unless it sits in a `'use cache'` scope. Give every cache a `cacheLife` profile (`seconds`, `minutes`, `hours`, `days`, `weeks`, `max`) and tag it with `cacheTag`. Without `cacheLife` the `default` profile applies: stale 5 minutes, revalidate 15 minutes, never expires.
- Request-time reads (`cookies()`, `headers()`, `connection()`, `await params`, `await searchParams`) block the static shell unless they sit under `<Suspense>`. Pass the `params` promise into a child inside the boundary and await it there.
- `export const instant = false` marks a segment as allowed to block. `export const ensureStatic = 'navigation'` (or `'prefetch'`, `'shell'`) fails the build when dynamic content enters the route (16.4). `await navigation()` or `await prefetch()` from `next/cache` defers cached content to a later navigation stage (16.4).
- Invalidate with `updateTag(tag)` for read-your-writes, only inside Server Actions. In route handlers and webhooks use `revalidateTag(tag, 'max')`: the one-argument form is deprecated and a TypeScript error. `refresh()` from `next/cache` refreshes the client router from a Server Action without touching tagged data.
- A `'use cache'` result is shared across requests and users. Its key holds the arguments and the variables the function closes over, so pass the user or tenant ID in for per-user data, and keep arguments serializable.
- Cache traps, the in-memory default handler, and the migration from route segment configs and `unstable_cache` are in [references/cache-components.md](references/cache-components.md).

## Routing, request APIs and Server Functions

- `proxy.ts` with `export function proxy` replaces `middleware.ts`. Proxy runs only on Node.js and a `runtime` export there throws. Keep the deprecated `middleware.ts` only for Edge runtime needs. `use cache` and `fetch` cache options have no effect in Proxy.
- Request APIs are async only since 16 (`await cookies()`, `await params`). `next typegen` generates the global `PageProps<'/blog/[slug]'>`, `LayoutProps` and `RouteContext` helpers.
- `error.tsx` receives `retry()` (16.3), which re-fetches and re-renders the segment, while `reset()` only clears client state. `catchError` from `next/error` builds a component-level boundary that lets `notFound()` and `redirect()` pass through.
- `import { lang } from 'next/root-params'` reads a root dynamic segment such as `[lang]` in any Server Component, also inside `use cache` (16.3). Route handlers and Server Actions cannot use it yet.
- Server Functions are POST requests to the page route that uses them, so a Proxy `matcher` that excludes a path also skips them. Check authentication and authorization inside every Server Function. For authorization review see concise:web-security.
- Next.js encrypts the values a Server Action closes over, with a new key per build. Self-hosted apps on several instances or containers need the same `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (base64, 16, 24 or 32 bytes) everywhere, or calls fail when they reach another instance.
- `next/image`: `preload` replaces the deprecated `priority`, and `loading="eager"` or `fetchPriority="high"` usually fits better than either. `images.qualities` defaults to `[75]`. A local `src` with a query string needs `images.localPatterns` with `search`.

## Client Components and React

- React Compiler: `babel-plugin-react-compiler` 1.0 with top-level `reactCompiler: true`. Pin the exact version (`--save-exact`), since a compiler upgrade can change memoization and so effect timing. In new components rely on the compiler and use `useMemo` or `useCallback` only to keep an effect dependency stable, and leave existing memoization in place. `experimental.turbopackRustReactCompiler` enables the experimental Rust port.
- `eslint-plugin-react-hooks` 7 `recommended` includes the compiler-based rules (`set-state-in-effect`, `set-state-in-render`, `refs`, `purity`, `immutability`, `static-components`) and knows Effect Events.
- View transitions work in the App Router without configuration since 16.3 (remove `experimental.viewTransition`). Use React's `<ViewTransition>` with `<Link transitionTypes>` rather than calling `document.startViewTransition()` yourself. Patterns and traps are in [references/react-client.md](references/react-client.md).
- Client navigations through `<Link>` are same-document and prefetched by Next.js, so Speculation Rules do not apply to them. Speculation Rules only help full-document navigations, such as links to a separate app on the same origin, and they are Chromium-only.

## Gotchas

- `cookies()`, `headers()` and `searchParams` fail inside `'use cache'`, including in helpers it calls (`next-request-in-use-cache`). On a dynamic route this passes `next build` and fails under `next start`. Read them outside and pass plain values in.
- `new Date()`, `Date.now()`, `Math.random()` and `crypto.randomUUID()` during prerender fail the build even with `instant = false`. Call `await connection()` first inside a `<Suspense>` child, or move the call into a Client Component.
- With Cache Components on, `generateStaticParams` returning `[]` errors, and exporting `dynamicParams`, `dynamic`, `revalidate`, `fetchCache` or `runtime` errors. Return at least one param and call `notFound()` for unknown ones.
- `usePathname()` in a layout suspends on every page below it whose dynamic param is not in `generateStaticParams`, while static routes pass and hide it. `useSearchParams()` makes the client tree up to the nearest `<Suspense>` render on the client. Wrap such components in `<Suspense>`.
- Reading a cookie in the root layout to set `lang` or `data-theme` on `<html>` makes the whole tree request-bound, and `<html>` cannot be wrapped in `<Suspense>`. Set the attribute from a pre-paint inline script in `<head>` and add `suppressHydrationWarning` to `<html>`.
- A `<Suspense>` boundary around the whole page body passes validation with an empty shell. Check the first paint in a browser.
- A `try/catch` around `notFound()`, `redirect()` or a request API catches the error Next.js throws to control rendering. Call `unstable_rethrow(err)` first in the `catch`.
- Server module scope is shared by concurrent requests, also in `'use client'` modules during SSR. A module-level variable that holds request or user data leaks between users, so create a TanStack `QueryClient` or store per request on the server.
- A Server Component that fetches the app's own Route Handler (`fetch('/api/posts')`) fails, because server `fetch` needs an absolute URL and no server listens during `next build`. Call the data function directly.
- Props from Server to Client Components must be serializable. Class instances (Prisma `Decimal`, MongoDB `ObjectId`), null-prototype objects and plain functions fail. Map rows to plain objects with only the fields the client uses.
- Every parallel route slot needs a `default.js` since 16, or the build fails.
- A Proxy without a `matcher` also runs for `_next/static`, `_next/image` and `public/` files, so an auth redirect can block CSS and images.
- `next build --debug-prerender` adds source maps and keeps checking other routes after a failure. Never deploy such a build. `--debug-build-paths` takes file paths and globs such as `"app/admin/**/page.tsx"`, with `!` to exclude.

## References

- [references/cache-components.md](references/cache-components.md): read when using `'use cache'`, `cacheLife` or `cacheTag`, choosing a cache handler, enabling Cache Components in an existing app, or replacing route segment configs, `fetch` cache options or `unstable_cache`.
- [references/react-client.md](references/react-client.md): read when writing Client Components with Transitions, `useActionState`, `useEffectEvent`, `<Activity>`, `use(browser())` or `next/dynamic`, when adding view transitions, or when `after()` or Server Action arguments are involved.

Related skills: concise:typescript-javascript for TypeScript, tsconfig and the build and test tools, concise:frontend-ui for Tailwind, shadcn/ui, accessibility, Web Vitals and images, concise:web-security for authorization and data exposure review, concise:containers-iac for the Docker image and Compose setup, concise:testing for Playwright tests.
