# UI and performance

## Verify browser behavior

When a change affects interaction, rendering, focus, or navigation, exercise it in the actual application and browser, choosing the affected viewport, input method, and supported browser risks, because DOM construction or a successful build does not show that a user can complete the interaction. Check the visible outcome and the relevant request or state change through the real path.

<example>
A new mobile menu is tested at `390x844` by tapping `Menu`, checking that focus lands on the first link, and following that link to the next page.
</example>

When locating controls, prefer accessible roles, labels, and explicit stable test contracts the project supports, and narrow the scope when several controls match, because positional selectors and generated CSS classes break on unrelated layout changes. Check that the locator identifies the intended control and that the action is actually possible.

<example>
`page.getByRole("dialog").getByRole("button", { name: "Save" })` replaces `div.css-1x2y3z > button:nth-child(3)`.
</example>

When UI work completes asynchronously, use the runner's awaited, retrying assertions and actionability checks, and wait for the meaningful result and not a delay or generic network inactivity, because a fixed delay is either too short or wasteful, and removing the assertion, forcing an impossible click, or raising global timeouts hides a missing transition. Check the success, relevant error, and repeated-action paths the change affects.

<example>
After clicking `Submit`, `await expect(page.getByText("Order placed")).toBeVisible()` replaces `waitForTimeout(3000)`, and a second click on `Submit` is checked to create no second order.
</example>

When testing UI presentation independently, stub only the external responses that lie outside that test's claim, and keep the real application boundary for a submission or assembly defect, because a mocked successful response proves nothing about whether the server persisted the data. Check the backend effect separately or through the complete critical journey.

<example>
A table-layout test stubs `GET /api/orders` with 3 rows, while the checkout test posts to the real test server and then reads the order back.
</example>

When a browser test fails intermittently, inspect the first useful trace, DOM state, and relevant network failure, and protect credentials and user data before sharing artifacts, because traces and screenshots often hold session tokens and personal data. Reproduce the discrepancy under comparable browser and OS conditions and decide whether it reflects intended behavior before updating a visual baseline, because a baseline refreshed just for changed pixels accepts the regression.

<example>
A screenshot diff that appears only in CI is reproduced in the same container image first, and the trace is shared with the `Cookie` header removed.
</example>

## Verify measured performance

When performance is the reported failure or an explicit acceptance condition, define the workload and metric before optimizing, tell user-visible latency, throughput, CPU cost, and memory behavior apart, and verify correctness under the same workload before interpreting timing, because a faster unit benchmark does not prove a faster end-to-end request and a fast wrong answer is not an improvement.

<example>
For "search is slow", fix the workload at 50 concurrent requests for `q=shoes` against 100,000 products and measure p95 latency of `GET /search`, not the runtime of `rank()` alone.
</example>

When comparing a baseline and a candidate, match input sizes, data distribution, concurrency, build mode, cache policy, and environment, use the existing benchmark facilities under representative warm or cold conditions, and include the setup work that belongs to the user's latency, because differences in machine or conditions can outweigh the change. Check that the timed work is awaited, executed, and not optimized away.

<example>
Both runs use the release build on the same machine with a cold cache, and the benchmark loop passes `result` through `std::hint::black_box` (or the harness's equivalent) so the optimizer keeps the call.
</example>

When measurements are noisy, repeat comparable runs, report their spread with the chosen central or tail statistic, and interleave baseline and candidate runs when supported, because time-dependent drift otherwise favors whichever ran second. Avoid choosing the fastest sample or setting arbitrary millisecond thresholds, because both turn noise into a verdict. Call an improvement real only when it exceeds the observed noise and matters for the acceptance condition, and otherwise report the comparison as inconclusive.

<example>
Ten alternating runs give a median of 212 ms against 205 ms with a spread of 15 ms, so the report calls the difference inconclusive.
</example>

When load or stress is needed to expose the concern, bound traffic, duration, and resources within the authorized environment, and stop if the environment cannot safely support the experiment, because load against production, disabled host security, or changed machine-wide settings can cause outages beyond the test. Describe the result as covering the exercised load and topology and not as universal capacity.

<example>
A 5-minute ramp to 200 requests per second runs against `staging` only, stops when database CPU reaches 90 percent, and reports capacity for that topology.
</example>
