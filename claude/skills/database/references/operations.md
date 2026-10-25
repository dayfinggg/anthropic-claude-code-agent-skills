# Retention, replication, and recovery

## Retain and delete according to the actual policy

Before choosing a purge mechanism, establish the required retention boundary, deletion exceptions, archive needs, and restore behavior, and distinguish hiding a row from deleting it and from removing its copies, because caches, derived indexes, CDC sinks, replicas, and retained backups all hold copies that the lifecycle design must cover. Do not invent a retention period or infer deletion permission from a storage-cost question. Check the supplied policy with boundary records and downstream consumers.

<example>
A report that the `access_log` table has grown to 80 GB gets the question "which retention applies" and a list of its copies (replica, nightly dump, search index), not a `DELETE`.
</example>

For a small purge, evaluate a bounded indexed delete, and for a very large time-based lifecycle evaluate partition retirement only if the partition boundaries match the policy, because dropping a partition avoids row-by-row deletion while its locks and dependencies still matter. Detaching preserves a separate table, so it is not erasure. Do not repartition solely to make a hypothetical cleanup easier. Check pruning, allowed boundary values, references, and remaining copies before any authorized removal.

<example>
Expired `sessions` are removed with `DELETE ... WHERE expires_at < NOW() LIMIT 5000` in a loop, while a monthly-partitioned `access_log` retires its oldest month with `DROP PARTITION` after the policy confirms that month.
</example>

After PostgreSQL deletes, distinguish reusable internal space from space returned to the operating system, because ordinary vacuum normally makes space reusable without shrinking the file, while a table rewrite or `VACUUM FULL` needs a restrictive lock and extra disk. Do not propose a rewrite just because the file did not shrink. Check dead rows, space pressure, long snapshots, and maintenance behavior first.

<example>
After deleting 90 percent of `access_log`, `n_dead_tup` in `pg_stat_user_tables` and an old open transaction explain why the file stays large, and the first fix is ending that transaction, not `VACUUM FULL` on the live table.
</example>

Treat DynamoDB TTL as asynchronous cleanup and not as an exact expiry or authorization deadline, because an expired item may remain readable until deletion. If expired data must not be used, enforce that condition in the application's read or write contract, and check expired-but-present items, delayed cleanup, and downstream deletion handling instead of assuming every derived copy disappears at the same time.

<example>
Every read of a `reset_tokens` item compares `expires_at` with the current time, because the TTL deletion can lag well behind it.
</example>

For soft deletion, specify whether deleted identities may be reused and whether related rows remain reachable, because a deleted row still occupies a unique key and still matches unfiltered queries. Do not select soft deletion merely as a substitute for recovery, since a later restore can reintroduce previously deleted data. Check uniqueness and ordinary query filters on every relevant path, and validate the required reconciliation before reopening restored data.

<example>
With `products.deleted_at`, the unique key on `(tenant_id, sku)` rejects a new product that reuses a deleted SKU, and the storefront search query that forgot `deleted_at IS NULL` still lists the deleted product.
</example>

## Match replica reads to the consistency contract

Before routing reads to a replica, identify primary and replica roles, replication mode, lag, and failover behavior, because asynchronous replicas can miss a just-committed change. For a required read-after-write result, route to an authoritative or sufficiently current view or wait for a verified replication position, since a fixed sleep is not evidence of catch-up. Check with a deliberately delayed replica and with failover between write and read.

<example>
After a user saves their profile in a mobile app, the next `GET /me` reads from the primary for that session, while other users' profile views read from the replica.
</example>

In PostgreSQL, distinguish acknowledgment of receipt, durable flush, and replay, because a synchronous commit setting does not automatically make every replica current, and `remote_apply` concerns the selected synchronous standbys and not every node in a read pool. Do not treat a zero-looking lag metric as a universal consistency proof, and do not weaken durability settings just to improve a benchmark. Check the exact target and position.

<example>
`synchronous_commit = remote_apply` with `synchronous_standby_names` naming `replica1` makes `replica1` current at commit, while reads sent to `replica2` can still be behind.
</example>

Check whether long-running reads, replica feedback, or inactive slots retain resources on the source, and observe retained log volume and consumer progress, because an abandoned slot keeps logs until the disk fills. Do not drop a slot or advance a consumer checkpoint merely to free disk before establishing whether that loses the only resumable history and how resynchronization would work. Check the supported failover behavior for the installed engine and connector versions.

<example>
`pg_replication_slots` shows `search_indexer` inactive and retaining 40 GB of WAL, so the first step is finding out whether the consumer can resume or must re-snapshot, not `pg_drop_replication_slot`.
</example>

## Preserve CDC correctness across replay and schema change

Use CDC or an outbox only when another system actually needs a durable projection of committed changes. For a database-plus-message dual write, write an outbox record in the same supported transaction as the business change, because a separate unchecked publish after commit leaves a crash gap, and a publish before commit can announce a change that never happened. Check both failure points.

<example>
Confirming an order writes an `outbox` row with topic `order.confirmed` in the same transaction, and a relay sends it to the fulfillment service.
</example>

Assume replay can occur unless the whole processing boundary proves otherwise, use a stable event identity or source position, and make the sink effect idempotent, because connectors redeliver after crashes. Where supported, commit the sink update and its checkpoint together, preserve the required ordering per business key, and reject stale versions when older events can arrive later. An exactly-once claim from one connector does not prove exactly-once external effects. Check duplicates, out-of-order delivery, and a crash after applying an effect but before acknowledgment.

<example>
The inventory projection upserts by `sku` and ignores any event whose `version` is not higher than the stored one, so a redelivered or late event changes nothing.
</example>

For an initial snapshot followed by streaming, verify the connector's snapshot and log boundary and retained history, and reconcile sampled business keys and counts before switching consumers, because a gap at the boundary loses transactions silently. Include deletes and schema evolution in replay tests, and do not create an ad hoc high-water timestamp, because it can miss transactions committed around the boundary.

<example>
Before the reporting store goes live from the stream, 200 sampled `customer_id` values and the total count from `customers` are compared with it, and a test customer is deleted to confirm that the delete event arrives.
</example>

For PostgreSQL logical replication, coordinate compatible additive schema changes and verify subscriber readiness, because DDL and sequence state are not replicated like ordinary table rows. Before considering a subscriber for failover, verify sequences and other nonreplicated objects explicitly. Logical slots can redeliver recent changes after a crash and can retain WAL while consumers are absent, so check those conditions before relying on the stream for recovery or cache invalidation.

<example>
Adding `orders.coupon_code` runs on the subscriber first and then on the publisher, and before the subscriber is promoted, `orders_id_seq` is set past the highest `id`, since sequence values are not copied.
</example>

## Verify a recovery path by restoring it

Choose verification from the failure being addressed, and establish the accepted recovery point and recovery duration before choosing backup and log retention, because a replica helps availability but can reproduce an accidental deletion, and a checksum verifies bytes but not application correctness. Do not promise those targets from the existence of a backup job.

<example>
For "an admin deleted a month of invoices", the answer is a point-in-time restore from the nightly dump plus binary logs, which the read replica cannot give because it replayed the delete.
</example>

Restore only to an authorized isolated target for a drill, and disable outbound jobs, webhooks, and other side effects before starting the restored application, because a restored copy that runs its cron jobs will email subscribers and publish to external services as if it were production. Verify the engine version, extensions, encryption access, users, schema objects, and required logs. Then check structural integrity, relationships, representative business totals, and real application reads and writes against the required recovery point and duration, because a server that starts is not enough.

<example>
The drill restores the nightly dump to a `restore-test` host with the mail driver set to `log` and the cron entries removed, then compares the `bookings` count and the newest `created_at` with the expected recovery point.
</example>

For PostgreSQL physical backups, use supported manifest verification where available and still perform a test restore, because verification does not prove that the server starts and recovers. Point-in-time recovery requires a continuous archived WAL chain from the appropriate base backup, and configuration files need separate consideration because WAL does not capture their manual changes. Check recovery to the intended point and timeline.

<example>
`pg_verifybackup` passes on the base backup, and the drill still recovers to a `recovery_target_time` just before the bad `DELETE` and checks the resulting timeline.
</example>

For MySQL and MariaDB, restore the compatible full backup and replay the required binary-log range, and check actual log availability and the selected event boundary before applying it, because a wall-clock label alone does not establish which transactions were recovered. Replaying binary logs executes data modifications, so test the recovery pipeline only against an isolated restored target, because the live one would be changed.

<example>
`mysqlbinlog --start-position=4 --stop-position=88213 binlog.000123 | mysql -h restore-test` stops at a position found by searching the log for the bad `DELETE`, not at a guessed time.
</example>

For SQLite, use a supported consistent backup mechanism and not a casual copy of only the live main database file, because WAL content and in-flight writes can be missing from the copy. Reopen the result independently and run `integrity_check` and `foreign_key_check` as separate checks, because integrity checking does not find foreign-key violations. Check application-level invariants as well.

<example>
A nightly job runs `sqlite3 app.db ".backup backup.db"` and then both pragmas against `backup.db`, instead of `cp app.db backup.db`.
</example>

Keep recovery evidence proportional to the requested change, because a query edit does not need a new backup regime, while a destructive transition needs a verified recovery decision before execution and not a generic promise to roll back later.

<example>
Adding an index to `orders` needs no restore drill, while dropping `customers.legacy_notes` first gets a restored copy that shows the data can be rebuilt.
</example>
