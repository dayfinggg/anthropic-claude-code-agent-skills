## v3 habits and their v4 form

| v3 | v4 |
|---|---|
| `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| `theme.extend` in `tailwind.config.js` | `@theme { --color-brand: oklch(0.6 0.2 250) }` |
| `content` globs, `safelist` | automatic detection, `@source "<path>"`, `@source not "<path>"`, `@source inline("underline")` |
| `@layer utilities { .tab-4 {} }` | `@utility tab-4 {}` |
| `darkMode: 'class'` | `@custom-variant dark (&:where(.dark, .dark *))` |
| `theme(colors.red.500)` | `var(--color-red-500)`, or `theme(--breakpoint-xl)` inside media queries |
| `resolveConfig()` in JS | `getComputedStyle(document.documentElement).getPropertyValue('--shadow-xl')` |
| `shadow-sm`, `shadow` | `shadow-xs`, `shadow-sm` (same shift for `drop-shadow`, `blur`, `backdrop-blur`, `rounded`) |
| `outline-none` | `outline-hidden` |
| `ring` (3px blue) | `ring-3 ring-blue-500` (bare `ring` is now 1px `currentColor`) |
| `bg-opacity-50`, `text-opacity-*` | `bg-black/50`, `text-white/50` |
| `flex-grow`, `flex-shrink`, `overflow-ellipsis` | `grow`, `shrink`, `text-ellipsis` |
| `bg-gradient-to-r` | `bg-linear-to-r` (also `bg-radial-*`, `bg-conic-*`) |
| `!font-bold` | `font-bold!` |
| `bg-[--brand]` | `bg-(--brand)`, with a type hint when ambiguous: `text-(length:--size)` |
| `grid-cols-[1fr,auto]` | `grid-cols-[1fr_auto]` |
| `first:*:pt-0` | `*:first:pt-0` (stacked variants now apply left to right) |
| `data-[current]:` | `data-current:` (values keep brackets: `data-[state=open]:`) |
| `focus:transform-none` | `scale-none`, `rotate-none`, `translate-none` |
| `transition-[opacity,transform]` | `transition-[opacity,scale]` (transforms use the individual properties) |
| `start-0`, `end-0` | `inset-s-0`, `inset-e-0` (4.2) |
| `container` with `center` and `padding` options | `@utility container { margin-inline: auto }` |
| `prefix: 'tw-'` | `@import "tailwindcss" prefix(tw)` with classes like `tw:flex` |
| `tailwindcss` as a PostCSS plugin | `@tailwindcss/postcss` without `postcss-import` and `autoprefixer`, or `@tailwindcss/vite`, `@tailwindcss/webpack`, `@tailwindcss/cli` |

## Behavior changes without a rename

- `border-*`, `divide-*`, `ring` and `outline` default to `currentColor`. Set a color wherever the color matters.
- `space-x-*` and `space-y-*` now target `:not(:last-child)`. Inline children and extra margins render differently, so prefer `flex` or `grid` with `gap-*`.
- Preflight sets placeholders to the text color at 50% opacity, gives buttons `cursor: default`, removes the `<dialog>` margin, and lets the `hidden` attribute win over display classes.
- A variant that overrides one gradient stop keeps the others. Add `via-none` to drop a middle stop in that state.
- `transition` and `transition-colors` include `outline-color`, so set the outline color unconditionally to avoid a color animation on focus.
- Sass, Less and Stylus do not work with Tailwind v4 stylesheets or style blocks.
- Container queries are built in: `@container` on the parent, `@sm:` or `@max-md:` on children, and `@container-size` (4.3) when children need block-size units.
- Useful v4 variants: `starting:` with `transition-discrete` for enter transitions, `not-*`, `in-*`, `nth-*`, `*:` for children, `**:` for descendants, `inert:`, `user-valid:`, `user-invalid:`, `pointer-coarse:`, `pointer-fine:`, `noscript:`.
- Useful v4 utilities: `field-sizing-content` for auto-growing textareas, `wrap-break-word` and `wrap-anywhere` for long words in flex children, `items-center-safe` and `justify-center-safe`, `text-shadow-*`, `mask-*`, `scheme-dark`.
- Reusable animations are `--animate-*` tokens with their `@keyframes` inside `@theme`. Gate decorative motion with `motion-safe:` and `motion-reduce:`.
- `npx @tailwindcss/upgrade` (Node 20 or later) migrates dependencies, config and templates. Review its diff and check the result in a browser.
