# Direction

## Ground the work in the brief

Name the concrete subject, the audience, the one job the surface must do, and the scene of use before choosing anything. Device, ambient light, frequency of use, time pressure, and the user's expertise change density, contrast, and tone. When the brief omits the subject, infer one from the project and state the assumption, and ask only when the answer would change the direction materially, because a question about a minor gap stalls work the user wanted done.

<example>
A dispatch board read on a wall monitor in a dim room starts with a dark theme and large status text, not a bright marketing palette.
</example>

Take distinctive choices from the subject's world, meaning its materials, vocabulary, artifacts, and real content, because a tool for accountants and a toy for children should not share a palette or rhythm merely because both are web pages.

<example>
A ceramics studio's site borrows glaze names and kiln-firing terms for its section labels, and its palette from fired clay and raw porcelain.
</example>

Use the brief's real content throughout, and leave out invented testimonials, customer logos, metrics, awards, and legal claims, because invented proof misleads visitors and exposes the user. When the brief requires content it does not supply, such as prices or delivery terms, use plausible values and obviously fake contact details, and list every invented value in the reply so the user can replace it before publishing, because placeholders that look real get published.

<example>
A bakery page without prices shows `4.50` for a croissant and `hello@example.com`, and the reply lists both for replacement.
</example>

Start from user needs and the hard work of making the task simple, not from decoration, and count research-backed patterns from a mature design system as evidence while a pattern seen in one popular product is not, because popularity shows reach and not that the pattern works.

<example>
A date field follows the GOV.UK day, month, and year inputs, which were tested with users, and not a floating-label picker copied from a trending app.
</example>

## Classify the change

Decide whether the request is a refinement, an extension, or a redesign, and keep to that scope. A refinement keeps identity, behavior, copy, and everything outside scope. An extension inherits the surrounding surface and resolves only the new purpose, content, hierarchy, and states. A redesign keeps product truth, content, function, and constraints but replaces the visual world. Do not split the difference by polishing a look the user asked to replace, and do not turn a local addition into a new identity, because the first ignores the request and the second makes the product inconsistent.

<example>
"Add a filter" is an extension that reuses the existing button and spacing tokens, while "make it feel like a different product" replaces palette, type, and layout and keeps the data and flows.
</example>

## Choose the surface mode

Choose the mode from the requested surface, not from the product, because the same product has pages with different jobs. A product's marketing page is still Persuade and its documentation is still Read. On Operate surfaces, use familiar navigation and standard controls, because users spend most of their time in other products and expect yours to work the same way, and novel navigation, custom form controls, and invented affordances cost more than they earn.

<example>
A billing admin keeps a standard left sidebar and native-looking selects, while its pricing page may use an expressive hero.
</example>

- Persuade covers landing pages, campaigns, pricing, and launches. The visitor decides and acts. A clear point of view, real imagery, and one memorable moment are appropriate.
- Operate covers dashboards, admin, authoring tools, settings, and utilities. The user completes a task, often repeatedly. Familiar patterns, scanability, consistent components, keyboard efficiency, and precise states outrank expression. Brand lives in details.
- Read covers documentation, guides, help, and changelogs. Comprehension, measure, structure, and navigation come first.
- Experience covers portfolios, showcases, and immersive demos. The work leads and the interface recedes.

## Follow the platform

For native apps, start from the platform's components and conventions, because native patterns cover most needs and leave effort for the few signature moments that matter.

<example>
A Windows tool built on the platform's native navigation view and title bar spends its design effort on one custom visualization.
</example>

On Apple platforms, use system components, semantic system colors, Dynamic Type, safe areas, and size classes rather than device type or orientation. Keep translucent system materials to the control and navigation layer and out of content, and do not hard-code documented system color values, because the system adapts its values to appearance settings and releases that a hard-coded value ignores.

<example>
A SwiftUI list uses `.primary` and `.secondary` colors and the `.body` text style, so Dark Mode and larger text work without extra code.
</example>

On Android, map custom components to Material color roles and use the current Material motion system. Recent Material releases moved components to spring-based motion, so check the installed Material version before using the older easing and duration tokens, because those tokens may no longer be maintained.

<example>
A custom card maps its fill to `surfaceContainer` and its text to `onSurface` instead of using fixed hex values.
</example>

On the web, honor browser conventions such as real links, back navigation, text selection, zoom, and native form behavior, because a web app that imitates a native platform still runs in a browser and breaks habits when it overrides these.

<example>
A filter chip that changes the view is an `a` with a URL, so the back button and open-in-new-tab both work.
</example>

## Write the design plan

For a new surface or redesign, write a compact plan before code that covers color, type, layout, spacing, a signature element, and motion, because decisions made while coding fall back to habit.

<example>
A clinic booking plan names four color roles with hex values, one sans family at a `1.2` scale, a single-column layout, and the slot picker as its signature element.
</example>

- Color as four to six named roles with values, including the neutral ramp, one dominant color, and a sharp accent with a stated job.
- Type as the families and their roles, the scale, and body measure.
- Layout as a one-sentence concept, alignment, grid, and density. An ASCII wireframe helps compare structures.
- Spacing rhythm and corner and depth treatment, varied by hierarchy rather than uniform.
- One signature element where boldness is spent. Keep everything around it quiet.
- Motion stance, either one authored moment or state feedback only.

Review the plan against the brief and against the generic defaults list by imagining a similar prompt for a different product, because any part that would come out the same is a default and not a decision. Revise it and say what changed.

<example>
A plan whose palette would be identical for a legal-aid tool and a surf shop swaps its neutral ramp for one drawn from the subject, and the reply notes the swap.
</example>

Show the plan briefly to the user when the direction is open and the user is available. When the brief is already specific or the user cannot answer, continue without waiting and summarize the plan and its assumptions in the final report, because blocking on an answer that cannot arrive wastes the turn.

<example>
For an open request such as "a site for my yoga studio", share a five-line plan first, but for a fully specified brief build directly and list the assumptions at the end.
</example>

## Extend an existing system

Map every new value to existing semantic tokens or components, and extend the source of truth instead of creating a parallel palette or spacing scale in one screen. Keep primitives as references, apply semantic tokens in designs, and add component tokens only when the system is large enough to need them, because a parallel value drifts from the system the first time it changes.

<example>
The project already defines `--color-danger`, so the new delete button uses it and does not introduce a fresh `#d32f2f`.
</example>

Give any deviation from the system a reason the user would accept, and treat inaccessible contrast, missing states, and clipped content as defects even when they are consistent, because repetition does not make a defect an intentional convention. Record durable decisions only where the project already keeps them, or when the user asks for a design document, because a decision file nobody asked for goes stale.

<example>
A dense table that uses `12px` text everywhere is an intentional convention, while the same table with `2:1` secondary text is a repeated defect to fix.
</example>
