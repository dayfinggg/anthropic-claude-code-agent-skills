# Accessibility

WCAG 2.2 level AA is the baseline. WCAG 3 is a draft, so do not design against it.

For EU-facing products, check Directive (EU) 2019/882 and the EN 301 549 standard for the required WCAG level.

## Criteria new in WCAG 2.2

| Criterion | Level | Rule |
|---|---|---|
| 2.4.11 Focus Not Obscured | AA | The focused element is never entirely hidden by sticky headers, banners, or overlays. |
| 2.5.7 Dragging Movements | AA | Every dragging action also works with single clicks or taps. |
| 2.5.8 Target Size | AA | Pointer targets are at least 24 by 24 CSS pixels, or have enough spacing around them. |
| 3.2.6 Consistent Help | A | Help appears in the same place across pages. |
| 3.3.7 Redundant Entry | A | People do not re-enter information they already gave in the same process. |
| 3.3.8 Accessible Authentication | AA | Login needs no memory or puzzle test without an alternative. Allow paste and password managers. |

Criteria 2.4.12, 2.4.13, and 3.3.9 are level AAA and optional.

## Checks that are often missed

- Reflow is tested at 320 CSS pixels wide, which equals 400 percent zoom. The 200 percent figure belongs to text resize.
- Larger user text spacing causes no clipping.
- Status messages such as "Saved" are announced without moving focus, with `role="status"` or `aria-live="polite"`.
- Pages with repeated navigation have a skip link.
- Focus or input never triggers an unexpected change of context.

## Semantics and ARIA

- Use native elements first. A wrong ARIA role is worse than none.
- Icon-only buttons get an accessible name, as in `aria-label="Close"`. Decorative icons get `aria-hidden="true"`.
- Link errors to fields with `aria-describedby`, and mark invalid fields with `aria-invalid="true"`.
- Use `dialog.showModal()` for modals instead of a hand-written focus trap.

## Native apps

- **iOS and macOS.** Set accessibility labels, hints, and traits. Support Dynamic Type, VoiceOver, Voice Control, Full Keyboard Access, Reduce Motion, Reduce Transparency, and Increase Contrast.
- **Android.** Set `contentDescription` or Compose semantics. Support font scaling and TalkBack.

## Screen reader test

Test the main flows with VoiceOver, NVDA, or TalkBack. Automated tools cannot judge reading order or label quality.
