# Routing and rendering

## Decide which state belongs in the URL

Use the existing router and route conventions, and put state in the URL when users need to bookmark, share, reload, or revisit it, such as committed filters, sort order, pagination, and selected records, while keeping hover state, open tooltips, and unsubmitted sensitive drafts local, because syncing every state variable to the URL clutters history and leaks drafts into shareable links.

<example>
`/orders?status=open&page=2` carries the filter and the page, while the open tooltip and the half-typed message stay in component state.
</example>

Choose a canonical owner for route state and parse it into the view instead of running competing effects that rewrite each other, distinguish a missing parameter from an explicit empty value, validate parameters against the route contract, and use the router's serialization or URL APIs and not manual string assembly, because competing writers loop and hand-built query strings break on `&`, spaces, encoded characters, and signed URLs. Account for encoding differences when preserving query parameters or signed URLs.

<example>
`useSearchParams()` is the only source of `status`, `?status=` means "explicitly empty" while a missing `status` means the default, and links are built with `URLSearchParams`.
</example>

Choose history behavior by user intent, giving a deliberate navigation a new entry and a transient filter edit a replacement and not an entry per keystroke, so that Back and Forward restore the meaningful prior state including the initial entry, and add no second History API implementation under an existing router, because two implementations fight over the same history stack.

<example>
Choosing a tab pushes `?tab=billing`, typing in the filter box uses `replace`, and Back after three tab changes returns to the previous tab.
</example>

Use real links for navigation so that opening another tab and copying a destination work, preserve the application's page-title, focus, and scroll-restoration conventions, leave focus alone on every search result refresh, and show route failures at a boundary that keeps navigation and a recovery path usable, because a click handler on a generic element breaks middle-click and screen reader link lists, and a failure that replaces the whole shell strands the user.

<example>
Result rows render `<a href="/orders/1042">`, the document title changes per route, and `/orders/9999` shows "Order not found" inside the layout with a link back to `/orders`.
</example>

## Check direct entry, not only client navigation

Open a nested destination directly and reload it, and confirm that server routing or the existing static-host fallback can serve it, because an interface reached through an in-app link can look healthy while its direct URL returns an error. Leave deployment routing outside the requested scope unchanged, and state the exact hosting gap when it blocks the requested route.

<example>
Loading `/settings/billing` in a fresh tab returns `404` on the static host, so the report names the missing `index.html` fallback rewrite and the hosting configuration stays untouched.
</example>

Exercise encoded values, missing parameters, and invalid selections, test a changed filter with an old page number, and use Back after several changes, preserving unrelated query parameters when their contract requires it and clearing or clamping pagination only by the product's rules, because a filter change often leaves a page number that no longer exists. Confirm that the URL, the selected content, and the recovery state agree after each step.

<example>
From `?status=open&page=5`, switching to a status with two pages lands on page 1 as the product defines, keeps `utm_source`, and Back returns to `page=5` with the same rows selected.
</example>

## Preserve the rendering strategy

Identify whether the changed surface is server-rendered, prerendered, hydrated, or client-only and preserve those boundaries unless the task requires a change, because converting a whole page to client rendering to avoid one browser-only dependency costs it its server-rendered content and first-load speed.

<example>
A `window.matchMedia` call goes into a small client-only `ThemeToggle` and the page around it stays server-rendered.
</example>

For hydrated content, make the initial client render match the server output, checking invalid HTML nesting, unstable IDs, random values, time zones, locale formatting, and browser-dependent branches, and fix that cause and not the reconciliation code, because a browser may repair invalid server markup before hydration starts and the mismatch then survives any client-side change.

<example>
A `<div>` inside a `<p>` becomes a `<span>`, `Math.random()` ids become `useId()`, and dates are formatted with an explicit time zone.
</example>

Keep browser-only access out of server execution, use the framework's client lifecycle or a narrowly scoped client-only boundary where needed, keep a stable initial representation or serialize the required initial inputs, and reserve the affected space if a client-only enhancement appears later, because a runtime guard prevents a crash and still produces different initial markup.

<example>
`typeof window !== "undefined" ? localStorage.theme : "light"` renders differently on server and client, so the component renders `"light"` first, reads storage in an effect, and reserves the toggle's space.
</example>

Use a documented hydration-warning escape hatch only for a genuinely unavoidable, isolated difference, explain that difference in the report, and verify it does not hide a structural mismatch or attach behavior to the wrong element, because blanket suppression conceals real defects.

<example>
A `<time>` element showing the viewer's local time gets `suppressHydrationWarning` on that element only, and the report says why.
</example>

## Keep server state request-scoped

Keep user-specific mutable state out of server module singletons, use the framework's per-request application or store mechanism, scope caches to their intended identity, and serialize only data the browser is authorized to receive, because module instances can survive across requests so one user's data can reach another, and hydration data is visible to the client.

<example>
A module-level `const cart = {}` in `server/store.ts` becomes a store created per request, and only `{ id, name }` of the user is serialized and not the full record with `email`.
</example>

Meet the framework's own obligations without adopting another renderer, and avoid direct DOM mutation before the framework can reconcile it, because the framework reconciles against the DOM it rendered. In React, inspect hydration warnings and keep the framework-owned root intact, in Vue, review platform API access and cross-request state ownership, and in Angular, preserve the generated hydration markers and DOM structure.

<example>
A script that appends a banner inside the Angular-rendered `<app-root>` before bootstrap becomes a component rendered by the framework.
</example>

## Verify the first interaction

Check a cold direct load as well as later navigation, use a supported non-default locale or time zone when the content depends on them, interact before and after hydration where the framework supports early interaction, and confirm that a submitted action is not lost or repeated, that no hydration mismatch is reported, and that content does not visibly reset after attachment, because the first load is the only path that runs on server HTML and then replaces it.

<example>
Load `/checkout` with the browser locale set to `de-DE`, click "Apply coupon" right after first paint, and confirm the coupon applies once and the typed code is still in the field.
</example>
