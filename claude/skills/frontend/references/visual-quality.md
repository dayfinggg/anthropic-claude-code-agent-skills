# Styling implementation

## Take visual choices from the design source

Take visual choices such as palette, type scale, spacing scale, hierarchy, density, and motion from the project's design system or from a design skill when one is installed, and use this reference for how those choices are implemented in CSS and component code, because two sources that decide the same visual question give conflicting defaults. When the project has no scale or token for a value, bring the value from the installed design skill's guidance and not from a number chosen inside one component.

<example>
A request for "tighter card spacing" reads the spacing tokens in `tokens.css` and uses `var(--space-3)`, and without a spacing scale the new value comes from the installed design skill and is added to `tokens.css`.
</example>

## Reuse what the project already styles

Inspect representative screens, theme files, tokens, assets, and reusable components before writing new styles, reuse a repeated intentional convention, and keep a repeated defect such as inaccessible contrast or clipped content out of the new styles instead of copying it, and mention the existing defect as a follow-up, because consistency with a defect spreads the defect. Treat source inspection as showing likely decisions and confirm the rendered result in the browser.

<example>
`Button.module.css` and three other components use `border-radius: var(--radius-2)`, so the new `Tag` uses it too, while the `#999` placeholder text that fails contrast is not copied and is mentioned as a follow-up.
</example>

When matching a supplied reference or mockup, compare it at the same viewport and content state, and check type metrics, spacing, alignment, cropping, and emphasis before adding any decoration, because a different viewport or different content hides the real differences.

<example>
Open the mockup export and the page both at `1440x900` with the same sample order, then compare the heading's `font-size` and the gap below it in the browser's computed styles.
</example>

## Treat tokens as a maintained contract

Map changed values to existing semantic roles and component tokens, extend the source of truth and not a parallel palette inside one component, and check every supported theme and state when changing a shared token, because one-off values drift from the system and a token change reaches every theme that uses it.

<example>
A new error banner uses `var(--color-danger-bg)`, and after that token is adjusted both the light and the dark theme are opened.
</example>

For CSS custom properties, check the computed value and inheritance at the affected element, because a fallback for a missing token does not prove the token is configured, and a variable whose value is invalid for its property resolves to that property's initial or inherited value and does not restore an earlier declaration.

<example>
`--gap: 12` used as `gap: var(--gap)` computes to `normal` because the unit is missing, which the computed styles of that element show.
</example>

When editing interoperable token files, preserve the project's format and resolver, check types, alias targets, and circular references with the existing tooling for DTCG-compatible files, and keep an established format even when a newer specification exists, because a migration changes every consumer of the tokens.

<example>
An alias such as `{color.brand.500}` in `tokens.json` is validated by the existing token build script, and the file keeps its current format.
</example>

## Give spacing an owner in code

Let the containing layout own the space between its children through `gap` or a stack primitive and not through margins scattered across the children, check nested groups and final children for doubled or stray spacing, and scope layout rules so they do not reach nested lists or controls, because child-owned margins double up, leak after the last item, and change when a child moves.

<example>
`gap: var(--space-4)` on a grid `.card-list` replaces `margin-bottom` on each `.card`, which also removes the extra gap after the last card.
</example>

Compose simple layout responsibilities instead of adding a unique spacing exception for each screen, and create a shared wrapper when it expresses a recurring layout responsibility and not merely identical CSS text, because text that is identical today changes for different reasons later.

<example>
A `Stack` component sets the vertical spacing of form sections for six forms, while two unrelated cards that both have `padding: 12px` do not get a shared `Padded12` wrapper.
</example>

## Let content determine responsive mechanics

Keep the source order meaningful before arranging columns, prefer flexible Grid, Flexbox, intrinsic sizing, and container-aware rules where supported, and add a breakpoint where the content needs a different arrangement and not because of a device name, following the project's supported-browser policy for newer features, because source order drives keyboard and screen reader order and device-based breakpoints age badly.

<example>
A card grid uses `grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr))` and adds a breakpoint only where its labels start to wrap, and a container query is used only after the browserslist is checked.
</example>

When content overflows, identify the item that imposes the minimum size, because flex and grid items can resist shrinking through their automatic minimum, and fix it with a targeted minimum-size or wrapping rule instead of hiding the page's overflow, which conceals the cause and clips content.

<example>
A long file name pushes a flex row wider than the screen, so `min-width: 0` and `overflow-wrap: anywhere` go on the text item and the body keeps its overflow.
</example>

Test long labels, unbroken identifiers, translated content, empty data, missing images, and dense tables at narrow, intermediate, and wide widths, including the widths just before layout changes, keep access to important truncated text, and keep genuinely two-dimensional data usable in a scrolling region and not squeezed into a screenshot, because sample content hides most overflow bugs.

<example>
A 12-column table scrolls inside an `overflow-x: auto` wrapper at `360px`, and a 70-character `order_reference` wraps instead of widening its card.
</example>

Check fixed and sticky UI with zoom, the virtual keyboard, and short viewports where relevant, and prefer natural growth and deliberate scrolling boundaries to clipping, because a fixed-height desktop composition can make essential controls unreachable on a phone.

<example>
A sticky footer holding the Pay button is opened at `320x568` with the on-screen keyboard up, and a `height: 100vh` panel becomes `min-height: 100dvh` so its content can grow and it follows the browser toolbars, with the keyboard case checked separately because viewport units typically ignore the on-screen keyboard.
</example>

## Implement interaction states in code

Implement the hover, focus, active, disabled, selected, and pending states a control needs without changing its geometry, and keep hover from being the only way to discover or operate an action, because geometry changes on hover move the click target and touch users have no hover.

<example>
`.btn:hover` changes only the background color, `:focus-visible` adds a `2px` outline with an offset, and the pending button swaps its label for a spinner at the same `min-width`.
</example>

Write motion so it can be interrupted and give it a variant for `prefers-reduced-motion`, taking durations and easing from the design system or an installed design skill, because users sensitive to motion turn the preference on and a transition that cannot be interrupted blocks input.

<example>
A drawer slide uses a CSS `transition` so a second click reverses it midway, and under `@media (prefers-reduced-motion: reduce)` it fades in instead of sliding.
</example>
