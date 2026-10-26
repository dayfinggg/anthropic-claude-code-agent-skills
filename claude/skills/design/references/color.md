# Color and depth

## Contents

- Assign roles before hues
- Build a palette with a dominant voice
- Meet contrast with margin
- Design each theme
- Use depth to explain structure

## Assign roles before hues

Define color by job and not by appearance, with named roles such as background, surface levels, primary action, text on primary, secondary text, border, focus, selected, success, warning, danger, and information. Pair every fill role with an "on" role for the text and icons placed on it, as Material does, and use roles only in their intended pairs, because contrast breaks when themes or contrast settings change.

<example>
`primary` always carries `on-primary` text, so the dark theme swaps both together.
</example>

Give each step of a twelve-step scale per hue a job, as Radix does for app background, subtle background, component states, borders and focus rings, solid fills, and low and high contrast text. Fix the steps in advance instead of generating ad hoc lighter and darker values in components, because ad hoc values drift and fail contrast.

<example>
A solid button hovers to the next step of its own scale and not to `darken(8%)` computed in the component.
</example>

Use the same color for the same meaning everywhere. If the accent marks interactive elements, keep it off static text, keep status colors to one meaning across the product, and reserve red for danger and errors, because people learn color meaning once and misread it when it changes.

<example>
Blue means clickable throughout, so page headings stay neutral and a blue heading is never mistaken for a link.
</example>

## Build a palette with a dominant voice

Use a dominant color with a sharp accent, because that reads as a decision while evenly distributed color reads as timid. Keep most of the interface neutral, give the accent a stated job such as primary actions, current selection, and focus, and keep it off decoration and inactive states.

<example>
A project tool uses gray neutrals and one teal that appears only on the primary button, the selected row, and focus rings.
</example>

Plan the neutrals carefully because they carry most of the surface. Eight to ten grays tinted slightly toward the brand hue usually cover backgrounds, borders, and text. Start from a deliberate darkest value and not pure black or an arbitrary tinted near-black, pick a mid shade that works as a button fill, then define the lightest and darkest steps by their use.

<example>
A teal brand tints its grays toward teal, so body text is `#1B2A2A` and not `#000`.
</example>

Generate and adjust ramps in a perceptual color space such as OKLCH or LCH, because lightness there tracks what the eye sees, so changing hue keeps contrast close to stable. Stripe's system guarantees small-text contrast between any two steps five levels apart, and Linear generates whole themes from a base, an accent, and a contrast value.

<example>
Moving a ramp from blue to green at the same OKLCH lightness keeps the contrast between its steps close to unchanged, within a few percent for soft colors, so the ratio is still measured on the final pair.
</example>

Provide sRGB values for wide-gamut colors where the difference matters, and check colors in the browser rather than trusting the numbers, because an out-of-gamut OKLCH value is clipped or gamut-mapped depending on the browser, which changes saturation and can shift hue.

<example>
A vivid `oklch()` accent gets an sRGB fallback, and both are compared in the rendered button.
</example>

## Meet contrast with margin

Give text at least `4.5:1` against its background and large text at least `3:1`, and give essential boundaries of controls, focus indicators, and meaningful graphics `3:1` against adjacent colors. Measure the actual rendered pair, including text over images, gradients, and translucent layers, because the declared color is not always the one users see.

<example>
White text over a hero photo is measured against the lightest area behind it, not against the photo's average.
</example>

Treat WCAG ratios as the reference and APCA only as an extra signal on top of passing WCAG ratios, because WCAG 2 ratios are what published accessibility standards test against.

<example>
A `4.2:1` pair is raised to pass even when an APCA calculator rates it acceptable.
</example>

Pair color with text, icons, shape, or position for state, errors, links, and chart series, because color-blind users and low-contrast displays lose color-only cues. On colored surfaces, derive secondary text from that surface's hue and not neutral gray.

<example>
An invalid field gets a red border, an icon, and the text `Enter a valid email`, and secondary text on a green banner is dark green and not `#666`.
</example>

## Design each theme

Support the themes the product needs, and on native platforms follow the system appearance instead of adding an app-only switch. Treat a dark theme as its own design and not an inversion. Backgrounds get dimmer and foreground colors brighter, and each custom color needs its own dark variant checked for contrast, because a mechanical flip breaks contrast and saturation.

<example>
A `#2563EB` accent becomes a lighter `#6B93F5` in dark, and both are measured against their own backgrounds.
</example>

In dark themes, give elevated layers such as sheets and popovers brighter surfaces than the base to show depth, and soften pure white content images so they do not glow. Check every theme with increased contrast and reduced transparency settings where the platform has them, and on the web declare `color-scheme` so native controls and scrollbars match the theme, because otherwise they render in the wrong theme.

<example>
`:root { color-scheme: light dark }` is set, and the popover surface is `#1F2530` over a `#151A22` page.
</example>

Choose light or dark from the scene of use and not from the category, because the same category serves different conditions.

<example>
A night-shift logistics console defaults to dark, and a recipe site read in a bright kitchen defaults to light.
</example>

## Use depth to explain structure

Use depth to clarify layering and not to decorate. Keep one light source so every shadow shares the same offset ratio, give higher elevation a larger offset, a larger blur, and lower opacity, layer several soft shadows for realism, and tint shadows toward the background hue instead of black, because black grays out colored surfaces.

<example>
A card uses `0 1px 2px` plus `0 4px 12px`, and a modal uses a wider `0 8px 32px` shadow at lower opacity, tinted slate.
</example>

Vary radius and depth by hierarchy, since a page panel, a card, a button, and a chip do not all need the same radius and shadow. Prefer spacing and surface color steps to borders and shadows when they already show grouping, because uniform treatment flattens hierarchy and extra borders add noise.

<example>
A panel has `16px` radius and no shadow, buttons have `8px`, and chips are fully rounded.
</example>

Use translucency and blur only where they separate a functional layer from content. On Apple platforms Liquid Glass is reserved for controls and navigation, and the standard materials serve the content layer. Gradients and glows need a reason in the subject, not a gap to fill, because blur over content costs legibility and decoration spent on empty space adds nothing.

<example>
A sticky toolbar blurs the page scrolling under it, while the product cards stay opaque.
</example>
