# Controls and states

## Contents

- Design every state, not the screenshot
- Make actions clear
- Shape forms around the user
- Explain empty and loading states
- Match feedback to significance
- Handle data-dense views

## Design every state, not the screenshot

For each view, decide what appears while loading, when there is no data yet, when filters return nothing, when part of the data fails, on full failure, offline, without permission, and with one item or thousands, because a surface is designed only when its unhappy paths are designed and generated interfaces most often ship the populated happy path alone.

<example>
A task list gets skeleton rows while loading, `No tasks yet` with a create button, `No tasks match` with a clear-filters link, and a retry banner for failures.
</example>

Give every interactive component a default state, hover where a pointer exists, visible keyboard focus, pressed, disabled, and, where relevant, selected, loading, and error states. Interactive states should increase contrast relative to rest, and none should change the control's size or shift surrounding layout, because a control without a pressed state feels unresponsive and a size change makes the layout jump.

<example>
A button darkens one step on hover, shows a `2px` focus outline with offset, and keeps its `40px` height in every state.
</example>

When a prototype needs controls for switching states or simulating failures, make them look like tooling rather than product UI and keep them out of the product's layout and tab order where possible, because otherwise they get mistaken for product features or shipped.

<example>
A small fixed dev bar outside the main container switches between `empty` and `error`.
</example>

## Make actions clear

Give each view one most likely action with the prominent style, distinguish the preferred choice by style and not by size so options of the same kind stay the same size, and do not give a destructive action the primary role even when it is the likely choice, because people activate prominent buttons without reading them.

<example>
In a `Discard draft?` dialog, `Keep editing` is the filled button and `Discard` is a red text button of the same size.
</example>

Label buttons with a specific verb that says what happens, prefer text over an icon when a short label is clearer, and give icon-only controls an accessible name. Show progress inside the button for actions that do not complete instantly and keep the button enabled until the request starts, because a button disabled before the click leaves people unsure why.

<example>
`Mark as shipped` shows a spinner inside itself after the click, and the trash icon button has `aria-label="Delete row"`.
</example>

Prefer undo to confirmation when the result is expected and reversible. Confirm only unexpected, irreversible data loss, name the object and consequence in the confirmation, and reserve modal dialogs for decisions that genuinely need interruption, because routine confirmations get dismissed by habit.

<example>
Archiving a message shows `Archived` with an `Undo` link, while `Delete workspace "Acme"` asks for confirmation and names the 14 projects it removes.
</example>

## Shape forms around the user

Keep a visible label for every field, because a placeholder is a format hint and vanishes while typing. Group related fields, prefer one column for sequential input, mark the exception (required or optional) consistently, use the correct input type and autocomplete so keyboards and password managers help, and allow paste.

<example>
`Email` sits above its field with the placeholder `name@company.com`, `type="email"`, and `autocomplete="email"`.
</example>

Validate most fields when the user leaves them, and values of known length, such as one-time codes, once that length is reached, unless the project's design system sets another timing, as GOV.UK does by validating on submit. Skip the flag on an empty field the user merely tabbed through. Remove an error the moment the value becomes valid, on each keystroke and not on blur, and add positive confirmation for fields people often get wrong, such as passwords, because early errors punish typing and late error removal makes valid input look broken.

<example>
The `Postcode` error appears on blur and disappears as soon as the value becomes valid, a six-digit code is checked at the sixth digit, and a card number is checked at the length its detected card network allows.
</example>

Place each error next to its field, say what is wrong and how to fix it in plain words, keep the user's input, and pair error color with an icon and text. After a failed submit on a long form, move focus to a summary or the first invalid field, and keep submit-time and server-side errors because inline validation does not replace them.

<example>
After a failed submit, focus lands on the first invalid field, which shows `Enter a date after today` in red with an icon.
</example>

Split long forms into steps only when the steps are meaningful, and show where the user is and how much remains, because artificial steps add clicks without reducing effort.

<example>
A checkout shows `Step 2 of 4, Delivery` above separate shipping, delivery, payment, and review screens.
</example>

## Explain empty and loading states

Leave no area blank. An empty state says what belongs here and offers a direct way to fill it, such as a create button, an import option, or sample data. Distinguish "nothing yet", "nothing matches these filters" with a way to clear them, and "could not load" with a retry, and show a loading placeholder and not a "no records" message while data loads, because users leave before data appears when they are told there is none.

<example>
A search page shows `No results for "inox"` with a `Clear filters` button, and the same page shows skeleton rows while the request is pending.
</example>

Show something immediately. Use placeholders that match the final layout for content regions so nothing jumps when data arrives, use a determinate indicator when progress is measurable, and keep spinners for short, contained waits such as a button action, because a lone spinner gives no sense of what is coming.

<example>
A table loads five skeleton rows with the final column widths, and only the `Save` button shows a spinner.
</example>

## Match feedback to significance

Keep users informed about what the system is doing within a reasonable time. Show passive status near the items it describes, such as counts, sync state, and last update, confirm important completions briefly, interrupt only for critical, actionable information, and explain why an action cannot be performed instead of disabling it silently, because an unexplained disabled control reads as a bug.

<example>
`Last synced 2 min ago` sits beside the list heading, and a disabled `Place order` has the helper text `Add a delivery address`.
</example>

Leave messages that contain errors, decisions, or anything the user must read on screen until dismissed, because timed elements fail people who need more time. Toasts suit brief confirmations and undo offers.

<example>
A `Saved` toast disappears after a few seconds, while a payment-failed message stays inline until the card is fixed.
</example>

## Handle data-dense views

Right-align numbers, use tabular numerals, and keep units consistent. Keep table headers visible while scrolling, keep row actions in a consistent place, and make the selection model obvious for bulk actions, including how many items are selected and which will be skipped, because a bulk action on an unclear selection changes the wrong items.

<example>
The `Revenue` column is right-aligned with tabular numerals, and the bulk bar reads `12 selected, 2 skipped because already archived`.
</example>

Put filters, sort, and pagination state in the URL on the web, because views can then be shared and restored.

<example>
`/orders?status=open&sort=date&page=3` reopens the same view after a reload.
</example>
