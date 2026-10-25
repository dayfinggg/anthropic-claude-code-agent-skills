# Discovery

## Find the actual problem

When a request names a broad solution, identify the event that creates the need, trace what the user does today and where that workflow fails, and separate the desired improvement from the suggested mechanism while keeping explicit requirements in the plan instead of replacing them with a smaller idea, because a plan that solves a neighboring problem passes its own checks and still disappoints the user.

<example>
"Add a Redis cache" traces back to a dashboard query that takes 8 seconds after the nightly import, so the plan names that query as the problem and still includes the cache the user asked for.
</example>

Extract the intended users, the observable result, the existing constraints, and the requested destination, tell an implementation request apart from a request for advice or a plan, and treat supplied deadlines and budgets as constraints and not as estimates of the work, because a deadline says when the user needs the result and nothing about how long it takes.

<example>
"Need this by Friday, can you plan the SSO rollout" is a plan request with a Friday constraint, and the plan states whether its stages fit before Friday instead of assuming they do.
</example>

Before asking a question, classify the gap. Investigate repository facts through the available files and tools, ask one focused question with the consequential trade-off when a product choice changes acceptance, and for a low-risk reversible detail choose the existing convention and state the assumption when it matters, because a question about something the code already shows costs the user a turn and a vague question gets a vague answer.

<example>
The date format in exports is read from `settings.DATE_FORMAT` and not asked about, while "should archived orders appear in the export?" is asked once, with the note that totals will then differ from the dashboard.
</example>

## Turn intent into acceptance

When language is vague, replace adjectives with observable behavior before decomposing implementation, writing each criterion as a starting condition and action, a visible result with any persistent state change and who or what observes it, the failure, boundary, or concurrent-use cases that could invalidate that result, and the existing behavior that must stay unchanged, because an adjective such as "fast" or "secure" cannot fail a check.

<example>
"Make the import faster" becomes "importing the 50,000-row `customers.csv` finishes below the current 40 s median, and rejected rows still appear in the error report".
</example>

Assign each criterion a feasible check with its expected result, and use existing test names, commands, and thresholds only after inspecting them, because a check recalled from memory may not exist or may not observe the claimed result.

<example>
Criterion 3 points to `pytest tests/test_import.py::test_rejected_rows` only after the file is opened and the test is seen to assert the contents of the error report.
</example>

For performance claims, identify the operation, workload, baseline, measurement environment, and required threshold, and seek evidence or a material decision when the target is unspecified instead of inventing a number, because a made-up threshold makes the plan look measurable while measuring nothing relevant.

<example>
"Search should be quick" prompts a question about the 95th percentile latency target for `GET /search?q=` on the 2 million product catalog, and the criterion stays unresolved until it is answered.
</example>

When requirements individually seem reasonable, check their combined effect for contradictory permissions, impossible ordering, incompatible limits, and undefined states, resolve contradictions before scheduling dependent work, and leave a criterion explicitly unresolved if the necessary product fact is unavailable, because stages built on contradictory requirements cannot all pass.

<example>
"Admins can delete any invoice" conflicts with "invoices are kept for seven years for audit", so the plan asks which one wins before scheduling the delete endpoint.
</example>

## Map the current path

When changing an existing system, trace the relevant path before proposing files, starting at the entry point that receives the action, request, event, or scheduled trigger and following decisions and state changes through the involved modules, stores, jobs, and external systems, because a file list guessed from names misses the path that actually runs.

<example>
For "add a discount code", start at `POST /checkout` in `routes/checkout.py`, follow it into `pricing.apply_totals()`, and note the `orders` row and the receipt job it writes.
</example>

Search callers and consumers in the reverse direction, including generated uses, configuration, templates, and background paths that can reach the changed behavior, and locate the tests and operational evidence that describe today's behavior, naming missing coverage and unavailable environments instead of treating them as proof of safety, because a change that is safe for the callers you found can still break the one you did not.

<example>
Searching for `apply_totals(` also finds a nightly `reconcile_orders` job and a Jinja receipt template that read the same field, and the plan notes that no test covers the job.
</example>

Keep only the paths and relationships needed to explain the change, distinguish observed behavior from comments, old documents, and assumptions, and mark the coverage unknown when external consumers cannot be inventoried locally, because a plan padded with unrelated paths hides the ones that matter and a claimed full inventory gives false assurance.

<example>
The plan lists the three modules on the checkout path, says the README's description of the receipt flow does not match the code, and marks third-party clients of `/orders` as unknown.
</example>

## Bound the requested change

Partition findings into required outcomes, necessary prerequisites, and non-goals, include a prerequisite only when a named acceptance criterion cannot pass without it, and leave neighboring cleanups and speculative improvements outside the plan, because every extra item adds review effort and risk to a change the user did not ask for.

<example>
Upgrading the date library is listed as a prerequisite only if `test_export_range` cannot pass with the installed version, and the unrelated tidy-up of `utils.py` is a non-goal.
</example>

When scope exceeds a supplied limit, identify which outcome or constraint must change and present the trade-off instead of silently dropping acceptance criteria, and keep the plan's shape driven by the request instead of a borrowed cycle length or document template, because a dropped criterion is a surprise at review, a stated trade-off is the user's decision, and a template answers its framework's needs and not the request's.

<example>
With a one-week limit, the plan says that SSO login fits and group sync does not, and asks whether to extend the limit or defer group sync.
</example>

Finish discovery when each required outcome has a known path, a verification method, or an explicit unresolved dependency, and investigate further only if the next safe action depends on that information, because exploration without a stopping condition delays a plan that is already good enough to act on.

<example>
Once the export path is traced and the one open item is whether the mail relay accepts attachments, discovery stops and the plan carries that item as a conditional dependency.
</example>
