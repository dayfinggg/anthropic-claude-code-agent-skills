# Effects, atomicity, and concurrent state

## Identify the business operation

When duplicate execution would be harmful, define which intended action is the same operation, and prefer naturally idempotent semantics where they match the business rule, because transport deduplication and business-effect idempotency are different guarantees. Setting membership can be repeated safely while incrementing a counter usually cannot, and natural idempotency avoids a deduplication store but can change product semantics.

<example>
A `PUT /accounts/42/low-stock-alerts` request sets `enabled = true` and is safe to repeat, while `POST /accounts/42/credits` with `amount: 5` needs an operation identity because repeating it adds another 5.
</example>

For explicit keys, scope identity to the caller and operation, reuse the key for retries and not for a new intent, compare relevant parameters and reject a mismatched reuse with `422` and a retry that arrives while the first call is still running with `409`, and specify retention and late-arrival behavior instead of choosing an arbitrary cache TTL, because identical payloads do not necessarily mean identical intent. Explicit keys retain intent at the cost of durable state and a finite replay horizon. Check two intentional identical purchases with different keys and simultaneous retries with the same key, including a changed amount or currency and replays before and after retention expires.

<example>
Key `ord-7731-pay` first used with amount `1999` arrives again with `2999`, and the server returns `422 key_reused` instead of the stored result of the first call.
</example>

## Close local crash gaps atomically

When deduplication and the business mutation share one durable store, coordinate their atomic boundary with `database` and record the operation claim, local effect, and recoverable outcome together, because a separate "seen" write can lose work, an effect followed by a separate completion write can repeat it, and a process-local flag cannot protect multiple workers. Check crashes before commitment, after commitment but before the response, and during claim recovery, and with concurrent duplicates verify one local effect and a defined outcome for every caller.

<example>
The Rails payment webhook inserts the provider's `event_id` into `processed_events` with a unique index in the same transaction that marks the invoice paid, so a redelivery after a `500` changes nothing.
</example>

When work has an in-progress state, define who owns it and how abandoned work is recovered, and replay only after confirming the previous worker is gone, not because a cache entry vanished, because expiring ownership is not proof that the previous worker stopped. Returning a stored outcome reduces ambiguity but requires retention and compatibility handling.

<example>
A claim row stuck in `processing` for over 10 minutes is taken over by a recovery job only after it asks the provider for that operation's result, so a slow worker that is still running does not get a second copy.
</example>

## Treat remote success as independent of local rollback

When an external mutation lies outside local atomic state, verify the receiver's idempotency and lookup contract, persist a stable operation identity, and reuse the receiver's key across attempts, because a local transaction cannot undo a completed payment, email, or remote update, and a local "completed" flag cannot bridge a crash after remote success. Check provider API versions, including whether failed results are replayed or unfinished work is retried. Check remote success followed by a lost response and a crash before local result persistence, and confirm a second worker recovers the same operation without another external effect.

<example>
A Python checkout service writes `payment_attempts.idempotency_key` before calling the payment provider and sends it as the `Idempotency-Key` header on every retry, so a crash after the card was charged resumes with the same key.
</example>

When no safe receiver mechanism exists, reconcile uncertain outcomes by an authoritative lookup before retrying, including after an idempotency window has expired, because a fresh key turns an uncertain result into a possible second business effect, and authorization for one mutation does not cover an additional one. Stopping on uncertainty sacrifices availability for effect safety, and reconciliation needs durable identity and an authoritative lookup instead of a guess from similar-looking records.

<example>
A refund call that timed out is looked up with `GET /refunds?order_id=7731` before any new refund is issued.
</example>

## Use an outbox for a required state-and-event boundary

When committing local state must reliably cause a later message, commit the state and the publication intent atomically, coordinating an outbox or supported change-capture mechanism with `database`, publish committed intent through a recoverable relay, and mark intent delivered only after publication succeeds, because a direct publish after commit is lost by a crash and a delivered mark set too early loses the event. Check rollback before commit, a crash after commit before publication, a crash after publication before marking success, and partial batch success, and verify no event for aborted state and no harmful effect from repeated publication. Check capture-log retention during an extended relay outage.

<example>
A Node.js service writes the `orders` row and an `outbox` row for `order.paid` in one transaction, and a relay publishes rows `where sent_at is null` and sets `sent_at` afterwards.
</example>

Keep consumers duplicate-safe, give a consumer's local deduplication and local effect their own atomic boundary, preserve required per-object sequence through relay concurrency, and inspect each batch item's result before marking that intent delivered, because publication can succeed before the relay records success, an outbox does not make an arbitrary downstream payment exactly once, and an SQS batch can contain failures despite an HTTP `200` response.

<example>
A relay that sends ten events in one batch marks only the nine entries reported as successful and leaves the tenth for the next run.
</example>

Adopt an outbox for a real dual-write guarantee and not as a reason to introduce events or microservices, because it costs eventual delivery, retained state, a relay to operate, and cleanup.

<example>
A Django store that only needs a receipt email after saving an order keeps a `pending_emails` table read by a cron-run management command and adds no event broker.
</example>

## Protect shared state with the right atomic condition

When stale writes could lose another caller's work, enforce a version precondition at the mutation boundary, using strong `ETag` and `If-Match` for HTTP representation updates where the contract supports them and `If-None-Match: *` for create-only behavior, because a failed precondition leaves the mutation unapplied, while an idempotency key prevents repeats of one operation and not conflicts between distinct operations. Version checks introduce conflicts and recomputation, so choose based on the invariant and measured contention. Check two writers using one version and competing reservations.

<example>
Two admins edit `/api/products/42`, and the second `PUT` sends `If-Match: "v7"` after the first moved the product to `v8`, so it gets `412` and its edit does not overwrite.
</example>

Coordinate multi-object invariants and conflict retries with `database`, and treat a local mutex as covering one process only, because a transaction's isolation level may still permit invariant violations and other replicas do not see the mutex. Serialization can reduce concurrency or block progress, so choose it from the invariant and measured contention.

<example>
A seat-booking Next.js app on three instances prevents double booking with a unique constraint on `(show_id, seat)`, not with an in-memory mutex.
</example>

If a distributed lease protects correctness, make the protected resource reject stale ownership with fencing or an equivalent supported atomic condition, because checking expiry immediately before writing leaves a gap in which a paused worker resumes and writes. A lock that only avoids cheap repeated computation needs no correctness-level machinery. Check a worker resuming after its lease expires and verify that the losing or stale worker cannot commit its effect.

<example>
Each lease grant increments `fence_token` and the write is `UPDATE jobs SET ... WHERE id = ? AND fence_token = ?`, so a worker that paused past its lease updates zero rows, while a lock around a cached homepage rebuild needs no fencing.
</example>
