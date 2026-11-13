---
name: react-next
description: Current React 19.3 and Next.js 16 App Router practice, covering Cache Components and the use cache directive, Server Components and Server Functions, route handlers, proxy.ts, caching and revalidation, Suspense streaming and RSC serialization. Use when writing, reviewing, debugging or upgrading React or Next.js code, including app/ pages and layouts, route.ts, proxy.ts or middleware.ts, next.config.ts, files marked 'use client', 'use server' or 'use cache', hydration mismatches, blocking-prerender or next-request-in-use-cache errors, revalidateTag or updateTag calls, React Compiler setup, View Transitions or Activity, or a quick question about which React or Next.js version or API to use.
---

## Check first

- Read `package.json` and the lockfile for `next`, `react`, `react-dom`, `babel-plugin-react-compiler` and `eslint-plugin-react-hooks`. Read `next.config.*` for `cacheComponents`, `partialPrefetching`, `reactCompiler` and `experimental` keys.
- On Next.js 16.2 or later, read the matching guide in `node_modules/next/dist/docs/` before writing Next.js code. Resolve `node_modules/next` from the app directory in a monorepo. Run `find node_modules/next/dist/docs -name '<slug>.md'` when the numbered folder prefix is unknown.
- Error pages under `/docs/messages/` are not bundled. Fetch the link the overlay or build log prints, with `.md` appended. Every nextjs.org docs page has a `.md` version.
- From 16.3, `next dev` writes a managed block between `nextjs-agent-rules` markers into `AGENTS.md` and restores it when removed. Commit it with the work instead of reverting it.
- `next dev` records its PID, port and URL in `.next/dev/lock`. Reuse a running dev server instead of starting a second one.
- Current Next.js release: https://registry.npmjs.org/next/latest
- Current React release: https://registry.npmjs.org/react/latest
- Facts verified 2026-11.

## Defaults

- Next.js 16.4 is current (16.4.6). 16.4 is the Active LTS line and 15.5 the Maintenance LTS line. Next.js publishes scheduled monthly security releases, so stay on the latest patch of the minor. The November 2026 release (16.4.5, 15.5.29) fixed cross-tenant cache leaks in `use cache`.
- React 19.3 is current (19.3.1). Stable since 19.3: `<ViewTransition>`, `addTransitionType`, `<Fragment ref>` (gives a `FragmentInstance`), `use(browser())` from `react-dom`, Trusted Types passthrough, and Server Components rendering a Context imported from a `'use client'` module directly as its provider. 19.2 added `<Activity>`, `useEffectEvent`, `cacheSignal` and `prerender` with `resume`.
- Next.js 16.4 recommends Cache Components for every app, `create-next-app` enables it, and Next.js 17 makes it the default. Enable both flags: `cacheComponents: true` and `partialPrefetching: true`.
- Under Cache Components, data is uncached and runs at request time unless it sits in a `'use cache'` scope. Set the lifetime with `cacheLife` (`seconds`, `minutes`, `hours`, `days`, `weeks`, `max`) and tag it with `cacheTag`. Without `cacheLife` the `default` profile applies (stale 5 minutes, revalidate 15 minutes).
- Request-time reads (`cookies()`, `headers()`, `connection()`, `await params`, `await searchParams`) block the static shell unless they sit under `<Suspense>`. Pass the `params` promise into a child inside the boundary and await it there.
- `export const instant = false` marks a segment as allowed to block. `export const ensureStatic = 'navigation'` (or `'prefetch'`, `'shell'`) fails the build when dynamic content enters the route (16.4). `await navigation()` or `await prefetch()` from `next/cache` defers cached content to a later navigation stage (16.4).
- Invalidation: `updateTag(tag)` gives read-your-writes and works only in Server Actions. `revalidateTag(tag, 'max')` needs the profile argument (the one-argument form is deprecated) and is the choice in route handlers and webhooks. `refresh()` from `next/cache` refreshes uncached data from a Server Action.
- `proxy.ts` with `export function proxy` replaces `middleware.ts`. Proxy runs only on Node.js, and a `runtime` export there throws. Keep the deprecated `middleware.ts` only for Edge runtime needs.
- Request APIs are async only since 16 (`await cookies()`, `await params`). `npx next typegen` generates the global `PageProps<'/blog/[slug]'>`, `LayoutProps` and `RouteContext` helpers.
- `error.tsx` receives `retry()` (stable in 16.3), which re-fetches and re-renders the segment, while `reset()` only clears client state. `catchError` from `next/error` builds a component-level boundary that lets `notFound()` and `redirect()` pass through.
- `import { lang } from 'next/root-params'` reads a root dynamic segment such as `[lang]` in any Server Component (16.3).
- `next/image`: `preload` replaces the deprecated `priority`, and `loading="eager"` or `fetchPriority="high"` usually fits better than either. `qualities` defaults to `[75]`. A local `src` with a query string needs `images.localPatterns`.
- Turbopack is the default for `next dev` and `next build` (`--webpack` opts out). `next lint` is gone, so run ESLint directly. `next build` type-checks with TypeScript 7 when the project depends on `typescript@^7` (16.3).
- React Compiler: `babel-plugin-react-compiler` 1.0 with top-level `reactCompiler: true`. Pin the exact version, since a compiler upgrade can change memoization and so effect timing. Write new components without `useMemo`, `useCallback` or `memo`, except to keep an effect dependency stable, and leave existing memoization in place. `experimental.turbopackRustReactCompiler` enables the experimental Rust port.
- `eslint-plugin-react-hooks` 7 `recommended` includes the compiler-based rules (`set-state-in-effect`, `set-state-in-render`, `refs`) and understands Effect Events.
- Upgrades: `npx next@canary upgrade --agent=latest` (16.4) prepares guides, codemods and checks for an agent. `npx @next/codemod@latest upgrade latest` runs only the codemods.

## Gotchas

- `cookies()`, `headers()` and `searchParams` fail inside `'use cache'`, including in helpers it calls. On a dynamic route this passes `next build` and fails under `next start`. Read them outside and pass plain values as arguments.
- A promise of request-time or uncached data that reaches a `'use cache'` function through props, a closure or a shared `Map` hangs the build for 50 seconds ("Filling a cache during prerender timed out"). Await it outside and pass the value.
- The default `use cache` handler is in memory. On serverless, runtime entries rarely survive between requests, and no entry survives a deploy because the key includes the build ID. Use `'use cache: remote'` for shared runtime caching. The `fetch` Data Cache and `unstable_cache` persist across deploys.
- `React.cache` gets an isolated scope inside each `'use cache'` function, so a value stored outside is invisible inside. Use `'use cache: private'` when request-scoped helpers must share work across cache scopes.
- A `'use cache'` result is shared across requests and users. Its key holds the arguments and the variables the function closes over, so pass the user or tenant ID in for per-user data. Arguments must be serializable, so class instances, `URL` objects and plain functions fail. Pass `children` and Server Actions through without reading them.
- A file-level `'use cache'` turns every export into a cached async function. A constant exported from that file is dropped for Client Components, and importing it fails the build with "export doesn't exist".
- `'use cache'` does nothing in `proxy.ts`, and `cacheLife` or `cacheTag` there throw.
- `new Date()`, `Date.now()`, `Math.random()` and `crypto.randomUUID()` during prerender fail the build even with `instant = false`. Call `await connection()` first inside a `<Suspense>` child, or move the call into a Client Component.
- With Cache Components on, `generateStaticParams` returning `[]` errors, exporting `dynamicParams`, `dynamic`, `revalidate` or `fetchCache` errors, and the `runtime` export is unsupported. Return at least one param and call `notFound()` for unknown ones.
- A Client Component in the root layout that calls `usePathname()` or `useSearchParams()` blocks every dynamic route, while static routes pass and hide it. Wrap it in `<Suspense>`.
- Reading a cookie in the root layout to set `lang` or `data-theme` on `<html>` makes the whole tree request-bound. Set the attribute from an inline script in `<head>` instead.
- A `<Suspense>` boundary placed too high still shows as Partial Prerender in the build output while the shell is empty. Check the first paint in a browser.
- Dev validation errors still return HTTP 200. Read the overlay, the terminal or the `/_next/mcp` server, not status codes.
- A `GET` route handler bails out of prerendering by throwing. A `try/catch` around its data access catches the bail-out, so rethrow it instead of logging it.
- `next build --debug-build-paths` takes file globs such as `"app/admin/**/page.tsx"`. A URL path or a bare folder matches nothing and silently builds zero routes. `--debug-prerender` continues past the first failing route.
- A proxy `matcher` that excludes a path also skips Server Function calls there, because they are POST requests to the page route. Check auth inside every Server Function. For authorization review see concise:web-security.
- A proxy without a `matcher` also runs for `_next/static`, `_next/image` and `public/` files, so an auth redirect can block CSS and images.
- Server module scope is shared by concurrent requests. A module-level variable that holds request or user data leaks between users. Pass request data down as props. This includes `'use client'` modules during SSR, so create a TanStack `QueryClient` or store per request on the server and reuse one only in the browser.
- A Server Component that fetches the app's own Route Handler (`fetch('/api/posts')`) fails, because server `fetch` needs an absolute URL and no server listens during `next build`. Call the data function directly.
- Props from Server to Client Components must be serializable. Class instances (Prisma `Decimal`, MongoDB `ObjectId`), null-prototype objects, unregistered symbols and plain functions fail. Map rows to plain objects with only the fields the client uses.
- `next/dynamic` with `ssr: false` errors in a Server Component. Use it in a Client Component, or call `use(browser())` in a Client Component under `<Suspense>`. Without a Suspense boundary, `use(browser())` fails the server render.
- In a page, layout or `generateMetadata`, an `after()` callback that calls `cookies()` or `headers()` throws. Read them before `after()`. Route handlers and Server Functions allow them. On a static page the callback runs at build or revalidation time.
- In `startTransition(async () => ...)`, state updates after an `await` are not Transitions until wrapped in another `startTransition`. Async actions can also finish out of order, so use `useActionState` or drop stale responses.
- A function from `useEffectEvent` changes identity on every render. Keep it out of dependency arrays and call it only from Effects.
- `<ViewTransition>` animates only updates from `startTransition`, a Suspense reveal or `useDeferredValue`, not a plain `setState`. Set `name` only for shared-element transitions. Two mounted `<ViewTransition>` elements with the same name make the transition error, so add an id to each name.
- `<Activity mode="hidden">` keeps state but unmounts Effects. A hidden child that renders bare text outputs nothing.
- React 19.3 double-invokes Effects in Strict Mode during hydration too. React 19.2 changed `useId` values to the `_r_` prefix, which breaks selectors and snapshots that matched the old format.
- Every parallel route slot needs a `default.js` since 16, or the build fails.
- Next.js encrypts the values a Server Action closes over, but arguments added with `.bind` reach the client unencrypted and return as client input. Keep secrets out of both, and authorize bound IDs inside the action.
- Self-hosted apps on several instances need the same `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` everywhere, or Server Action calls can fail when they land on another instance.

## References

- Read [cache-components.md](references/cache-components.md) when enabling Cache Components in an existing app or replacing route segment configs, `fetch` cache options or `unstable_cache`.
