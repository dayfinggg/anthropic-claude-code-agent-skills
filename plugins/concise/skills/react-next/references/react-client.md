# Client Components, Transitions and view transitions

## Transitions and Effects

- In `startTransition(async () => ...)`, state updates after an `await` are not Transitions until wrapped in another `startTransition`. Async actions can also finish out of order, so use `useActionState` or drop stale responses.
- A function from `useEffectEvent` changes identity on every render by design. Keep it out of dependency arrays, call it only from Effects, and do not pass it to other components or Hooks.
- `<Activity mode="hidden">` hides children with `display: none`, keeps their state and destroys their Effects until they are visible again. A hidden Activity whose child is bare text renders nothing.
- React 19.3 double-invokes Effects in Strict Mode during hydration too. React 19.2 changed `useId` values to the `_r_` prefix, which breaks selectors and snapshots that matched `:r:` or `«r»`.
- `use(browser())` from `react-dom` suspends on the server and not on the client, so the nearest `<Suspense>` fallback is the server HTML. Give it a boundary of its own.
- `next/dynamic` with `ssr: false` errors in a Server Component. Use it in a Client Component, or call `use(browser())` in a Client Component under `<Suspense>`.

## Server Actions and after()

- Arguments added to a Server Action with `.bind` are sent to the client and come back as client input, unlike closed-over values, which Next.js encrypts. Keep secrets out of both, and authorize bound IDs inside the action. Next.js advises against relying on the encryption alone.
- In a page, layout or `generateMetadata`, an `after()` callback that calls `cookies()` or `headers()` throws. Read them before `after()`. Route handlers and Server Functions allow them. On a static page the callback runs at build or revalidation time.

## View transitions in the App Router

- `<ViewTransition>` animates only updates inside `startTransition`, a `<Suspense>` reveal or `useDeferredValue`, and App Router navigations, not a plain `setState`.
- A shared-element morph needs the same `name` on the old and new element. Two mounted elements with the same name break the transition, so add an ID to each name in lists. Set `default="none"` on named elements so they do not crossfade on every unrelated transition.
- The morph plays when the destination renders in the same commit as the navigation, as with prefetched pages. If the destination suspends into a fallback first, the content gets its enter animation instead.
- Tag directional navigations with `<Link transitionTypes={['nav-forward']}>` and map types to animations in the `enter` and `exit` props. Browser back and swipe gestures carry no type, so only the shared-element morph plays for them.
- Put the enter and exit wrapper in each `page.tsx`, not in a layout, because layouts persist across navigations and enter and exit never fire there.
- Named elements are skipped by hit-testing while a transition runs, so keep transitions short and do not name controls users click rapidly.
- Under `prefers-reduced-motion: reduce`, keep crossfades and drop positional movement instead of removing every animation.
- Transition types and `view-transition-class` need Chromium 125 or a recent Safari or Firefox. Without support the navigation still works, unanimated.
- View transitions do not move focus. After a navigation or a swap that removes the focused element, move focus to the new content or its heading.
