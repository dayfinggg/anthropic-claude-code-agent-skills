# Queue consumers and backlog recovery

## Establish the actual delivery contract

When changing a producer or consumer, inspect the configured delivery, retention, acknowledgment, lease, and batch-failure behavior and do not assume every broker or event source has the same guarantees, because SQS standard queues, for instance, can redeliver a message even after deletion, and durable application state must tolerate the delivery behavior actually in use.

<example>
Before adding a consumer on an SQS standard queue, compare the queue's 30-second visibility timeout with the handler's 45-second p99 and raise the timeout, because a second consumer would otherwise receive the message while the first is still working.
</example>

For redeliverable work, acknowledge after the defined durable completion boundary and deduplicate by a stable business operation or producer message ID, because a delivery-attempt ID or shared correlation ID may not identify the intended effect, while naturally duplicate-safe semantics can avoid explicit deduplication storage. Later acknowledgment increases redelivery after slow work or crashes and earlier acknowledgment can lose unfinished work, so choose an explicit handoff boundary and not merely a success return from the handler. Check a crash after effect commitment but before acknowledgment, a lease expiring during work, and one failed batch item, and verify completed items do not produce another harmful effect.

<example>
A worker deletes the SQS message only after the `invoice_sent` row is committed and deduplicates on `invoice_id`, not on `ReceiptHandle`, which changes on every delivery.
</example>

## Require order only where the business needs it

When operations depend on prior state, define the ordering scope, usually an object or business key, and keep dependent work sequential within it, because a FIFO group provides order within that group and not across independent groups, and parallel handler execution can still violate that order. Strict ordering limits parallelism and can block a hot key behind one failed message, while commutative operations may permit more concurrency without a global queue. Check out-of-order create and cancel events and concurrent workers for one key, and for Lambda FIFO batches stop after the first failure and report failed and unprocessed items as required.

<example>
Events for order 7731 use `MessageGroupId=order-7731`, and the Lambda handler stops at the first failed record and returns it and every later record in `batchItemFailures`.
</example>

For versioned replacement events, ignore stale versions, and for delta events or missing prerequisites wait, repair, or reject instead, because discarding an increment that merely looks old loses a real change and unsynchronized clocks do not establish causal order. Check repeated deltas and equal timestamps.

<example>
`profile.updated` with `version: 12` is dropped when version 14 is already stored, while `balance.delta -5` that arrives before its `account.opened` is parked for retry.
</example>

## Give poison messages a deliberate disposition

When a message repeatedly fails, distinguish transient dependency failure from permanently invalid or incompatible input, bound redelivery by the project's attempt and age policies, and quarantine, reject, or route failures through the broker's supported mechanism with a recoverable business identity and an actionable failure reason, because silently dropping unresolved monetary or state-changing work loses it without a trace.

<example>
A `send_push` job whose payload fails schema validation on three attempts goes to `push-dlq` with `device_id`, `campaign_id`, and the validation error, while a `503` from the push gateway keeps retrying with backoff.
</example>

For strict ordered processing, decide between pausing the affected key, repairing the message, or an explicitly authorized skip before moving a failed message aside, because SQS explicitly warns that a FIFO dead-letter queue can break exact operation order when later operations depend on the failed one.

<example>
When `cancel` for order 7731 fails permanently, the consumer pauses group `order-7731` and alerts, because letting the later `refund` run would apply it to an order that is still active.
</example>

Give quarantined messages an owner, a retention period, and a replay plan that preserves identity and authorization, because a dead-letter queue is not automatic successful recovery and replay can repeat work or exceed the original permissions. Check a permanently invalid message, a dependency outage, retention expiry, and replay after repair, and confirm the selected policy preserves order and does not repeat completed side effects.

<example>
A runbook says `scripts/dlq_replay.py` re-enqueues messages with their original `message_id` and `tenant_id` inside the queue's retention period, so already completed ones are deduplicated.
</example>

## Recover without overwhelming dependencies

When producers can outrun consumers, bound in-flight work against downstream capacity, track backlog age as well as depth, and estimate recovery from spare processing capacity and not from total capacity already serving new work, because more consumers can worsen a slow dependency's overload. Use workload isolation when shared resources need fairness, accepting the extra queues or scheduling complexity it adds. Check a prolonged dependency slowdown and recovery with a backlog while new work continues, and verify bounded memory and concurrency.

<example>
A geocoding worker caps concurrency at 8 to match the provider's rate limit and alerts on oldest message age above 10 minutes, and a backlog of 6,000 messages at 10 messages per second capacity with 8 per second of new arrivals drains at 2 per second, which takes 50 minutes.
</example>

Choose admission control, delayed delivery, prioritization, or stale-work expiry according to business semantics, because payments cannot be discarded like obsolete recomputable refreshes, and backpressure protects capacity but may reject valuable new work. Check the chosen fairness policy and that unaffected work still makes useful progress.

<example>
During a backlog, `refresh_thumbnail` jobs older than an hour are dropped while `charge_card` jobs stay queued at their priority.
</example>
