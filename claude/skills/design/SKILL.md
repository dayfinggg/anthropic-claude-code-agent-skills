---
name: design
description: Directs visual and UX design so interfaces look intentional rather than generated. Use when creating, redesigning, or critiquing screens, pages, components, or design systems, including vague requests to make something look better. Implementation belongs to frontend.
---

# Design

These rules direct visual and UX decisions for any interface. This skill owns visual choices such as spacing scale, type scale, palette, and motion, and frontend owns implementation, semantics, and accessibility mechanics.

Before proposing anything, identify the surface, audience, primary job, context of use, available content, platform, existing brand or design system, and whether the request is a refinement, an extension, or a redesign, then inspect the current interface, tokens, and components, because a proposal made without them replaces what already works.

<example>
For "make the settings page cleaner", read the current page, its tokens, and the components in `src/ui` first, and treat the request as a refinement.
</example>

Follow the brief exactly, including pinned fonts, palettes, references, and eras, even when they match a common default. Where the brief leaves an axis free, choose for this subject and not the statistically likely answer, and do not swap one habitual default for another fixed favorite, because a fixed favorite is still a default.

<example>
A brief that pins `Inter` and a navy palette gets exactly those, while a tide-table app with no named typeface gets a face chosen for glare readability.
</example>

Set ambition by surface mode. Persuasive surfaces such as landing pages carry a strong point of view. Task surfaces such as dashboards, admin, settings, and forms earn trust through familiar patterns, stable density, and complete states. Reading surfaces put measure, structure, and wayfinding first. Native apps follow their platform before any visual signature. A strong signature on a task surface costs users learning time on every visit.

<example>
A launch page gets one bold hero image and a distinctive display face, while its admin panel uses standard tables and a restrained accent.
</example>

For a new surface or a redesign, write a compact design plan before code and revise every part that would appear unchanged for a different product, because an unchanged part is a default and not a decision. Small extensions inherit the established system without a new plan, because a fresh plan for a local addition splits the system.

<example>
A new invoice-history page gets a plan with palette roles, type scale, and one signature element, while an added `Export` button reuses the existing button style.
</example>

When writing or changing interface code, also load the frontend skill and the references it routes to, and use dataviz for charts. Render the result and inspect it at narrow, intermediate, and wide widths in every supported theme before claiming visual quality, and report what was not rendered or checked, because source code shows intent and not outcome.

<example>
A restyled pricing page is checked at `390`, `768`, and `1440` pixels in light and dark, and the reply says no real phone was tried.
</example>

Interface copy follows the product's language, meaning the language of the existing strings or of the request when the product has none, because a mixed-language interface reads as unfinished.

<example>
A booking app whose existing strings are in Spanish gets `Guardar` on its new save button even when the request is written in English.
</example>

## References

Choose the references that apply before the decision that depends on them and read each one, because each holds the decisions for its axis. Leave the others unread so unrelated guidance stays out of context, and revisit the choice when the work changes.

- For briefs, change classification, surface modes, the design plan, platform conventions, and existing systems, read [direction](references/direction.md).
- Before committing to a plan for a new or redesigned surface, read [generic defaults](references/generic-defaults.md).
- For hierarchy, grouping, spacing, alignment, density, and responsive structure, read [layout](references/layout.md).
- For typefaces, type scales, measure, and text details, read [typography](references/typography.md).
- For palettes, color roles, contrast, themes, shadows, and materials, read [color and depth](references/color.md).
- For controls, forms, validation, feedback, empty, loading, and error states, read [states](references/states.md).
- For transitions, animation, and reduced motion, read [motion](references/motion.md).
- For labels, messages, headlines, and localization, read [writing](references/writing.md).
- Before a critique, before rendering a page with the bundled inspection script, and before reporting finished design work, read [review](references/review.md).

<example>
A landing-page redesign calls for direction, generic defaults, layout, typography, color and depth, and writing, then review before the report, but not states or motion.
</example>
