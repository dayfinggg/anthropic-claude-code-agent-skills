---
name: backend
description: Implements server-side behavior such as APIs, service integrations, background jobs, queues, and streaming. Use when a change touches contracts, remote failures, retries, duplicate effects, or concurrent updates. Storage tuning belongs to database.
---

# Backend

These rules decide how server-side behavior is traced, changed, and verified. The references hold the decision guides for each branch.

Keep the project's protocol, framework, deployment shape, and conventions unless the task requires changing them, and add REST, GraphQL, microservices, queues, retries, or new layers only when the task needs them, because each one brings operating and compatibility obligations the project did not have.

<example>
A Rails app that needs a nightly stock export gets a cron-run task `rake export:stock`, not a message broker.
</example>

Before editing, trace the affected entry point through callers, authorization, state changes, external effects, and completion reporting, inspect schemas, client assumptions, worker settings, SDK behavior, and tests, and settle what must remain true after a timeout, duplicate, crash, or concurrent call and encode it in the plan step or a test, because a design that holds only on the happy path fails at the first retry. Resolve a consequential contract difference between the two sides before implementing both.

<example>
For a payment webhook handler that captures a card through a provider SDK, read the webhook route, the SDK's timeout and retry settings, and the proxy's idle limit, then settle what must hold when the capture times out after the provider already charged the card and encode it in a test for that path.
</example>

Treat the ability to edit code as separate from authority to run live charges, sends, deployments, or job replays, and verify the authorized target, scope, and replay safety before an external mutation, with failure tests running against isolated fixtures, because a retry test that reaches the real provider repeats a real charge or message.

<example>
Test the retry path of `captureCharge` against the provider's sandbox account and its test cards, not the live merchant account.
</example>

Hand storage mechanics to `database`, security design to `security`, and structural redesign to `architecture`, because this skill covers behavior at the service boundary and those skills hold the detailed checks.

<example>
A slow `GET /orders` caused by a missing index goes to `database`, while its pagination contract stays here.
</example>

Update maintained documentation that the change makes inaccurate, because readers and operators act on what the document says.

<example>
After adding a `cursor` parameter to `GET /api/orders`, update `docs/openapi.yaml` and the curl sample in `README.md`.
</example>

## References

Choose the references that apply before the dependent work and read each one, because each holds the checks for its branch. Leave the others unread so unrelated guidance stays out of context, and run the checks that challenge the guarantee the change touches, not every check in a guide.

- For API evolution, pagination, errors, authorization boundaries, or transport adapters, read [API contracts](references/contracts.md).
- For monetary values, timestamps, schedules, or elapsed time, read [values](references/values.md).
- For remote calls, retry budgets, deadlines, or cancellation, read [execution](references/execution.md).
- For duplicate effects, uncertain outcomes, transactions, outbox delivery, or concurrent writes, read [idempotency](references/idempotency.md).
- For delivery guarantees, ordering, poison messages, or backlog recovery, read [messaging](references/messaging.md).
- For large or continuous responses, slow consumers, duplex calls, or reconnects, read [streaming](references/streaming.md).

<example>
A `POST /shipments` handler that books a courier through a carrier API and streams tracking updates back calls for execution (timeout and retry budget), idempotency (the client resubmits after a dropped response), and streaming, but not values or messaging.
</example>
