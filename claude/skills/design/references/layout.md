# Layout and hierarchy

## Contents

- Decide what leads
- Group by meaning
- Use a spacing scale with rhythm
- Align deliberately
- Match density to the task
- Let content drive responsive structure

## Decide what leads

Order content by the user's priorities and not by the order the data arrives in. Decide what the user sees first, what supports it, and what waits behind disclosure, put the most important item near the top and the leading edge, and let reading order match visual order, because keyboard and assistive technology users follow the document order.

<example>
An order page leads with status and delivery date, the line-item table sits below, and the document order matches that sequence.
</example>

Build hierarchy from contrast in size, weight, value, and space and not from color alone, and keep the number of levels low. About three type sizes suit a simple design, and at most two large elements should compete for attention, because when most elements share a size and color nothing leads.

<example>
A settings screen uses a `32px` page title, `20px` section headings, `16px` body, and exactly one filled primary button.
</example>

Check hierarchy with a squint or blur test. With detail blurred, the primary element, the secondary element, and the major groups should still be identifiable in order. A light blur confirms intended emphasis, and a heavy blur exposes accidental focal points such as one saturated image or badge, because the eye finds contrast before it reads content.

<example>
Blurring a dashboard shows a bright `New` badge outranking the revenue figure, so the badge is toned down.
</example>

## Group by meaning

Use proximity as the first grouping tool. Keep related items close, separate unrelated groups, and remember that more space around an element gives it more importance. Add a shared background or border only when proximity cannot express the relationship, because containers that compensate for weak spacing add noise and nested containers are rarely needed.

<example>
Form field groups sit `32px` apart with `8px` inside each group and no card around any of them.
</example>

Make similar items look alike so they read as one set, and make different items look different. Use repeated cards, columns, or sections only when their content is genuinely equivalent and not because a framework grid made it convenient, because identical treatment tells the reader the items are interchangeable.

<example>
Three pricing tiers share one card style, while the single legal notice below them is plain text and not a fourth card.
</example>

Separate risky actions from frequent ones, and keep a destructive control away from where a primary action is expected, because a misplaced click on a destructive control costs data.

<example>
`Delete project` sits at the bottom of the settings page, away from `Save changes`.
</example>

## Use a spacing scale with rhythm

When the project has no scale, start from a `4px` base with steps such as `4`, `8`, `12`, `16`, `24`, `32`, `48`, `64`, and `96`, and avoid one-off values outside the scale, because off-scale values accumulate into misalignment nobody can trace. Carbon builds its scale from multiples of two, four, and eight, and Atlassian from an `8px` unit with a `12px` half step.

<example>
A card padded `20px` moves to `16px` or `24px`, whichever fits its density.
</example>

Create rhythm from contrast between tight and generous intervals. Keep items within a group tight, separate groups generously, and put more space above a heading than below it so the heading belongs to the content it introduces, because repeating one spacing value everywhere gives every relationship equal weight.

<example>
An `h2` has `48px` above and `12px` below, and the list under it uses `8px` between items.
</example>

Give spacing an owner. Let a parent layout express sibling gaps with `gap` or a stack primitive, because child margins double up and leave stray space on the final child.

<example>
`gap: 16px` on the form grid replaces a `margin-bottom` on every field.
</example>

## Align deliberately

Align elements to shared edges so they scan as related, use indentation to signal subordination, and left-align body text and data in left-to-right languages. Center only short, symmetric content such as a single headline with one action, and right-align numeric columns so digits line up, because scattered edges make related elements look unrelated. Small optical adjustments are fine after inspecting the render.

<example>
A price column is right-aligned with tabular numerals, and the hero is centered only because it holds one headline and one button.
</example>

Mirror layout for right-to-left languages through logical properties and platform components and not through separate hand-built layouts, because a hand-built mirror drifts from the original on every later change.

<example>
`margin-inline-start` replaces `margin-left`, so the Arabic layout flips without extra rules.
</example>

## Match density to the task

Let Operate surfaces used daily be dense, with many rows and compact controls, as long as targets stay usable and grouping stays clear, give Persuade and Read surfaces more air, and keep density stable within one product, because users should not relearn spacing on every screen.

<example>
An inbox uses `32px` rows with `13px` text, and every other list screen in the product uses the same row height.
</example>

Size touch and pointer targets for accuracy. Apple suggests about `12pt` of padding around bezeled controls and about `24pt` around borderless ones. On the web, pointer targets need at least `24 by 24 CSS pixels` unless an exception applies, and important controls should be larger, because small targets cause mistaken taps.

<example>
A `28px` icon button passes the web minimum, while the primary mobile button is `44px` tall.
</example>

## Let content drive responsive structure

Design for the available space and not for device names. Size classes and container widths describe real space, so keep functionality the same as space changes and change only how much is visible at once, because a device name misses split-screen windows and embedded containers.

<example>
The sidebar collapses when its container drops below `720px`, whatever the device is called.
</example>

Change structure at the points where content needs it. Stack side-by-side items when text grows, collapse secondary navigation, and turn wide tables into a scrolling region or a deliberate card view rather than squeezing every column, and keep a region's color role and identity the same across breakpoints, because squeezed columns truncate everything.

<example>
A nine-column invoice table scrolls horizontally at `390` pixels with its first column pinned.
</example>

Test the extremes, namely long names, translated strings, empty data, a single item, hundreds of items, enlarged text, and zoom, because sample content hides structural failures.

<example>
A user card is tried with `Maximilian Bartholomew-Oyelaran-Smith` and a list of 400 items before it counts as done.
</example>
