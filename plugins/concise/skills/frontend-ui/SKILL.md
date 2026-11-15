---
name: frontend-ui
description: Web UI practice for Tailwind CSS v4, shadcn/ui, native HTML and CSS features checked against a Baseline target, WCAG 2.2 accessibility, Core Web Vitals, images and visual design. Use when building, styling or reviewing pages, forms, dialogs, popovers, tooltips or animations, editing globals.css or components.json, modernizing legacy front-end code, fixing contrast, focus, slow LCP, INP or layout shift, or making a page look less generic.
---

# Web UI

This skill matches Tailwind CSS 4.3, the shadcn CLI 4.23 with Base UI as the default base, WCAG 2.2, the Core Web Vitals thresholds with `web-vitals` 6, and Chrome's Modern Web Guidance 1.0. Run `npm ls tailwindcss shadcn web-vitals` (or the project's package manager) and, in a shadcn/ui project, `npx shadcn@latest info --json`. Where the installed release is newer, its own docs and changelog are right.

## Check first

- Read `package.json` for the Tailwind major and integration (`tailwindcss`, `@tailwindcss/postcss`, `@tailwindcss/vite`, `@tailwindcss/webpack`, `@tailwindcss/turbopack`, `@tailwindcss/cli`). A v4 project imports Tailwind in CSS with `@import "tailwindcss"`, and a `tailwind.config.*` there loads only through `@config`.
- In a shadcn/ui project, `npx shadcn@latest info --json` reports the base (`base`, `radix` or `aria`), style, Tailwind version and CSS file, icon library, aliases and installed components.
- Find the Baseline target: a line such as `This project's Baseline target is Baseline 2024.` in `CLAUDE.md` or `AGENTS.md`, else `browserslist` or the documented support policy, else Baseline Widely available. Tailwind v4 itself needs Safari 16.4, Chrome 111 and Firefox 128.
- Measure before optimizing: field data at p75 (CrUX, RUM) first, then a lab trace of the failing metric.
- web.dev and developer.chrome.com pages are available as Markdown by appending `.md.txt` to the URL (a `.md` suffix returns HTML).

## Native platform first

- Before writing JavaScript for UI behavior, use the HTML or CSS feature that does it: `<dialog>` with `showModal()` for modals, the `popover` attribute for menus and toasts, `command` and `commandfor` (Baseline since 2025-12) to open them without JS, `<details name>` for accordions, `field-sizing: content` for growing textareas, `:user-invalid` for validation styles, `:has()` for parent state, `light-dark()` for themes, `@starting-style` for entry animations, `animation-timeline: view()` for scroll effects.
- A feature outside the Baseline target is added as progressive enhancement, or with a polyfill loaded only after feature detection fails. The table of legacy patterns, statuses and fallbacks is in [references/modern-web-platform.md](references/modern-web-platform.md).
- A native modal already traps focus, makes the page inert, closes on `Esc` and returns focus. Adding `role="dialog"`, `aria-modal`, a focus-trap library or an `Esc` handler to `<dialog>` duplicates or breaks that.

## Tailwind CSS v4

- Configuration lives in CSS: `@theme` tokens generate utilities, `@utility` defines custom utilities that take variants, `@custom-variant` redefines variants such as `dark`, `@source` adds scan paths, and `@reference` gives CSS modules and component style blocks the theme without duplicating CSS.
- Use `@theme inline` when a token points at another variable (`--color-background: var(--background)`). Tailwind emits only the theme variables something uses, so use `@theme static` when JS or inline styles read variables no class references.
- The spacing scale is open-ended (`w-150`, `mt-17`, `grid-cols-15`), so most v3 arbitrary values have a plain utility. Keep brackets for real one-offs such as `max-h-[calc(100dvh-3rem)]`.
- 4.2 added `inset-s-*` and `inset-e-*` (deprecating `start-*` and `end-*`), logical `pbs-*`, `mbs-*`, `inline-*` and `block-*` utilities, the `mauve`, `olive`, `mist` and `taupe` palettes, `font-features-*` and `@tailwindcss/webpack`. 4.3 added `scrollbar-thin`, `scrollbar-none`, `scrollbar-thumb-*`, `scrollbar-track-*`, `scrollbar-gutter-*`, `@container-size`, `zoom-*`, `tab-*`, stacked and compound `@variant` blocks and `--default()` in functional utilities. 4.3.4 added the `@tailwindcss/turbopack` loader.

## shadcn/ui

- Since July 2026 `init` defaults to Base UI. Pass `-b radix` in scripts and CI that expect Radix, and `-b aria` for React Aria. Existing projects keep their base.
- Base UI composes through `render={<MyButton />}`, Radix through `asChild`. Check the base before writing either. The Base UI package is `@base-ui/react`.
- Components import `cn` from the `cn` package (September 2026) and `lib/utils.ts` re-exports it. `npx shadcn@latest migrate cn` converts older projects and removes `clsx` and `tailwind-merge` when nothing uses them.
- `init` adds `@import "shadcn/tailwind.css"` (custom variants such as `data-open:` plus accordion animations) and `tw-animate-css`, which replaced `tailwindcss-animate`. Radix components import from the unified `radix-ui` package (`npx shadcn@latest migrate radix`).
- Toasts follow the base: the `toast` component for Base UI, `sonner` for Radix.
- Use semantic tokens (`bg-primary`, `text-muted-foreground`) and component variants, not raw palette colors or manual `dark:` overrides. Dialog, Sheet and Drawer need a Title, hidden with `sr-only` when it should not show.

## Accessibility

- Target WCAG 2.2 AA. The criteria models miss most are 2.5.8 Target Size (24 by 24 CSS px or enough spacing), 2.4.11 Focus Not Obscured (set `scroll-padding-top` for sticky headers), 3.3.8 Accessible Authentication (allow paste and password managers) and 2.5.7 Dragging Movements (a single-pointer alternative).
- Contrast: 4.5:1 for body text, 3:1 for large text (24 CSS px, or about 18.7 CSS px bold), icons, focus indicators and control boundaries.
- Keep a visible `:focus-visible` indicator, never convey state by color alone, and keep the visible label text inside the accessible name. Details on keyboard, forced colors, live regions and text spacing are in [references/accessibility.md](references/accessibility.md).

## Core Web Vitals and images

- Pass at p75: LCP 2.5 s, INP 200 ms, CLS 0.1. Use `web-vitals/attribution` to find which LCP or INP subpart dominates. See [references/web-vitals.md](references/web-vitals.md).
- The LCP image sits in the initial HTML as an `<img>` with `fetchpriority="high"` on that one image, explicit `width` and `height`, and no `loading="lazy"`. Preload it only when it comes from CSS or JS, with `fetchpriority="high"` and, for responsive sources, `imagesrcset` and `imagesizes`. For `next/image` see concise:react-next.
- A `srcset` with `w` descriptors needs `sizes`, or the browser assumes `100vw` and downloads the largest candidate. Serve AVIF in `<picture>` with a WebP or JPEG fallback.
- Break long tasks with `scheduler.yield()` where it exists (Chromium 129, Firefox 142, not Safari) and fall back to a `setTimeout` promise.

## Visual design

- Before designing or restyling a page, read [references/visual-design.md](references/visual-design.md). It names the default looks to leave out, such as a cream background, italic accent words in headlines, 01/02/03 section labels, monospace labels and pill-shaped buttons, with what to do instead.

## Gotchas

- `outline-none` in Tailwind v4 removes the outline, even in forced-colors mode. Use `outline-hidden` and add a `focus-visible:` ring with 3:1 contrast.
- Tailwind v4 `hover:` applies only on devices that hover. Keep required actions reachable without hover.
- Tailwind cannot see class names built by concatenation (`bg-${tone}-500`). Map props to complete class strings. Biome 2.6 flags them with the nursery rule `useTailwindStaticClassStrings`.
- Tailwind skips `.gitignore`d paths and `node_modules`. A component library built with Tailwind needs `@source "../node_modules/<lib>"`. In a monorepo built from the root, set the base with `@import "tailwindcss" source("../src")`.
- Third-party registry components can hardcode `@/components/ui` imports and `lucide-react`. Rewrite them to the project's `aliases` and `iconLibrary` after adding them.
- Preview upstream shadcn changes with `npx shadcn@latest add <name> --dry-run` and `--diff <file>`. `--overwrite` replaces local edits, so use it only with the user's approval. `npx shadcn@latest eject` inlines `shadcn/tailwind.css` and cannot be undone.
- The Base UI `Button` always sets `role="button"`, so `<Button render={<a />}>` hides a link's role. Style links with `buttonVariants` on a plain `<a>`.
- Dark themes need `<meta name="color-scheme" content="light dark">` and `color-scheme` on `:root` (Tailwind `scheme-dark`), not on `body`, so scrollbars and form controls follow. A native `<select>` on Windows also needs explicit `background-color` and `color`.
- `transition-behavior: allow-discrete` inside the `transition` shorthand makes older browsers drop the whole declaration. Write it as a separate declaration after the shorthand.
- Never apply `animation-duration: 0.01ms` globally for reduced motion. Opt in to motion inside `@media (prefers-reduced-motion: no-preference)`, and keep the element's final state.
- Enter-to-submit handlers need `if (e.isComposing || e.keyCode === 229) return;`, or Japanese, Chinese and Korean IME users send half-typed text.
- `loading="lazy"` on `<video>` and `<audio>` works only in Chromium (150). Pair it with `preload="none"` and a `poster`, give the video `width` and `height`, and the audio `controls`.
- `content-visibility: auto` needs `contain-intrinsic-size: auto <size>` with a realistic size, or the scrollbar jumps. Leave it off above-the-fold content and small pages.

## References

- [references/modern-web-platform.md](references/modern-web-platform.md): read before writing JavaScript for UI behavior, when building dialogs, popovers, tooltips, menus, accordions, forms or animations, when a feature's browser support or fallback is in question, and when modernizing legacy front-end code.
- [references/tailwind-v4.md](references/tailwind-v4.md): read when writing Tailwind classes or CSS config, reviewing class names, or migrating from v3.
- [references/accessibility.md](references/accessibility.md): read when fixing or reviewing focus, keyboard, contrast, forced colors, labels, live regions or zoom issues, or running an accessibility audit.
- [references/web-vitals.md](references/web-vitals.md): read when LCP, INP or CLS fail, when setting up field measurement, or when a Lighthouse or PageSpeed score is low.
- [references/visual-design.md](references/visual-design.md): read when designing a new page or component, restyling an existing one, or writing UI copy.

Related skills: concise:react-next for Next.js, `next/image` and React components, concise:typescript-javascript for JavaScript, jQuery and Temporal, concise:testing for Playwright checks in a real browser, concise:web-security for XSS and CSP review.
