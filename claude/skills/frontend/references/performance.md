# Performance

## Measure the user's slow operation

Identify the affected route, interaction, data size, device class, and network condition, establish a baseline before optimizing, and separate transfer time, server delay, main-thread work, rendering, and paint with the browser's trace and network tools when they are exposed, because source length or a dependency's reputation does not locate a bottleneck.

<example>
Record a performance trace of opening `/orders` with 5,000 rows at 4x CPU slowdown and note the scripting time before changing anything.
</example>

Compare equivalent build modes and conditions, record the relevant measure while working, and add a benchmark artifact or monitoring service only when the task needs one, because development instrumentation and hot reload are not production performance.

<example>
Timings come from `npm run build && npm run preview` before and after the change and not from the dev server.
</example>

## Interpret metrics accurately

Use the published good thresholds as user-experience guides and not as budgets for every request or component, namely LCP at most `2.5 s`, INP at most `200 ms`, and CLS at most `0.1`, assessed at the `75th percentile` and segmented across mobile and desktop, because they describe field experience of a page. Check the current published values when reporting against them.

<example>
A component that renders in `300 ms` is not "failing INP", since INP is judged on the page's interactions in field data.
</example>

Report a local navigation score as a local result and not as a real-user field result, exercise interactions to investigate responsiveness, and do not report a proxy metric or one handler's duration as measured field INP, because a good aggregate score does not prove that the changed flow works.

<example>
"Local Lighthouse LCP is 1.9 s and no field data was available" replaces "LCP passes".
</example>

## Fix the measured cause

For slow main-content loading, inspect discovery, request priority, transfer duration, and render delay, keep the actual LCP resource discoverable early and not lazy-loaded, and use higher fetch priority or preload only for the identified resource, because prioritizing everything creates contention and not priority.

<example>
The hero `<img>` loses `loading="lazy"` and gets `fetchpriority="high"`, while the other images in the carousel stay lazy.
</example>

Serve assets at their displayed size in supported formats, reserve space for images, embeds, and late content before they arrive, and inspect layout shifts after interaction and delayed loading and not only in the initial screenshot, because removing a placeholder shifts content just as inserting new content does.

<example>
An ad slot gets `min-height: 250px`, each `<img>` carries `width` and `height`, and the cookie banner that collapses after consent is checked for the shift it causes.
</example>

For a slow interaction, distinguish delay before handlers, work inside handlers, and delay before the next paint, keep the immediate visible update small, defer or split genuinely heavy work when the trace supports it, use a documented yielding mechanism, and avoid alternating layout reads and writes, because not every asynchronous callback lets a browser paint and interleaved reads force repeated layout.

<example>
A filter click first updates the checked state, then yields before the 400 ms list recompute, and the code reads `offsetHeight` for all rows before writing any styles.
</example>

For data-dependent slowness, inspect duplicated requests, sequential fetching, decoding cost, and repeated transformations, reuse the established loader or cache and not a new caching layer, remove unnecessary derived-state updates before adding memoization, and check that an optimization does not retain stale inputs, because memoizing over a wrong data flow hides the problem and can return stale results.

<example>
Two components that both fetched `/api/me` share the existing `useUser()` query, and the list is sorted once in a selector and not in each row.
</example>

## Scale collections without breaking interaction

Choose pagination, incremental rendering, or virtualization from measured cost and the product's navigation needs and not from an arbitrary item count, weigh find-in-page, selection, focus retention, screen-reader access, printing, and row identity, and verify what happens when a focused item leaves the rendered window, because rows removed from the DOM break each of those.

<example>
A 300-row table that renders in 40 ms stays a plain table, while a 20,000-row log is virtualized and keeps the focused row mounted when it scrolls out of view.
</example>

Introduce memoization, workers, containment, and code splitting for a demonstrated bottleneck and not as a checklist, keep a small fast operation simple, avoid making the initial route download every optional feature, and do not split critical content into unnecessary loading stages, because each technique carries complexity and lifecycle costs.

<example>
The rarely used chart editor moves behind a dynamic `import()` triggered on click, while the header, the first table page, and the main navigation stay in the initial bundle.
</example>

## Verify the improvement and its trade-offs

Repeat the same slow interaction and data scenario, compare the relevant timings or trace and not only a total score, check empty and failure states, keyboard focus, and navigation afterwards, and report the measured local result accurately while saying what field evidence is unavailable, because an optimization can fix one metric and break focus retention.

<example>
"Scripting time for opening `/orders` fell from 1.8 s to 0.6 s in the production build, focus after sorting still lands on the header, and no field data was available."
</example>
