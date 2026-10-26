# Verification

## Establish observable acceptance conditions

Translate the request into outcomes a user can observe, and keep behavior, appearance, data integration, and performance claims separate, because a component that renders without an exception does not prove its action works, and a screenshot does not prove form submission, keyboard behavior, or persistence.

<example>
"Saving the profile works" becomes "after editing the name and pressing Save, a reload shows the new name", and that check is kept apart from "the Save button looks right".
</example>

Use the repository's existing test framework and check commands, and for a behavior bug run a covering test first or, when none covers it, add the smallest regression test and watch it fail for the expected reason before fixing, asserting the public outcome and not internal component structure, because a test that was never seen failing does not show that the fix works. Change the implementation and not the failing test unless the test's expectation is wrong, and then say why. Keep a new test only where the task asks for tests or the repository already keeps tests for this kind of change, and add no new testing framework for a narrow UI edit.

<example>
A new `it("keeps the typed note after a failed save")` in `ProfileForm.test.tsx` finds the field with `screen.getByLabelText("Note")` and fails before the fix.
</example>

Run the relevant tests, type checks, lint checks, and the build after the change, investigate each failure in context, and tell a pre-existing unrelated failure from a regression without silently ignoring either, because an ignored failure hides a regression and a regression called pre-existing ships.

<example>
`npm run test`, `npm run typecheck`, and `npm run build` run after the edit, and a failing `legacy-export.test.ts` that fails the same way on the untouched branch is reported as pre-existing.
</example>

## Find every place a changed element renders

Before implementing a change to a rendered element, find every template, view, feed, list, and breakpoint that renders it, including other views of the same data, and after implementing check each of them, because a change verified on one page often breaks another view of the same data. Search the repository for the component, partial, and class names, include other callers and multiple instances of a shared control, and check that IDs, local state, and focus do not collide. Check each render site at its own sizes and content and not only the one that prompted the change, and for a component with dozens of call sites check one render site per distinct variant, size, and content shape and name the sites not opened.

<example>
A thumbnail built wide for the card template turns out square in the search results, so searching for the partial first finds `product/card.html` and `search/results.html`, and each is opened at phone and desktop widths afterwards.
</example>

## Use the actual browser facilities

Read the project's start instructions and use the actual reported development URL, select browser-control facilities from the tools available in this session and read their documentation before interacting, and do not assume that a named package, integration, or tool exists, because an integration described in another product's documentation may not be present here.

<example>
The `README` says `pnpm dev` serves on `http://localhost:5174` because 5173 was busy, so the check opens 5174 with whichever browser tool the session lists.
</example>

Complete the affected flow in a real browser, inspect its visible result and the relevant console or network evidence when those are exposed, use controlled data in the authorized environment, and do not send real messages, submit payments, delete records, or change shared accounts merely to test a control, because the test action is real in a shared system.

<example>
A checkout is exercised with the provider's test card in the staging environment, and the console and the `POST /api/orders` response are read.
</example>

If startup or browser access is unavailable, finish the independent checks and state the exact behavior or appearance that is unverified, and do not report a browser check that rests on reading source, because reading code is not observing it. Treat a missing credential or a refused tool as a prerequisite to resolve and not as a reason to build an increasingly complex substitute.

<example>
"Unit tests and typecheck pass, but the dev server would not start without `DATABASE_URL`, so the modal's focus behavior is unverified."
</example>

## Select realistic scenarios by the change

For a narrow styling fix, compare the original and changed region with long content at narrow and wide widths, and confirm that unrelated layout, behavior, and data requests remain unchanged, because a local style change often shifts its neighbors.

<example>
After changing `.badge` padding, load a 60-character product name at `360px` and `1440px` and confirm that the surrounding grid and the network panel look as before.
</example>

For every other kind of change, run the closing check of each reference that applies, which covers transitions for state and forms, direct entry for routing, cold load for hydration, keyboard-only use for controls and overlays, the repeated measurement for performance, the boundary check after structural edits for architecture, and the safe boundary check for browser security, because each class of defect shows up only under its own scenario. Treat these as conditional checks and not as a reason to expand every task into a full application audit.

<example>
A change to the orders search that also touched the URL runs the transitions check and the direct-entry check and skips the performance check.
</example>

## Inspect what automated tests miss

Check a width near each affected layout transition and not only a phone and a desktop preset, inspect zoom, long labels, missing media, reduced motion, and existing themes when they are relevant, and match screenshot dimensions and content before comparing visual results, because layouts break just before their breakpoints and screenshots of different sizes or data cannot be compared.

<example>
With a breakpoint at `768px`, check `767px`, `768px`, and `1024px`, and compare screenshots taken at the same `1280x800` viewport with the same data.
</example>

Review the final diff for unrelated redesign, placeholder behavior, suppressed failures, obsolete code, and accidental configuration changes, rerun the checks that a later edit affects, stop when the requested result and the relevant checks pass, and report only the result and the material limitations, because a leftover stub or a stale check passes review and fails in use.

<example>
A diff review finds a `vite.config.ts` port changed during debugging and a stubbed `fetchUser()`, so both are reverted and `npm run test` is rerun.
</example>
