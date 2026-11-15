# Native HTML and CSS features and the Baseline target

Distilled from Chrome's Modern Web Guidance 1.0 (published 2026-11-10). Baseline statuses come from the web-features data (version 3.46, November 2026): "Widely" means Baseline Widely available, "Newly 2025-01" means Newly available since that month, "Limited" means not Baseline yet.

## Contents

- The rule
- Legacy patterns and their replacements
- HTML and native overlays
- CSS
- Motion
- Forms
- Performance
- Getting the full guide

## The rule

- Use the native HTML or CSS feature before JavaScript or a library: `<dialog>` before a modal library, `popover` before a dropdown script, `field-sizing` before an autosize script, `:has()` before toggling parent classes in JS.
- Check each feature against the project's Baseline target. A project states it in `CLAUDE.md` or `AGENTS.md` as a line such as `This project's Baseline target is Baseline 2024.` When nothing states a target, assume Baseline Widely available.
- A feature inside the target is used directly. A feature outside it is added as progressive enhancement when the page still works without it (`closedby`, `field-sizing`, `text-wrap`, view transitions, Speculation Rules). When the feature carries core behavior (`popover`, invoker commands, `:has()` for critical state), load a polyfill only after feature detection fails, with a dynamic `import()`, never unconditionally.
- Detect on the right object: `'commandForElement' in HTMLButtonElement.prototype`, `Object.hasOwn(HTMLElement.prototype, 'popover')`, `'closedBy' in HTMLDialogElement.prototype`, `'interestForElement' in HTMLButtonElement.prototype`, `Object.hasOwn(HTMLMediaElement.prototype, 'loading')`, `@supports (anchor-name: --x)`, `@supports not selector(:has(*))`.
- A selector list with one unknown pseudo-class drops the whole rule. Combine the native pseudo-class and the polyfill's class in one forgiving `:is()` or `:where()`, as in `[popover]:is(:popover-open, .\:popover-open)`. This does not work for pseudo-elements.

## Legacy patterns and their replacements

| Legacy pattern | Modern replacement | Baseline |
|---|---|---|
| Textarea auto-resize from `scrollHeight` on every `input` | `field-sizing: content` with `min-block-size: 3lh` and `max-block-size` | Newly 2026-06 |
| Enter `keydown` submit with no IME guard | `if (e.isComposing \|\| e.keyCode === 229) return;` | `isComposing` alone fails in Safari |
| `:invalid` styles that mark untouched fields on load | `:user-invalid` and `:user-valid` | Widely |
| Auth, address and checkout fields without `autocomplete` | Standard `autocomplete` tokens | |
| Backdrop click detected with `e.target === dialog` | `<dialog closedby="any">` | Limited (no Safari) |
| Click listeners that only call `showPopover()` or `showModal()` | `popovertarget`, or `command` with `commandfor` | Popover Newly 2025-01, invoker commands Newly 2025-12 |
| `max-height: 9999px` accordion animation | `interpolate-size: allow-keywords` or `calc-size()` | Limited (Chromium only) |
| JS toggling a parent class from child state | `:has(:checked)`, `:has(:focus-visible)` | Widely |
| Duplicated `@media (prefers-color-scheme: dark)` blocks | `light-dark()` with `color-scheme: light dark` | Newly 2024-05 |
| CDN `<script>` without integrity | `integrity` plus `crossorigin="anonymous"` | |
| Custom modal with `role="dialog"`, focus trap and `Esc` handler | `<dialog>` opened with `showModal()` | Widely |
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
- A native modal already makes the page inert, contains focus, renders in the top layer, closes on `Esc` and the back gesture, and returns focus to the invoker. Do not add `role="dialog"`, `aria-modal`, a focus trap, `inert` toggling, an `Esc` handler or focus-return code, and do not open it with `show()` or the `open` attribute.
- Name every dialog with `aria-labelledby` pointing at its heading, put `autofocus` on the first field or on the safe action (Cancel) of a destructive confirmation, and give every dialog a visible close button for voice-control users.
- Stop the page scrolling behind a modal with `dialog:modal { overscroll-behavior: contain }` and `dialog::backdrop { overflow: hidden; overscroll-behavior: contain }`, not with `overflow: hidden` or `position: fixed` on `html` or `body`, which removes the scrollbar and shifts the layout.
- `closedby`: `any` adds click-outside, `closerequest` is the modal default, `none` leaves closing to the code. Without support the modal still closes on `Esc`, so keep an unsaved-changes guard in a `cancel` handler too. Use `requestClose()` or `command="request-close"` for Cancel buttons that must run that guard.
- Read `dialog.returnValue` in the `close` listener, then reset it to `''`, because `Esc` sets no value and browsers differ on clearing the old one.
- Never set `display` on `dialog` unconditionally, which overrides the closed state. Scope it with `dialog[open]`.
- Invoker commands: `command="show-modal"`, `"close"`, `"request-close"`, `"toggle-popover"`, `"show-popover"` or `"hide-popover"` with `commandfor="id"` on a `<button>`. Never put `popovertarget` and `commandfor` for the same popover on one button, which toggles it twice. The `command` event does not bubble. `invokers-polyfill` does not set `aria-expanded`, so set it yourself where the polyfill runs.
- `@oddbird/popover-polyfill`: set `popover` with `setAttribute()` in code that may run before the polyfill loads, and style with `:is(:popover-open, .\:popover-open)`.
- Hiding a popover from a button inside it drops focus. Return focus to the trigger.
- Tooltips: `popover="hint"` with `interestfor` on the trigger opens on hover, focus and long-press (Limited: Chromium, `hint` also Firefox 153). Load the `interestfor` polyfill only where `interestForElement` is missing. The tooltip must stay open while hovered, close on `Esc`, and stay until interest ends (WCAG 1.4.13). Never move focus into it on interest. A toggletip (an "i" button) uses both `interestfor` and `popovertarget` with `popovertargetaction="show"`.
- `<details>` with the same `name` forms an exclusive accordion (Newly 2024-09). Keep `<summary>` first, put no links or buttons inside it, and style the body with `::details-content` (Newly 2025-09). Where the heading matters for navigation, use `<h2><button aria-expanded>` instead of a heading inside `<summary>`.
- `inert` (Widely) removes off-screen drawers and hidden wizard steps from tab order and the accessibility tree. `<search>` (Widely) wraps search and filter forms without `role="search"`.

## CSS

- Declare layer order once (`@layer reset, base, theme, components, utilities;`) and use `:where()` for defaults that should lose easily. Cascade layers are Widely available. No global resets on `*`, which lower layers and web components cannot override without `!important`.
- Nesting is Widely available. `@scope (.card) to (.content)` (Newly 2026-03) handles proximity, such as nested cards or nested light and dark themes, where nesting and `:not()` fail.
- `:has()` is Widely available. Do not nest `:has()` or put pseudo-elements inside it. Where the state it styles is critical, add an `@supports not selector(:has(*))` class-based fallback.
- Container size queries are Widely available: `container: card / inline-size` on the wrapper, then `@container card (inline-size > 400px)`. `container-type: size` needs a definite `block-size`. Container style queries are Newly 2026-05. Size type with `cqi` inside `clamp()`.
- Subgrid is Widely available. Put an explicit `grid-template-rows` before `grid-template-rows: subgrid` as the fallback, and subgrid one axis only when the child count varies.
- Anchor positioning is Limited (no Firefox). Use `position-area` and `position-try-fallbacks: flip-block`, and keep an absolutely positioned fallback behind `@supports (anchor-name: --x)`.
- Dark mode: `<meta name="color-scheme" content="light dark">` in `<head>`, `color-scheme: light dark` on `:root` (not `body`, which does not theme the viewport and root scrollbar), and tokens defined with `light-dark()` (Newly 2024-05). For older browsers, switch the custom properties on `:root` inside `@media (prefers-color-scheme: dark)`. JS that reads `matchMedia('(prefers-color-scheme: dark)')` must also handle its `change` event.
- Color: `oklch()` and `oklab()` and `color-mix()` are Widely available, relative color syntax is Newly 2024-09 and `contrast-color()` Newly 2026-04. Do not make tints by changing only the lightness channel, since browsers do no gamut mapping yet. Mix with white or black in `oklab` with `color-mix()`, and combine with a lightness change of at most 30%.
- `text-wrap: balance` (Newly 2024-05) on headings and `text-wrap: pretty` (Limited, no Firefox) on body text, never on `*`, and not balance on boxes with a visible background, which keep their full width.
- `field-sizing: content` (Newly 2026-06) sizes inputs, textareas and selects to their content. Without support the field keeps a fixed size, which is the recommended fallback.
- Animating to `auto`: `interpolate-size: allow-keywords` on `:root`, or `calc-size(auto, size + 2rem)`, Limited (Chromium only). Other browsers jump instantly. Put a keyword declaration before any `calc-size()`, which older browsers drop entirely. One end of the transition must be a length, not two keywords.
- `scrollbar-gutter: stable` (Newly 2024-12) reserves the scrollbar space. `scrollbar-color` (Newly 2025-12) needs `scrollbar-width` beside it for macOS overlay scrollbars.
- Use `overflow: clip` to clip without creating a scroll container, and `overflow: auto` rather than `scroll`. Multi-line truncation is `display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical` plus unprefixed `line-clamp`.
- Flex items with long URLs or code need `min-inline-size: 0`. `align-items: safe center` keeps focusable content from being clipped when space runs out. Never reorder interactive items with `order`, `*-reverse` or `grid-auto-flow: dense`, because focus follows the DOM.
- Masonry ("grid lanes") is Limited (Safari 27.2 only). Use `columns` or `grid-auto-flow: dense` for non-interactive content.

## Motion

- Animate `opacity` and `transform`, including the individual `translate`, `rotate` and `scale` properties (Widely), not `top` or `left`.
- Entry and exit of top-layer elements: `@starting-style` (Newly 2024-08) for the entry, `transition-behavior: allow-discrete` (Newly 2024-08) as its own declaration after the `transition` shorthand (inside the shorthand, older browsers drop the whole `transition`), and `overlay` in the transition list (Limited, Chromium only). Firefox accepts `allow-discrete` but does not transition `display`, so exits there are instant.
- Same-document view transitions (`document.startViewTransition()`) are Newly 2025-10. Cross-document transitions with `@view-transition { navigation: auto; }` on both pages are Limited (no Firefox) and a pure enhancement. Only one element may carry a given `view-transition-name` at a time, remove temporary names when `finished` resolves, and move focus yourself, because view transitions do not.
- Scroll-driven animations (`animation-timeline: scroll()` or `view()`, Newly 2026-10) replace scroll listeners. For reveal effects use `animation-range: entry, exit` with `backwards` fill on the entry animation and `forwards` on the exit.
- Reduced motion: when the reduced version has no animation, declare it only inside `@media (prefers-reduced-motion: no-preference)`. When it only changes parameters, override them inside `@media (prefers-reduced-motion: reduce)`. Never set `animation-duration: 0.01ms` globally, keep color transitions, and make sure the element still ends in its final state.
- Code that waits for `animationend` or `transitionend` hangs when the animation never runs. Continue at once when `element.getAnimations()` is empty.
- Anything that moves on its own for more than five seconds needs a visible pause button (WCAG 2.2.2), whatever the motion setting. Nothing may flash more than three times a second (WCAG 2.3.1).

## Forms

- Give every personal-data field an `autocomplete` token: `username`, `current-password` on sign-in and `new-password` on sign-up and change, `email`, `tel`, `name`, `street-address` or `address-line1`, `postal-code`, `cc-number`, `cc-exp`, `cc-csc`, `one-time-code`. `autocomplete="off"` on these is ignored by browsers and password managers and blocks users. Match `type`, `inputmode` and `autocomplete` (`type="email" inputmode="email" autocomplete="email"`).
- One field per value: a single `<input type="text" inputmode="numeric" autocomplete="one-time-code">` for an OTP, not several auto-advancing boxes. Never `type="number"` for card numbers, postal codes or codes, which loses leading zeros. Allow paste everywhere, passwords included.
- Validation timing: clear the error on `input`, validate on `blur` once the field was edited, and on `submit` block and move focus to the first invalid field or an error summary. Style with `:user-invalid` (Widely). Keep `aria-invalid` in sync with it, set to `"false"` until it matches, and add the error message to `aria-describedby` only while the field is invalid. Announce errors through one polite live region for the page.
- Show error text, not color alone, and start it with an icon that has a text alternative or with wording that names it as an error.
- Do not disable the submit button to block validation. Disable it only after a valid submission, to prevent a double post.
- Enter-to-submit in a textarea or an input with its own Enter handling: call `preventDefault()`, then `if (e.isComposing || e.keyCode === 229) return;`. Safari delivers `compositionend` before the confirming Enter, so `isComposing` alone fails there. Keep a real `<button type="submit">`.
- Set `font: inherit` and `font-size: max(1rem, 1em)` on controls so iOS does not zoom into them, and keep visible labels, not placeholders, for format rules.

## Performance

- Long tasks: work under 50 ms runs as is, 50 to 250 ms yields with `scheduler.yield()` (Limited, no Safari) falling back to a `setTimeout` promise, and longer work moves to a Web Worker. Batch DOM reads, then DOM writes.
- Script priority: `type="module"` is deferred by default. Use `fetchpriority="high"` on at most one or two critical async scripts and `fetchpriority="low"` on analytics and widgets. `fetchpriority` is Newly 2024-10 and ignored where unsupported.
- Images: the LCP image is an `<img>` in the HTML with `fetchpriority="high"`, never `loading="lazy"`. An LCP background from CSS gets `<link rel="preload" as="image" fetchpriority="high">`. Offscreen carousel slides get `fetchpriority="low"` and `loading="lazy"`. Fonts load at high priority already: preload only above-the-fold WOFF2 files, always with `crossorigin`.
- `loading="lazy"` on `<video>` and `<audio>` is Limited (Chromium 150). Pair it with `preload="none"` or `"metadata"` so other browsers still save bandwidth, give `<video>` explicit `width` and `height`, and give `<audio>` `controls`, or the element never intersects the viewport and never loads.
- Speculation Rules (`<script type="speculationrules">`, Limited, Chromium only) prefetch or prerender the next page of a multi-page site. Prefer document rules with `moderate` or `conservative` eagerness, start with prefetch, exclude URLs with side effects such as `/logout` or `/add-to-cart`, and skip them for single-page app navigations.
- `content-visibility: auto` (Newly 2025-09) skips rendering of long offscreen sections. Pair it with `contain-intrinsic-size: auto <size>` in `rem` or `lh` derived from the content, and leave it off small pages and above-the-fold content. `contain: layout style paint` isolates a self-contained widget.

## Getting the full guide

- The catalog of about 200 guides, one line each, is published at `https://developer.chrome.com/docs/modern-web-guidance/guides.md.txt`. Each guide is a Markdown document at `https://developer.chrome.com/docs/modern-web-guidance/guides/<category>/<id>.md.txt`, for example `ui-components/dialog` or `forms/validate-input-after-interaction`. Read the one for the use case as documentation and take its facts and code patterns.
- The complete set is also an official Claude Code plugin the user can install: `claude plugin marketplace add GoogleChrome/modern-web-guidance`, then `claude plugin install modern-web-guidance@googlechrome`.
- Its `legacy-scan` command (`npx modern-web-guidance legacy-scan <path> --json`) parses HTML, CSS, JavaScript, TypeScript, framework components and `package.json` locally and lists legacy patterns. It covers the roughly 20% of guides that can be detected reliably, has no `--fix`, and each finding needs checking against the surrounding code, since intentional fallbacks and `@supports` guards are valid.
