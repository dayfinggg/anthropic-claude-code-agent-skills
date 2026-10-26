---
name: frontend
description: Implements and fixes browser interfaces, including components, forms, state, routing, rendering, styling code, and accessibility. Use when changing frontend code or diagnosing browser behavior. Visual design decisions belong to a design skill when one is installed.
---

# Frontend

These rules decide how browser interface code is scoped, built, and checked. Visual choices such as palette, type scale, spacing scale, and motion come from the project's design system or from a design skill when one is installed.

Before editing, settle the outcome, acceptance conditions, affected flow, stack, rendering model, and supported browsers, read the project instructions, callers, affected files, and existing checks, and inspect the running interface when a browser is available, because a change aimed at the wrong flow or browser passes its own check and still fails the user.

<example>
For "the filter resets after saving", locate the route, the store that owns the filter, and every caller of the save action, then open the page in the dev server before editing `FilterBar.tsx`.
</example>

Keep behavior and presentation apart, preserve correct tokens, components, navigation, content, and unrelated edits, and fix the defects the task covers without a redesign, because a diff that mixes a bug fix with a restyle hides the fix and risks regressions nobody asked to review.

<example>
A fix for a double submit in `CheckoutForm.vue` changes the submit handler and leaves the button styling, copy, and layout as they are.
</example>

Use the stack's existing facilities and the smallest suitable platform primitive, add a dependency or abstraction only for a requirement that exists today, and check version-sensitive APIs and scaffolding commands against the official documentation for the installed version, because remembered APIs go stale between releases.

<example>
A date field uses the `<input type="date">` pattern already present in `src/forms`, and a `datepicker` package is added only after the requirements rule that out.
</example>

Report mock data, simulated success, and swallowed errors as what they are and not as a working integration, because a UI that appears to work against nothing misleads the next person who depends on it.

<example>
A `saveProfile()` that resolves after a `setTimeout` is described as a stub, and the summary does not say "profile saving works".
</example>

Run the project checks and exercise the changed flow in a real browser through the available tools, verify behavior and appearance separately, and report material gaps, because a passing build does not show that the flow works and unobserved success is only a guess.

<example>
After `npm run build` passes, submit the real form on `http://localhost:5174/signup` and report "layout not checked below 768px" if that width was not opened.
</example>

## References

Choose the references that apply before the first edit and read each one, because each holds the checks for its branch. Leave the others unread so unrelated guidance stays out of context, and revisit the choice when the work changes.

- For project setup, component boundaries, naming, or folders, read [architecture](references/architecture.md).
- For state, forms, asynchronous work, or recovery, read [behavior](references/behavior.md).
- For routing, deep links, server rendering, or hydration, read [routing and rendering](references/routing-and-rendering.md).
- For controls, structure, names and labels, keyboard behavior, focus, overlays, announcements, contrast, zoom, or target size, read [accessibility](references/accessibility.md).
- For CSS, tokens, responsive mechanics, fixed or sticky UI, or interaction states in code, read [styling implementation](references/visual-quality.md).
- For slow loading, slow interactions, or large collections, read [performance](references/performance.md).
- For untrusted content, credentials, storage, URLs, or embeds, read [browser security](references/browser-security.md).
- Before changing a rendered element, to list every place it renders, and before finishing, read [verification](references/verification.md).

<example>
Making the feed thumbnail square in `FeedItem` calls for styling implementation and verification, but not routing and rendering or browser security.
</example>
