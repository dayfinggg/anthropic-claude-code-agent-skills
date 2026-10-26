# Typography

## Contents

- Choose faces for the subject
- Set a scale and roles
- Keep text readable
- Get the details right

## Choose faces for the subject

Choose typography before color and decoration, and pick a face whose character fits the subject and audience and not the family used on the last project. Name the choice and its reason in the design plan, because typography carries most of a surface's personality.

<example>
A tide-table app picks a sturdy grotesque with clear numerals for glare conditions, and the plan says so.
</example>

Use as few families as the hierarchy needs. One well-tuned family often carries an entire product UI, and a second family needs a role it alone performs, such as display headlines or code, and must differ clearly from the first, because mixed faces obscure hierarchy and make an interface feel inconsistent.

<example>
An admin tool uses one sans for everything and a monospace only for code samples.
</example>

On native platforms, prefer the system fonts and text styles unless the brand requires otherwise, because they support Dynamic Type, Bold Text, and optical sizing automatically and a custom font must implement the same behaviors.

<example>
An iOS settings screen uses the system `body` and `headline` text styles and gains larger-text support for free.
</example>

Check script coverage before committing to a face. Interfaces in a non-Latin script such as Cyrillic, Greek, Arabic, Devanagari, or Thai, or in a Latin-script language with accented or extended letters such as `ł`, `ő`, `ş`, or `ệ`, need complete glyph sets including the letters and marks specific to the language, confirmed for every weight and style in use, because many display faces lack non-Latin scripts and extended Latin, and a silent fallback breaks the design mid-word.

<example>
Before choosing a condensed display face for a Turkish-language ticketing app, render a string containing `İ`, `ı`, `ş`, and `ğ` in each weight and confirm none falls back.
</example>

## Set a scale and roles

Define named roles such as display, heading, title, body, label, caption, and data, each with size, weight, line height, and tracking, and keep repeated roles identical across screens. Make adjacent roles differ enough to read as different jobs by combining size, weight, and color and not size alone, because near-identical roles blur the hierarchy.

<example>
`title` is `20/28` at weight `600`, and `label` is `14/20` at weight `500` in the muted text color.
</example>

Pick the scale ratio from the surface. Operate surfaces work well with a tight ratio around `1.125` to `1.2` and fixed `rem` sizes, because many roles coexist and users view at a stable distance. Persuade surfaces can use a wider ratio and larger display sizes. A fluid scale interpolates between a small-screen ratio and a large-screen ratio, for example `1.2` to `1.333`.

<example>
An admin UI uses `1.125` from a `16px` base for `16`, `18`, `20`, and `23`, while a launch page sets its display line on a `1.333` ratio.
</example>

For fluid sizes, combine a `rem` term with viewport units inside `clamp()` and keep both limits in `rem`, because a size in `vw` alone ignores the user's font settings and zoom.

<example>
`font-size: clamp(1.75rem, 1.2rem + 2vw, 3rem)` for a page title.
</example>

## Keep text readable

Use a body size of at least `16px` on the web for reading text, which is the browser default and sits inside the `15` to `25` pixel range Practical Typography recommends, avoid ultralight and thin weights at small sizes, and use larger sizes when a face is light, because thin strokes break up on screens.

<example>
A user manual's body text is `17px` in a regular weight and not `15px` in a light weight.
</example>

Keep prose between about `45` and `75` characters per line by limiting the container with `max-inline-size` in `ch` units, because longer lines make the eye lose its place on the return. Dense tables and compact UI can run wider.

<example>
`max-inline-size: 68ch` on the changelog text column.
</example>

Use unitless line heights. Body text usually sits between `1.4` and `1.6`, large headings need less, longer lines need more leading, and light text on dark backgrounds often needs slightly more line height and weight. Content must still work when users raise line height to `1.5` and letter spacing to `0.12em`, because they may override text spacing and a fixed-height container clips the result.

<example>
Body uses `line-height: 1.5`, the page `h1` uses `1.15`, and cards have no fixed heights that would clip.
</example>

Support text enlargement to `200%` without loss of content. When text grows, stack side-by-side items instead of truncating, and keep the most important content first, because truncation hides what enlarged-text users came for.

<example>
A toolbar that pairs a label and a value wraps to two rows at `200%` and does not cut the value with an ellipsis.
</example>

## Get the details right

Use real punctuation such as curly quotes, a proper ellipsis, and correct dashes in interface strings, and join numbers and units with a non-breaking space, because straight quotes and split units look unfinished and wrap badly.

<example>
A non-breaking space keeps `16 GB` on one line, and a button reads `Loading…` with one ellipsis character.
</example>

Use tabular numerals for columns, prices, timers, and anything that updates in place, because proportional digits make values jitter and misalign.

<example>
`font-variant-numeric: tabular-nums` on the price column and the countdown.
</example>

Balance headings with `text-wrap: balance` and reduce orphans in body text with `text-wrap: pretty` where supported, because unbalanced headings leave a single word on the last line.

<example>
A three-line card title wraps into even lines instead of ending on one lonely word.
</example>

Use bold or italic sparingly and not combined, keep all caps for short labels with a little added letter spacing, and reserve underline for links that stay distinguishable without color alone, because stacked emphasis cancels itself and an underline on non-links reads as a link.

<example>
Section labels such as `ACTIVE` use `0.06em` letter spacing, and body links are underlined while headings are not.
</example>

Load only the weights and styles in use, provide metric-compatible fallbacks, and avoid invisible text while fonts load, because unused weights cost bandwidth and swapped fonts shift the layout.

<example>
Two weights are requested with `font-display: swap` and a fallback with adjusted metrics.
</example>
