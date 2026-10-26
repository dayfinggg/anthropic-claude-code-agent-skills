# Risk and alternatives

## Compare only consequential options

When multiple approaches satisfy the request, first check whether the user or project has already settled the choice, and reopen it only when new evidence invalidates a material assumption, so that planning does not become an unsolicited architecture redesign, because relitigating a settled decision costs the user a debate they already had.

<example>
The repository already manages schema changes with Alembic, so the plan adds an Alembic revision and does not weigh raw SQL scripts.
</example>

Compare the smallest compatible change with the other genuinely viable approach, include the current workaround when deciding whether an expansion is necessary, and for each option check acceptance coverage, affected consumers, operational burden, reversibility, and delivery dependencies. Use measured costs where available and label judgments and unknowns instead of manufacturing scores, because a numeric score for a guess hides that it is a guess.

<example>
For "show live order status", compare polling `GET /orders/{id}` every 10 seconds with adding WebSockets, noting that polling already works through the existing proxy and that WebSocket support in that proxy is unknown.
</example>

Reject an option when it cannot meet a hard constraint, prefer among the rest the one that satisfies acceptance with less irreversible work and fewer unsupported assumptions, and ask the user only when the remaining trade-off changes their requested outcome or commitment. Keep the rationale short enough to say what would change the decision, because a long justification buries the one fact that would flip the choice.

<example>
A hosted queue is rejected because the data may not leave the VPC, and of the two in-house options the one reusing the existing `jobs` table wins unless expected throughput exceeds what its polling can serve.
</example>

## Find the assumptions that can break the plan

Walk the intended workflow from beginning to end, and at each handoff check what must be true for the next action to work, looking for unfamiliar integrations, unverified data shapes, inaccessible dependencies, and presumed compatibility, because the failures that sink a plan sit at handoffs nobody exercised.

<example>
In "upload, parse, store, notify", the handoff from parse to store assumes the parser's `date` field is ISO 8601, and a sample file from the vendor shows it is not.
</example>

Prioritize an unknown by its consequence, the work it could invalidate, and the latest point at which it can be resolved safely, investigate a potentially fatal dependency before polishing routine work, and let minor uncertainties travel with their increments, because resolving a fatal unknown late wastes the work built on it while waiting for trivial ones stalls the whole plan.

<example>
Whether the partner API allows 50 requests per second is checked before building the sync UI, while the wording of the empty-state message waits.
</example>

## Define a bounded spike

When documentation and inspection cannot settle a consequential assumption, specify a focused investigation instead of a vague research phase. State the question and which option or dependent increment it controls, and choose the smallest permitted observation or experiment that could distinguish the outcomes, because a spike without a controlled decision produces findings nobody uses.

<example>
"Can the vendor sandbox return refunds within one second?" controls the choice between synchronous and queued refunds, and is answered by one timed test call to `/refunds`.
</example>

Define the evidence for success, failure, and an inconclusive result before starting, and bound the effort with the supplied budget or an explicit stopping condition, naming the next decision for each possible result, because evidence interpreted after the fact bends toward the answer someone hoped for.

<example>
Under 1 s selects synchronous refunds, over 5 s selects queued refunds, anything between or a timeout triggers a narrower question about rate limits, and the spike stops after an hour either way.
</example>

During planning-only work, perform permitted read-only investigation and propose any experiment that writes or changes behavior, and during authorized implementation, isolate experimental changes from deliverable behavior and avoid live side effects, because a prototype left in the code, even a failed one, becomes an accidental dependency.

<example>
In a plan-only session, read the vendor's API docs and the `client.py` wrapper and propose the sandbox call, while in an implementation session put the probe in the session's scratch directory outside the repository and delete it afterwards.
</example>

If the spike cannot reach the necessary system, name the missing access, data, or environment and keep dependent increments conditional, and treat an unrelated mock result as no evidence about the real dependency, because a mock only returns what it was written to say.

<example>
With no sandbox credentials, the plan states "refund latency unverified, needs `VENDOR_SANDBOX_KEY`" and keeps the synchronous-refund increment conditional, rather than asserting latency from a stubbed response.
</example>

When the investigation resolves the question, stop it and update the affected choice and sequence. If it is inconclusive, narrow the question, choose a different viable option, or surface the exact decision needed, instead of widening it into open-ended exploration, because the spike exists to unblock a decision and further findings add cost without changing the plan.

<example>
The test call returned in 400 ms, so the spike ends and the plan picks synchronous refunds, while a timeout leads to a narrower question about the sandbox's rate limit.
</example>
