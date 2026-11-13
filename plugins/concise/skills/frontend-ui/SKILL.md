---
name: frontend-ui
description: Current web UI practice for Tailwind CSS v4, shadcn/ui, WCAG 2.2 accessibility, Core Web Vitals (LCP, INP, CLS), responsive images and visual design that does not look templated. Use when building, styling, reviewing or debugging components, pages, forms, dialogs or landing pages, editing CSS, globals.css, tailwind.config or components.json, writing Tailwind classes, running shadcn init or add, upgrading Tailwind from v3, fixing contrast, focus, keyboard or screen reader issues, running an accessibility audit, chasing slow LCP, poor INP, layout shift or a low Lighthouse or PageSpeed score, loading images, adding dark mode, or when asked to make a page look better or less generic.
---

## Check first

- Read `package.json` for the Tailwind major and integration (`tailwindcss`, `@tailwindcss/vite`, `@tailwindcss/postcss`, `@tailwindcss/webpack`, `@tailwindcss/cli`). A v4 project imports Tailwind in CSS with `@import "tailwindcss"`, and a `tailwind.config.*` there loads only through `@config`.
- In a shadcn/ui project, read `components.json` and run `npx shadcn@latest info --json` with the project's package runner. It reports `base` (`base`, `radix` or `aria`), `style`, `tailwindVersion`, `tailwindCssFile`, `iconLibrary`, `aliases` and the installed components.
- Read the browser targets (`browserslist` or the documented support policy). Tailwind v4 needs Safari 16.4, Chrome 111 and Firefox 128. Check a feature's Baseline status before using it without a fallback.
- Measure before optimizing: field data at p75 (CrUX, RUM) first, then a lab trace of the failing metric. Claim a field improvement only after new visits arrive.
- Fetch web.dev and developer.chrome.com pages as markdown by appending `.md.txt` to the URL. A `.md` suffix returns HTML.
- Current versions: https://registry.npmjs.org/tailwindcss/latest and https://registry.npmjs.org/shadcn/latest
- Facts verified 2026-11.

## Defaults

- Tailwind CSS 4.3 is current (4.3.5). Configuration lives in CSS: `@theme` tokens generate utilities, `@utility` defines custom utilities that take variants, `@custom-variant` redefines variants such as `dark`, `@source` adds scan paths, and `@reference` gives CSS modules and Vue or Svelte style blocks the theme without duplicating CSS.
- Use `@theme inline` when a token points at another variable (`--color-background: var(--background)`). Tailwind emits only the theme variables something uses, so use `@theme static` when JS or inline styles read variables no class references.
- The spacing scale is open-ended (`w-150`, `mt-17`, `grid-cols-15`), so most v3 arbitrary values have a plain utility. Keep brackets for real one-offs such as `max-h-[calc(100dvh-3rem)]`.
- Tailwind 4.2 added `inset-s-*` and `inset-e-*` (deprecating `start-*` and `end-*`), logical `pbs-*`, `mbs-*`, `inline-*` and `block-*` utilities, the `mauve`, `olive`, `mist` and `taupe` palettes, `font-features-*`, and a `@tailwindcss/webpack` loader about twice as fast as the PostCSS plugin under Next.js.
- Tailwind 4.3 added `scrollbar-thin`, `scrollbar-none`, `scrollbar-thumb-*`, `scrollbar-track-*`, `scrollbar-gutter-stable`, `@container-size` (for `cqb` and `cqh` units), `zoom-*`, `tab-*`, stacked and compound `@variant` blocks (`@variant hover:focus`, `@variant hover, focus`) and `--default()` for bare functional utilities.
- shadcn CLI 4 is current (4.23.0). Since July 2026 `init` defaults to Base UI. Pass `-b radix` in scripts and CI that expect Radix. The `aria` base uses React Aria.
- Base UI composes through `render={<MyButton />}`, Radix through `asChild`. Check `base` before writing either. The Base UI package is `@base-ui/react`, formerly `@base-ui-components/react`.
- Since September 2026 components import `cn` from the `cn` package, a drop-in for `twMerge(clsx(...))`, and `lib/utils.ts` re-exports it. `npx shadcn@latest migrate cn` converts older projects.
- `init` adds `@import "shadcn/tailwind.css"` (custom variants such as `data-open:` plus accordion animations) and `tw-animate-css`, which replaced `tailwindcss-animate`. `npx shadcn@latest eject` inlines that file and cannot be undone.
- Radix-based components import from the unified `radix-ui` package. `npx shadcn@latest migrate radix` rewrites `@radix-ui/react-*` imports.
- Toasts follow the base: the `toast` component for Base UI, `sonner` for Radix and Aria.
- In shadcn projects use semantic tokens (`bg-primary`, `text-muted-foreground`) and component variants, not raw palette colors or manual `dark:` overrides. Dialog, Sheet and Drawer need a Title, hidden with `sr-only` when it should not show.
- WCAG 2.2 (W3C Recommendation, October 2023) is the current target. It removed 4.1.1 Parsing and added 2.4.11 Focus Not Obscured, 2.5.7 Dragging Movements, 2.5.8 Target Size and 3.3.8 Accessible Authentication at AA, plus 3.2.6 Consistent Help and 3.3.7 Redundant Entry at A.
- 2.5.8: a target is at least 24 by 24 CSS px, or a 24 px circle centered on each undersized target touches no other target or circle. Inline text links and native controls whose size the author left alone are exempt, and page zoom does not count.
- 2.4.11: sticky headers, footers and banners must not cover the focused element entirely. Set `scroll-padding-top` on the scroll container to the sticky height.
- 3.3.8: no login step may require recalling, transcribing or solving something unless paste and password managers work. Retyping a one-time code counts, so allow paste and set `autocomplete="one-time-code"`. Passkeys and email links satisfy the criterion.
- 2.5.7: every drag action needs a single-pointer alternative, such as move buttons or a menu.
- Large text for contrast means at least 18 pt (24 CSS px) regular or 14 pt (about 18.7 CSS px) bold, not 18 px. Body text needs 4.5:1. Large text, focus indicators and UI component boundaries need 3:1.
- Core Web Vitals pass at p75: LCP 2.5 s, INP 200 ms, CLS 0.1. Since Safari 26.2 (December 2025) LCP and INP are measurable in every major browser, so RUM now includes Safari users. CLS and Long Animation Frames remain Chromium-only, and CrUX covers only Chrome.
- Collect field data with `web-vitals` 6. Its `web-vitals/attribution` build splits LCP into `timeToFirstByte`, `resourceLoadDelay`, `resourceLoadDuration` and `elementRenderDelay`, and INP into input delay, processing and presentation delay with the target and the longest script. Fix the subpart that dominates, then compare all of them again: a smaller LCP image often moves the saved time into render delay and leaves LCP unchanged.
- Yield in long tasks with `scheduler.yield()` where it exists (Chromium 129, Firefox 142, not Safari) and fall back to a `setTimeout` promise.
- The LCP image sits in the initial HTML as an `<img>` with `fetchpriority="high"` on that one image, explicit `width` and `height`, and no `loading="lazy"`. Preload it only when a trace shows late discovery (CSS background, JS render), with `imagesrcset` and `imagesizes` for responsive sources. For `next/image` see concise:react-next.
- A `srcset` with `w` descriptors needs `sizes`, or the browser assumes `100vw` and downloads the largest candidate.
- Serve AVIF (Baseline) in `<picture>` with a WebP or JPEG fallback. `loading="lazy"` on `<video>` and `<audio>` is Chromium-only, so use `preload="none"` with a `poster`.

## Gotchas

- `outline-none` in Tailwind v4 removes the outline, even in forced-colors mode. Use `outline-hidden` and add a `focus-visible:` ring with 3:1 contrast.
- Tailwind v4 `hover:` applies only on devices that hover. Keep required actions reachable without hover.
- Tailwind cannot see class names built by concatenation (`bg-${tone}-500`). Map props to complete class strings. Biome 2.6 flags them with the nursery rule `useTailwindStaticClassStrings`.
- Tailwind skips `.gitignore`d paths and `node_modules`. A component library built with Tailwind needs `@source "../node_modules/<lib>"`. In a monorepo built from the root, set the base with `@import "tailwindcss" source("../src")`.
- Third-party registry components can hardcode `@/components/ui` imports and `lucide-react`. Rewrite them to the project's `aliases` and `iconLibrary` after adding them.
- Preview upstream shadcn changes with `npx shadcn@latest add <name> --dry-run` and `--diff <file>`. `--overwrite` replaces local edits, so use it only with the user's approval.
- A `<dialog>` opened with `showModal()` already makes the rest of the page inert, so a JS focus trap is redundant. Invoker commands are Baseline since December 2025: `<button commandfor="dlg" command="show-modal">` opens it without JS. Popover is Baseline since January 2025. `closedby`, anchor positioning and customizable `<select>` are not Baseline yet.
- Safari removes list semantics from `<ul>` and `<ol>` styled `list-style: none` (Tailwind `list-none`) outside `<nav>`. Add `role="list"` when the item count matters.
- A custom button-like widget activates on Enter at keydown and on Space at keyup, like a native button. A native `<button>` needs no key handlers.
- `disabled` removes a control from the tab order. `aria-disabled="true"` keeps it focusable and needs JS to block activation.
- A heading inside `<summary>` loses its heading role in some browsers. Put a disclosure button inside the heading instead.
- Voice control software relies on an explicit `<label for>` that matches the input `id`. Nesting the input in the label is not enough for all of them.
- The visible label text must appear verbatim in the accessible name (2.5.3). A button showing "Find" with `aria-label="Search products"` fails.
- Use `role="alert"` or `aria-live="assertive"` only for critical, time-sensitive events. Show loading with `<progress>` instead of announcing it, keep one polite and one assertive region per page, and debounce frequent updates.
- iOS Safari zooms into inputs whose font size is under 16 px. Use at least 16 px on mobile instead of `maximum-scale=1` or `user-scalable=no`, which block zoom (1.4.4).
- Dark themes need `color-scheme: dark` (Tailwind `scheme-dark`) so scrollbars and form controls follow. A native `<select>` on Windows also needs explicit `background-color` and `color`.
- `Cache-Control: no-store` on an HTML page keeps it out of the back/forward cache. Use it for private data only and `no-cache` for freshness.
- Speculation Rules prerendering is Chromium-only and runs page scripts before the user navigates. Gate analytics and other side effects on `document.prerendering` and the `prerenderingchange` event.
- `content-visibility: auto` (Baseline since September 2025) needs `contain-intrinsic-size: auto 500px` (a realistic size), or the scrollbar jumps. Leave it off above-the-fold content.
- An element that moved is often the victim of a layout shift. Find the inserted or resized node from the `layout-shift` entry sources before changing the moved element.

## References

- Read [tailwind-v4.md](references/tailwind-v4.md) when writing Tailwind classes or CSS config, reviewing class names, or migrating from v3.
- Read [visual-design.md](references/visual-design.md) when designing a new page or component, restyling an existing one, or writing UI copy.
