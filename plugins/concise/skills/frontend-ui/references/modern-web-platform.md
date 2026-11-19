# Native HTML and CSS features and the Baseline target

Distilled from Chrome's Modern Web Guidance 1.0 (published 2026-11-10). Baseline statuses come from the web-features data (version 3.46, November 2026). "Widely" means Baseline Widely available, "Newly 2025-01" means Newly available since that month, and "Limited" means not Baseline yet.

## Contents

- Enhancement, polyfills and detection
- Legacy patterns and their replacements
- HTML and native overlays
- CSS
- Motion
- Forms
- Performance
- Getting the full guide

## Enhancement, polyfills and detection

- Use a feature inside the Baseline target directly. Add a feature outside it as progressive enhancement when the page still works without it (`closedby`, `field-sizing`, `text-wrap`, view transitions, Speculation Rules). When the feature carries core behavior (`popover`, invoker commands, `:has()` for critical state), load a polyfill with a dynamic `import()` only after feature detection fails.
- Detect each feature on the object that carries it, as in `'commandForElement' in HTMLButtonElement.prototype`, `Object.hasOwn(HTMLElement.prototype, 'popover')`, `'closedBy' in HTMLDialogElement.prototype`, `'interestForElement' in HTMLButtonElement.prototype`, `Object.hasOwn(HTMLMediaElement.prototype, 'loading')`, `@supports (anchor-name: --x)` and `@supports not selector(:has(*))`.
- A selector list with one unknown pseudo-class drops the whole rule. Combine the native pseudo-class and the polyfill's class in one forgiving `:is()` or `:where()`, as in `[popover]:is(:popover-open, .\:popover-open)`. This does not work for pseudo-elements.

## Legacy patterns and their replacements

| Legacy pattern | Modern replacement | Baseline |
|---|---|---|
| Textarea auto-resize from `scrollHeight` on every `input` | `field-sizing: content` with `min-block-size: 3lh` and `max-block-size` | Newly 2026-06 |
| `:invalid` styles that mark untouched fields on load | `:user-invalid` and `:user-valid` | Widely |
| Auth, address and checkout fields without `autocomplete` | Standard `autocomplete` tokens | |
| Backdrop click detected with `e.target === dialog` | `<dialog closedby="any">` | Limited (no Safari) |
| Click listeners that only call `showPopover()` or `showModal()` | `popovertarget`, or `command` with `commandfor` | Popover Newly 2025-01, invoker commands Newly 2025-12 |
| `max-height: 9999px` accordion animation | `interpolate-size: allow-keywords` or `calc-size()` | Limited (Chromium only) |
| JS toggling a parent class from child state | `:has(:checked)`, `:has(:focus-visible)` | Widely |
| Duplicated `@media (prefers-color-scheme: dark)` blocks | `light-dark()` with `color-scheme: light dark` | Newly 2024-05 |
| CDN `<script>` without integrity | `integrity` plus `crossorigin="anonymous"` | |
| `overflow: hidden` on `body` to stop scrolling behind a modal | `overscroll-behavior: contain` on `dialog:modal` and `::backdrop` | |
| Tooltip positioned from `getBoundingClientRect()` | `popover="hint"`, `interestfor` and anchor positioning | Limited |
| Scroll listeners that add reveal classes | `animation-timeline: view()` | Newly 2026-10 |
| `setTimeout(..., 0)` to chunk long work | `scheduler.yield()` with a `setTimeout` fallback | Limited (no Safari) |
| BEM names to manage specificity | `@layer` order plus `:where()` | Widely |
| `100vw` and `100vh` for full-size layout | `100%`, `dvw`, `dvh` | Widely |
| JS class juggling to animate from `display: none` | `@starting-style` and `transition-behavior: allow-discrete` | Newly 2024-08 |
| `title` attribute as a tooltip | Keyboard-reachable tooltip or toggletip | |
| `font-size` in `vw` alone | `clamp(2rem, 1rem + 5vw, 4rem)` with the maximum at most 2.5 times the minimum | Widely |

## HTML and native overlays

- Choose the overlay by behavior. An interruption that blocks the page (confirmation, sign-in, destructive action) is a `<dialog>` opened with `showModal()` or `command="show-modal"`. A panel the user keeps working beside (find bar, inspector) is `<dialog popover="manual">` or `popover="auto"`. A menu, dropdown, tooltip or toast is a semantic element with the `popover` attribute, not a `<dialog>`.
- A native modal also renders in the top layer and closes on the back gesture, so `inert` toggling and focus-return code are redundant too. Open it with `showModal()` or `command="show-modal"`, because `show()` and the `open` attribute give a non-modal dialog.
- Name every dialog with `aria-labelledby` pointing at its heading, put `autofocus` on the first field or on the safe action (Cancel) of a destructive confirmation, and give every dialog a visible close button for voice-control users.
- Stop the page scrolling behind a modal with `dialog:modal { overscroll-behavior: contain }` and `dialog::backdrop { overflow: hidden; overscroll-behavior: contain }`. `overflow: hidden` or `position: fixed` on `html` or `body` removes the scrollbar and shifts the layout.
- `closedby="any"` adds click-outside, `closerequest` is the modal default, and `none` leaves closing to the code. Without support the modal still closes on `Esc`, so keep an unsaved-changes guard in a `cancel` handler too, and use `requestClose()` or `command="request-close"` for Cancel buttons that must run that guard.
- Read `dialog.returnValue` in the `close` listener, then reset it to `''`, because `Esc` sets no value and browsers differ on clearing the old one.
- Set `display` on a dialog only under `dialog[open]`, because an unconditional `display` overrides the closed state.
- Invoker commands are `command="show-modal"`, `"close"`, `"request-close"`, `"toggle-popover"`, `"show-popover"` or `"hide-popover"` with `commandfor="id"` on a `<button>`. Give a button either `popovertarget` or `commandfor` for one popover, because both together toggle it twice. The `command` event does not bubble, and `invokers-polyfill` does not set `aria-expanded`, so set it yourself where the polyfill runs.
- With `@oddbird/popover-polyfill`, set `popover` with `setAttribute()` in code that may run before the polyfill loads, and style with `:is(:popover-open, .\:popover-open)`.
- Hiding a popover from a button inside it drops focus. Return focus to the trigger.
- For a tooltip, `popover="hint"` with `interestfor` on the trigger opens on hover, focus and long-press (Limited, Chromium only, with `hint` also in Firefox 153). Load the `interestfor` polyfill only where `interestForElement` is missing. The tooltip stays open while hovered, closes on `Esc`, and stays until interest ends (WCAG 1.4.13), and focus stays on the trigger when it opens. A toggletip (an "i" button) uses both `interestfor` and `popovertarget` with `popovertargetaction="show"`.
- `<details>` with the same `name` forms an exclusive accordion (Newly 2024-09). Keep `<summary>` first, put no links or buttons inside it, and style the body with `::details-content` (Newly 2025-09). Where the heading matters for navigation, use `<h2><button aria-expanded>` instead of a heading inside `<summary>`.
- `inert` (Widely) removes off-screen drawers and hidden wizard steps from tab order and the accessibility tree. `<search>` (Widely) wraps search and filter forms without `role="search"`.

## CSS

- Declare layer order once (`@layer reset, base, theme, components, utilities;`) and use `:where()` for defaults that should lose easily. Cascade layers are Widely available. Keep global resets off `*`, because lower layers and web components cannot override them without `!important`.
- Nesting is Widely available. `@scope (.card) to (.content)` (Newly 2026-03) handles proximity, such as nested cards or nested light and dark themes, where nesting and `:not()` fail.
- `:has()` is Widely available, cannot be nested and takes no pseudo-elements. Where the state it styles is critical, add an `@supports not selector(:has(*))` class-based fallback.
- Container size queries are Widely available, with `container: card / inline-size` on the wrapper and then `@container card (inline-size > 400px)`. `container-type: size` needs a definite `block-size`. Container style queries are Newly 2026-05. Size type with `cqi` inside `clamp()`.
- Subgrid is Widely available. Put an explicit `grid-template-rows` before `grid-template-rows: subgrid` as the fallback, and subgrid one axis only when the child count varies.
- Anchor positioning is Limited (no Firefox). Use `position-area` and `position-try-fallbacks: flip-block`, and keep an absolutely positioned fallback behind `@supports (anchor-name: --x)`.
- For dark mode, define tokens with `light-dark()` (Newly 2024-05), and for older browsers switch the custom properties on `:root` inside `@media (prefers-color-scheme: dark)`. JS that reads `matchMedia('(prefers-color-scheme: dark)')` also handles its `change` event.
- `oklch()`, `oklab()` and `color-mix()` are Widely available, relative color syntax is Newly 2024-09 and `contrast-color()` Newly 2026-04. Make tints by mixing with white or black in `oklab` with `color-mix()`, combined with a lightness change of at most 30%, rather than by changing only the lightness channel, because browsers do no gamut mapping yet.
- `text-wrap: balance` (Newly 2024-05) suits headings and `text-wrap: pretty` (Limited, no Firefox) body text. Apply them to chosen elements rather than `*`, and keep balance off boxes with a visible background, which keep their full width.
- `field-sizing: content` (Newly 2026-06) sizes inputs, textareas and selects to their content. Without support the field keeps a fixed size, which is the recommended fallback.
- Animating to `auto` takes `interpolate-size: allow-keywords` on `:root` or `calc-size(auto, size + 2rem)`, both Limited (Chromium only), and other browsers jump instantly. Put a keyword declaration before any `calc-size()`, which older browsers drop entirely. One end of the transition must be a length, not two keywords.
- `scrollbar-gutter: stable` (Newly 2024-12) reserves the scrollbar space. `scrollbar-color` (Newly 2025-12) needs `scrollbar-width` beside it for macOS overlay scrollbars.
- Use `overflow: clip` to clip without creating a scroll container, and `overflow: auto` rather than `scroll`. Multi-line truncation is `display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical` plus unprefixed `line-clamp`.
- Flex items with long URLs or code need `min-inline-size: 0`, and `align-items: safe center` keeps focusable content from being clipped when space runs out. Focus follows the DOM, so keep `order`, `*-reverse` and `grid-auto-flow: dense` off interactive items.
- Masonry ("grid lanes") is Limited (Safari 27.2 only). Use `columns` or `grid-auto-flow: dense` for non-interactive content.

## Motion

- Animate `opacity` and `transform`, including the individual `translate`, `rotate` and `scale` properties (Widely), rather than `top` or `left`.
- For entry and exit of top-layer elements, use `@starting-style` (Newly 2024-08) for the entry, `transition-behavior: allow-discrete` (Newly 2024-08) as its own declaration, and `overlay` in the transition list (Limited, Chromium only). Firefox accepts `allow-discrete` but does not transition `display`, so exits there are instant.
- Same-document view transitions (`document.startViewTransition()`) are Newly 2025-10. Cross-document transitions with `@view-transition { navigation: auto; }` on both pages are Limited (no Firefox) and a pure enhancement. Only one element may carry a given `view-transition-name` at a time, so remove temporary names when `finished` resolves, and move focus yourself, because view transitions do not.
- Scroll-driven animations (`animation-timeline: scroll()` or `view()`, Newly 2026-10) replace scroll listeners. For reveal effects use `animation-range: entry, exit` with `backwards` fill on the entry animation and `forwards` on the exit.
- When the reduced-motion version has no animation, declare the animation only inside `@media (prefers-reduced-motion: no-preference)`. When it only changes parameters, override them inside `@media (prefers-reduced-motion: reduce)`, and keep color transitions in both.
- Code that waits for `animationend` or `transitionend` hangs when the animation never runs. Continue at once when `element.getAnimations()` is empty.

## Forms

- Give every personal-data field an `autocomplete` token, such as `username`, `current-password` on sign-in and `new-password` on sign-up and change, `email`, `tel`, `name`, `street-address` or `address-line1`, `postal-code`, `cc-number`, `cc-exp`, `cc-csc` and `one-time-code`. Browsers and password managers ignore `autocomplete="off"` on these fields, and it blocks users. Match `type`, `inputmode` and `autocomplete`, as in `type="email" inputmode="email" autocomplete="email"`.
- Use one field per value, such as a single `<input type="text" inputmode="numeric" autocomplete="one-time-code">` for an OTP rather than several auto-advancing boxes. Card numbers, postal codes and codes also take `type="text"` with `inputmode="numeric"`, because `type="number"` loses leading zeros. Allow paste everywhere, passwords included.
- Clear the error on `input`, validate on `blur` once the field was edited, and on `submit` block and move focus to the first invalid field or an error summary. Style with `:user-invalid` (Widely). Keep `aria-invalid` in sync with it, set to `"false"` until it matches, add the error message to `aria-describedby` only while the field is invalid, and announce errors through one polite live region for the page.
- Show error text, not color alone, and start it with an icon that has a text alternative or with wording that names it as an error.
- Leave the submit button enabled during validation, and disable it only after a valid submission, to prevent a double post.
- For Enter-to-submit in a textarea or an input with its own Enter handling, call `preventDefault()`, then `if (e.isComposing || e.keyCode === 229) return;`, and keep a real `<button type="submit">`.
- Set `font: inherit` and `font-size: max(1rem, 1em)` on controls so iOS does not zoom into them, and keep visible labels rather than placeholders for format rules.

## Performance

- Work under 50 ms runs as is, 50 to 250 ms yields with `scheduler.yield()` (Limited, no Safari) and a `setTimeout` promise as the fallback, and longer work moves to a Web Worker. Batch DOM reads, then DOM writes.
- `type="module"` scripts are deferred by default. Use `fetchpriority="high"` on at most one or two critical async scripts and `fetchpriority="low"` on analytics and widgets. `fetchpriority` is Newly 2024-10 and ignored where unsupported.
- Offscreen carousel slides get `fetchpriority="low"` and `loading="lazy"`. Fonts load at high priority already, so preload only above-the-fold WOFF2 files, with `crossorigin`.
- Speculation Rules (`<script type="speculationrules">`, Limited, Chromium only) prefetch or prerender the next page of a multi-page site. Prefer document rules with `moderate` or `conservative` eagerness, start with prefetch, exclude URLs with side effects such as `/logout` or `/add-to-cart`, and skip them for single-page app navigations.
- `content-visibility: auto` (Newly 2025-09) skips rendering of long offscreen sections, and `contain: layout style paint` isolates a self-contained widget.

## Getting the full guide

- The catalog of about 200 guides, one line each, is at `https://developer.chrome.com/docs/modern-web-guidance/guides.md.txt`. Each guide is a Markdown document at `https://developer.chrome.com/docs/modern-web-guidance/guides/<category>/<id>.md.txt`, for example `ui-components/dialog` or `forms/validate-input-after-interaction`. Read the one for the use case and take its facts and code patterns.
- The complete set is also an official Claude Code plugin the user can install with `claude plugin marketplace add GoogleChrome/modern-web-guidance` and then `claude plugin install modern-web-guidance@googlechrome`.
- Its `legacy-scan` command (`npx modern-web-guidance legacy-scan <path> --json`) parses HTML, CSS, JavaScript, TypeScript, framework components and `package.json` locally and lists legacy patterns. It covers the roughly 20% of guides that can be detected reliably and has no `--fix`. Check each finding against the surrounding code, because intentional fallbacks and `@supports` guards are valid.
