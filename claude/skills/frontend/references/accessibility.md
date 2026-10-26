# Accessibility and interaction

## Contents

- Choose the right behavior before the styling
- Keep keyboard operation predictable
- Handle overlays according to their purpose
- Make names and feedback usable
- Apply measured accessibility requirements

## Choose the right behavior before the styling

Use a native control when it expresses the action, so a button performs an action, a link navigates, and a form supports submission, and keep headings, lists, landmarks, and data tables meaningful without CSS, because native elements bring keyboard behavior, focus, and semantics that a restyled generic element must rebuild. Style the native element instead of replacing it, and give informative images an equivalent description and decorative images empty alternative text.

<example>
"Delete row" is a `<button type="button">`, the "Orders" menu entry is `<a href="/orders">`, the product photo has `alt="Blue ceramic mug"`, and a divider image has `alt=""`.
</example>

Choose a custom widget by its behavioral contract and not by its appearance, and prefer an existing accessible primitive that satisfies the required pattern, because the contract decides the roles and keyboard behavior. A navigation disclosure is not an application menu, and a searchable selection control is not a button with arbitrary children.

<example>
A site header with expandable link groups is a disclosure button over a list of links and not `role="menu"`, while a searchable country field uses the project's `Combobox` primitive.
</example>

Remember that ARIA exposes semantics and implements no activation, focus movement, or disabled behavior, so when a custom pattern is necessary build its complete role, state, name, and keyboard contract, and leave native buttons without duplicate key handlers, because attributes alone do not make a widget operable and a duplicated handler fires twice. Check the accessibility tree and not the presence of attributes.

<example>
A `div role="button"` also needs `tabindex="0"` and Enter and Space handlers, which is why `<button>` is used instead, and the browser's accessibility pane confirms its name and role.
</example>

## Keep keyboard operation predictable

Let Tab move between controls and composite widgets, let arrow keys move inside a widget only when its pattern defines that, and keep DOM order aligned with the meaningful reading order, because positive `tabindex` values patch one screen and break the order everywhere else. Keep focus and selection separate, so a slow tab panel or remote result is not activated merely because it received focus.

<example>
`tabindex="3"` on a search field is removed by moving the field earlier in the markup, and arrow keys over remote search results move the highlight without fetching each result's details.
</example>

Keep the focused item visible when scrolling or opening sticky UI, move focus to the next logical destination when its item is removed, and keep focusable controls available to assistive technology, because focus left on a removed node falls to the document body and a keyboard user loses their place. Distinguish native `disabled` from `aria-disabled`, since the latter communicates a state and the code must still block activation.

<example>
Deleting the third row of `TodoList` moves focus to the fourth row's checkbox, or to the list heading when the list is empty, and a button with `aria-disabled="true"` returns early in its click handler.
</example>

Leave browser, operating-system, assistive-technology, and text-editing shortcuts alone, and give keyboard and single-pointer alternatives to gesture-only controls unless the action is inherently gesture-dependent, because intercepted shortcuts break expected behavior and gestures exclude users who cannot perform them.

<example>
A `/` shortcut that focuses search is ignored while focus is inside an input, and a swipe-to-delete row also has a visible delete button.
</example>

## Handle overlays according to their purpose

For a modal, move focus inside, make background content unavailable, offer a clear close action, and restore logical focus afterward, choosing initial focus by the dialog's content and risk, and a destination matching the resulting workflow when the trigger has disappeared, because a modal that leaks focus or strands it on the body breaks keyboard and screen reader flow.

<example>
A "Delete project" confirmation focuses Cancel first, and after the deletion focus goes to the projects list heading because the trigger row no longer exists.
</example>

Use a native modal dialog where the supported browsers allow it and add no second focus trap over it, and let a non-modal popover float without trapping focus, because a native dialog opened with `showModal()` already supplies modal behavior and a duplicate trap fights it. Check outside click, Escape, nested overlays, and scroll behavior in the supported browser.

<example>
`ConfirmDialog` wraps `<dialog>` and calls `showModal()` and drops its old focus-trap package, while a filter popover closes on Escape and never captures Tab.
</example>

## Make names and feedback usable

Associate visible field labels with their controls, keep accessible names aligned with the visible wording, name icon-only controls by their action, distinguish repeated row actions by their subject, and keep instructions and errors as descriptions, because voice-input users speak the visible label and a name that keeps growing becomes unusable.

<example>
The search input uses `<label for="q">`, the trash icon button has `aria-label="Delete invoice 1042"`, and the hint "Use 8 or more characters" is linked with `aria-describedby`.
</example>

After a failed submission, move focus to the error summary or the first invalid field and connect each specific error to its field, and announce success and progress through a status region without moving focus, because a failed submit needs the user to land on the errors while a routine update must not pull focus away.

<example>
A failed 20-field checkout focuses an error summary with links to `#email` and `#card-number`, "Saved" appears in a `role="status"` region, and the character counter is not announced.
</example>

## Apply measured accessibility requirements

Give text at least `4.5:1` contrast, or `3:1` for large text as WCAG defines it (18 pt, or 14 pt bold), and give essential control and graphical indicators `3:1` against adjacent colors, because low contrast makes content unreadable for many users. Decorative borders are not such indicators, and the large-text exception comes from the definition and not from visual guesswork. Check the rendered colors with a contrast tool.

<example>
`#767676` text on white measures `4.54:1` and passes, while a `#ccc` input border at `1.6:1` fails when it is the only cue for the field's edge.
</example>

Check text enlargement to `200%` and reflow of vertically scrolling content at an equivalent width of `320 CSS pixels`, because users with low vision zoom in instead of using a small viewport, and content that needs two-dimensional scrolling at that width locks them out. Genuinely two-dimensional content such as data tables and maps has an exception.

<example>
Zoom `FilterPanel` to `400%` in a `1280px` window and confirm there is no horizontal scrollbar, while the wide `PricingTable` may scroll inside its own region.
</example>

Make pointer targets at least `24 by 24 CSS pixels`, the WCAG 2.2 Target Size (Minimum) level AA requirement, and apply its spacing, equivalent-control, inline, user-agent, and essential exceptions correctly, because small targets cause mistaken activations.

<example>
A `16px` close icon gets `min-width: 24px` and `min-height: 24px` through padding, so the icon stays small and the hit area grows.
</example>

Keep keyboard focus visible and not entirely hidden by authored content, preferring it fully visible, because a sticky header that covers the focused link leaves a keyboard user without feedback.

<example>
A `64px` sticky header gets `scroll-padding-top: 72px` so anchors and focused links scroll clear of it.
</example>

Convey information by more than color, keep browser zoom working, and honor reduced-motion preferences, because color-blind users and users sensitive to motion are otherwise excluded.

<example>
An invalid field shows an icon and the text "Enter a valid email" next to its red border, and a parallax slide becomes a fade under `@media (prefers-reduced-motion: reduce)`.
</example>

For non-web interfaces, use the platform's controls, semantics, and accessibility tooling and not transplanted HTML and ARIA, because each platform exposes accessibility through its own API.

<example>
A SwiftUI screen sets `accessibilityLabel` on an icon-only button and does not add `role` attributes.
</example>

Verify with keyboard operation and the relevant assistive technology, and run available automated checks as well, because a passing scanner does not establish complete accessibility. For a custom control or overlay, use only the keyboard to check entry, movement inside, closing, and the next focus destination, and repeat after the original trigger is removed when that can happen.

<example>
Run an axe scan on `/checkout`, then finish the purchase with Tab, Shift+Tab, Enter, and Space alone and listen to the error summary with a screen reader.
</example>
