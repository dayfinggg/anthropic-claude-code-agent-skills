# Accessibility details for WCAG 2.2

## Contents

- WCAG 2.2 criteria that models miss
- Contrast and forced colors
- Keyboard and focus
- Names, labels and live regions
- Text, zoom and motion
- Testing

## WCAG 2.2 criteria that models miss

- WCAG 2.2 (current edition dated 2024-12-12) removed 4.1.1 Parsing and added 2.4.11, 2.5.7, 2.5.8 and 3.3.8 at AA and 3.2.6 Consistent Help and 3.3.7 Redundant Entry at A.
- Under 2.5.8 a target is at least 24 by 24 CSS px, or a 24 px circle centered on each undersized target touches no other target or circle. Inline text links and native controls whose size the author left alone are exempt, and page zoom does not count. Set the size with `min-block-size`, `min-inline-size` or padding so content can grow the target, and enlarge targets under `@media (pointer: coarse)`.
- Under 2.4.11 sticky headers, footers and banners must not cover the focused element entirely. Set `scroll-padding-top` on the scroll container to the sticky height.
- Under 3.3.8 no login step may require recalling, transcribing or solving something unless paste and password managers work. Retyping a one-time code counts, so allow paste and set `autocomplete="one-time-code"`. Passkeys and email links satisfy the criterion.
- Under 2.5.7 every drag action needs a single-pointer alternative, such as move buttons or a menu.
- Under 1.4.13 content shown on hover or focus is dismissible without moving the pointer (`Esc`), hoverable, and persistent until interest ends.

## Contrast and forced colors

- Large text means at least 18 pt (24 CSS px) regular or 14 pt (about 18.7 CSS px) bold. Icons, focus indicators, input borders and other component boundaries and states need 3:1 against the adjacent colors.
- `@media (prefers-contrast: more)` strengthens colors that already pass for users who set it, and it does not fix a default that fails.
- In forced colors mode (Windows High Contrast) the browser replaces author colors with system colors, removes `box-shadow`, `text-shadow` and gradient backgrounds, and may drop `background-image` and `border-image`. Draw borders, separators and states with something that survives, and provide `@media (forced-colors: active)` fallbacks with `outline` or `border` in system colors (`CanvasText`, `LinkText`, `ButtonText`, `Highlight`, `GrayText`).
- Use `forced-color-adjust: none` only where color is the information, such as a color swatch or syntax highlighting, and then set both text and background colors.

## Keyboard and focus

- Style focus with `:focus-visible`, and prefer `outline` with `outline-offset` over `box-shadow` rings. A ring drawn with `box-shadow` needs an `outline` under `forced-colors`, and a replacement indicator needs 3:1 against the adjacent colors.
- `clip-path` and `mask-image` also clip the element's own focus outline. Draw the indicator on an unclipped parent when the clipped element is focusable.
- A custom button-like widget activates on Enter at `keydown` and on Space at `keyup`, like a native button. A native `<button>`, `<a href>` or `<input>` needs no key handlers and no `tabindex="0"`. Keep `tabindex` at 0 or -1, because a positive value reorders the tab sequence of the whole page.
- `disabled` removes a control from the tab order. `aria-disabled="true"` keeps it focusable and needs JS to block activation.
- When the focused element is hidden or removed, move focus to a logical neighbor or back to the trigger. Move focus into new content only when the user's action leads there, such as opening a view.
- For custom gestures, scope `touch-action` to the axis you need (`pan-y` for a horizontal swipe). `none` blocks page scrolling through the element.

## Names, labels and live regions

- The visible label text appears verbatim in the accessible name (2.5.3), so a button that shows "Find" has an accessible name that contains "Find".
- Voice control software relies on an explicit `<label for>` that matches the input `id`, and nesting the input in the label is not enough for all of them.
- A heading inside `<summary>` loses its heading role in some browsers. Put a disclosure button inside the heading instead.
- Safari removes list semantics from `<ul>` and `<ol>` styled `list-style: none` (Tailwind `list-none`) outside `<nav>`. Add `role="list"` when the item count matters.
- Hide decorative SVG with `aria-hidden="true"` and decorative `<img>` with `alt=""`. A state icon inside `<summary>` gets no text alternative, which would repeat the state.
- Use `role="alert"` or `aria-live="assertive"` only for critical, time-sensitive events such as a session timeout or data loss, `polite` for results and saved states, and no live region for loading states, which `<progress>` shows instead. Keep one polite and one assertive region per page, debounce frequent updates, and announce nothing from DOM that is about to become `inert`.
- A toggle button whose label switches between "Pause" and "Play" sets no `aria-pressed`, because the label already carries the state.

## Text, zoom and motion

- Set font sizes in `rem` so the user's browser setting applies, and leave zoom enabled, without `maximum-scale=1` or `user-scalable=no` (1.4.4). iOS Safari zooms into inputs under 16 px, so use at least 16 px on mobile.
- Text survives 200% zoom and reflows at a 320 CSS px wide viewport without horizontal scrolling (1.4.10). Avoid `white-space: nowrap` and fixed widths on running text.
- Elements that contain text (buttons, badges, tabs, cards) get `min-block-size` rather than a fixed `height`, so text spacing at line height 1.5, paragraph spacing 2em, letter spacing 0.12em and word spacing 0.16em loses nothing (1.4.12).
- Fluid type with `clamp()` keeps the maximum at most 2.5 times the minimum, so browser zoom can still reach 200%.
- Content that moves on its own for more than five seconds needs a visible pause control (2.2.2), and nothing flashes more than three times a second (2.3.1), whatever the motion preference.
- Background video is `muted`, has no `controls`, carries `aria-hidden="true"` and gets a visible pause control. Spoken video needs `<track kind="captions">`.

## Testing

- Besides axe or Lighthouse, which find only part of the issues, run a keyboard-only pass (Tab, Shift+Tab, Enter, Space, arrows) with visible focus, a 200% zoom pass, a forced colors pass and a screen reader pass on the changed flow.
