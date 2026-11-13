## Replacing the previous caching model

| Before | With Cache Components |
|---|---|
| `dynamic = 'force-dynamic'`, `revalidate = 0`, `unstable_noStore()` | Remove. Uncached data already runs per request. Use `await connection()` under `<Suspense>` when work must run per request without reading request data. |
| `dynamic = 'force-static'` | Remove, then wrap the data in `'use cache'` with `cacheLife('max')`. Request APIs now return real values. Add `ensureStatic = 'navigation'` when the route must stay fully static. |
| `dynamic = 'error'` | Remove. `fetch` is no longer cached by default, so wrap data that relied on that in `'use cache'`. |
| `revalidate = 3600` | `'use cache'` plus the closest `cacheLife` profile, or a custom profile in `next.config`. |
| `fetchCache` | Remove. Fetches are cached only inside a `'use cache'` scope. |
| `fetch(url, { cache: 'force-cache', next: { revalidate, tags } })` | A `'use cache'` function with `cacheLife` and `cacheTag`. The old Data Cache persisted across deploys and instances, the new default store does not. |
| `unstable_cache(fn, keyParts, opts)` | Keeps working. To convert, mark the function `'use cache'`, drop the key parts (arguments form the key) and move options to `cacheLife` and `cacheTag`. |
| `dynamicParams = false` | Delete the export and call `notFound()` for unknown params. |
| `generateStaticParams` returning `[]` | Return at least one real param. Removing the export opts the route out of ISR. |
| `runtime = 'edge'` or `'nodejs'` | Remove. Cache Components needs the Node.js runtime. |
| `dynamic = 'force-static'` on a `GET` route handler | Move the data access into a helper marked `'use cache'`. The directive is not allowed in the handler body. |
| `experimental.dynamicIO` | Fatal before the build starts. Replace it with `cacheComponents: true`. Remove `experimental.useCache`, `experimental.ppr` and `experimental_ppr` exports. |
| `generateMetadata` reading request data | Cache external data with `'use cache'`. If it must read request data, render a marker component that awaits `connection()` inside `<Suspense>` so the page body still prerenders. |

## Adopting in an existing app

- Find the config first: `grep -rnE "^export const (dynamic|revalidate|fetchCache)" app`. Each match errors once the flag is on.
- If the app already uses `'use cache'`, the build fails until the flag is on, so there is no passing baseline before enabling it.
- When both `app/` and `src/app/` exist, Next.js builds only `app/`. Ask which tree to migrate.
- `npx @next/codemod@latest cache-components-instant-false ./app` adds `export const instant = false` with a `// TODO: Cache Components adoption` comment to every page, layout and default file that is not `'use client'` or `'use server'`. It refuses a dirty working tree unless given `--force`. A wrong path reports `0 ok` and exits 0, so check the file count.
- The highest `instant = false` decides its whole subtree. Remove opt-outs top-down, root layout first. Removing a leaf's opt-out changes nothing while an ancestor keeps one, and a layout whose descendants keep opt-outs can pass the build while still blocking.
- A Client Component cannot export `instant`. A file with a top-level `'use cache'` cannot either ("Only async functions are allowed to be exported in a 'use cache' file"), which means the directive was wrong for that route.
- When the synthetic `/_not-found` route blocks, fix the root layout. It has no file of its own.
- With `generateStaticParams` and Partial Prefetching off, await `params` outside `<Suspense>` to keep ISR for unlisted paths. With Partial Prefetching on, await it inside `<Suspense>` so an unlisted path serves a shell first.
- Keep `instant = false` only on segments that must block. Adoption is done when the dev overlay is clean, `next build` passes, the browser shows the intended static shell on first paint, and `grep -rn "TODO: Cache Components adoption" app` finds nothing.
