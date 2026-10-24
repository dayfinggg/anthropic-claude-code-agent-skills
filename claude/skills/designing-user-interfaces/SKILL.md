---
name: designing-user-interfaces
description: Builds and reviews web and mobile UI to WCAG 2.2 AA with design tokens. Use for screens, components, layouts, CSS, forms, dark mode, Figma handoff, SwiftUI or Compose views, UI copy, accessibility.
---

# Designing user interfaces

The project's design system, brand guide, or Figma file wins over this skill. Use its tokens and components first.

- Each screen has one primary action, and it is the most prominent element.
- Space on a 4 or 8 unit scale. Keep body lines near 45 to 75 characters.
- Lay out mobile first. Use one or two typefaces and five to seven sizes.
- Body text is at least 16 CSS pixels on the web and 17 pt on iOS. Line height is 1.4 to 1.6.
- Name colors by role, such as `surface` and `danger`. Give each a light and a dark value.
- Text contrast is at least 4.5:1. Large text, at 24 CSS pixels or 18.66 bold, needs 3:1.
- Icons need 3:1. Color is never the only signal.
- Style focus with `:focus-visible`. The indicator is at least 2 CSS pixels thick with 3:1 contrast.
- Every field has a visible label. Placeholders are hints only.
- Use the right input types and `autocomplete` values.
- Validate on blur or submit. Show the error beside the field with the fix, and keep the entered data.
- Buttons name the result, as in "Save changes", not "OK" or "Submit".
- Touch targets are at least 44 by 44 pt on iOS and 48 by 48 dp on Android.
- Design empty, loading, error, and edge states.
- Render untrusted data as text, with `textContent` or the framework's escaping.
- Spend visual boldness on one element and keep the rest calm.

## Verify before finishing

1. Run axe or Lighthouse. They find only part of the issues.
2. Walk the whole flow with only a keyboard.
3. Check 320 CSS pixels wide and 400 percent zoom.
4. Check reduced motion, dark mode, and increased contrast.

## Reference files

- [reference/accessibility.md](reference/accessibility.md), read for WCAG 2.2 criteria, ARIA, modals, native app accessibility, and EU scope.
- [reference/platforms.md](reference/platforms.md), read the section for the target platform.
- [reference/design-systems.md](reference/design-systems.md), read when tokens or a Figma file are involved.
- [reference/details.md](reference/details.md), read for component states, motion, HTML injection rules, and generic looks to avoid.
