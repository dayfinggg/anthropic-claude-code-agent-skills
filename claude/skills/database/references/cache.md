# Redis and cache consistency

## Establish whether data may be stale

Add a cache only for a demonstrated cost or latency problem with reusable results, and establish the authoritative store and the acceptable stale-read behavior first, because frequently changing or mostly unique results can erase the expected benefit. Compare end-to-end latency, hit rate, and downstream work under real request distributions before keeping a cache, and do not add one merely because a query is slow.

<example>
The product page's 12 ms query for the 10 newest reviews gets no Redis layer, while the 900 ms "best sellers this week" aggregate that every visitor requests does.
</example>

If stale values could violate authorization, balances, inventory, or another invariant, use an authoritative read or a conditional write with the required consistency and not the cache, because a cache can only report what was true when it was filled. For display data that may lag, choose expiration and invalidation from that tolerance, remembering that a TTL measures time since caching and not time since the authoritative value changed. Check the actual age of values under concurrent writes and slow fills.

<example>
A license check reads `licenses.expires_at` from the database, while the dashboard's usage chart may be 60 seconds old.
</example>

## Design the update and fill race explicitly

For SQL plus a side cache, commit the authoritative database change before invalidating its cached representation, and then check the stale-fill interleaving, because a reader can load the old value before the writer commits and invalidates, and then insert that old value after the invalidation. A delete after commit alone does not prevent this race. Check that exact schedule with a delayed reader.

<example>
Reader A loads product 812 with the old name, an admin saves and the code runs `DEL product:812`, and then A runs `SET product:812` with the old name, which now stays until the TTL ends.
</example>

If that bounded inconsistency is acceptable, define the expiration and refresh contract explicitly. If it is unacceptable, use authoritative reads for the sensitive path or a verified version or generation mechanism that rejects stale fills, and make that mechanism coordinate with invalidation and survive its failure modes, because adding a random delay or deleting twice only narrows the window. This is an application design decision and not a guarantee that SQL and Redis provide together. Check lost invalidations, retry delivery, and fills started before a committed update.

<example>
Readers fetch the cheap `version` column from PostgreSQL and then read `product:812:v7`, so a fill built from an older row lands under an old key that no reader requests.
</example>

When reliable invalidation must survive a process crash after database commit, consider an existing CDC feed or a transactional outbox, but only when the durability requirement justifies the mechanism, because an invalidation sent by the web process after commit is lost if the process dies in between. Make replay idempotent and preserve the ordering needed by each key. Check that a rolled-back database transaction emits no invalidation event.

<example>
Saving a product writes an `outbox` row for `product:812` in the same transaction, and a worker deletes the key and marks the row done, so repeated delivery is harmless.
</example>

For Redis-assisted client-side caching, distinguish server tracking from application cache invalidation, and check the client library and connection topology, because with separate data and invalidation channels an invalidation can arrive before an older read reply. Prevent that reply from repopulating the entry and flush the affected local state when the invalidation connection is lost. Do not infer tracking support from the mere presence of a command API. Check reconnection, pooled connections, and key expiration.

<example>
A long-running queue worker that keeps `settings` in memory under `CLIENT TRACKING` clears that memory whenever its invalidation connection reconnects.
</example>

## Bound cache failures

Include tenant and every other result-changing scope in cache keys, and version the serialized representation when incompatible binaries can overlap, because a key that omits scope serves one tenant's data to another and an old payload can break new code during a deploy. Check cross-scope requests and old cached payloads.

<example>
Keys look like `tenant:3:invoice:812:v2`, so tenant 4 cannot read tenant 3's entry, and a release that changes the payload reads `v3` keys and never the old `v2` entries.
</example>

Give a negative cache entry a short expiration and an invalidation on creation, and keep a confirmed missing record apart from a downstream error, because otherwise a new record stays invisible until the entry expires and an outage gets cached as absence. Check that creating the record makes it visible at once.

<example>
`product:sku:ABC-100` is cached as "not found" for 30 seconds and deleted when the product is created, while a database timeout returns an error and caches nothing.
</example>

For a hot missing key, evaluate request coalescing or refresh coordination before increasing cache capacity, and for a cold cache or cache outage, bound the fallback traffic to the database, because a burst of misses can overload the store the cache protects. Serving stale data, shedding load, and returning an error are different product decisions, so use only the behavior the contract allows. Check with the cache empty and unavailable, not only with a warm, high hit rate.

<example>
When the `best_sellers` key expires, one request rebuilds it behind a short lock while the others serve the previous value for up to 30 seconds, as the page contract permits.
</example>

## Do not confuse replication, durability, and locking

Treat Redis replication as asynchronous by default, because `WAIT` reports replica acknowledgments for earlier writes on the same connection and is not a strongly consistent failover guarantee. Check its returned count and timeout behavior when the application relies on it, since persistence, eviction policy, and failover configuration determine additional loss modes. If Redis is authoritative and not rebuildable, check the accepted loss budget and an actual restore, and do not assume either that all Redis data is disposable or that replication makes every acknowledged write durable.

<example>
Sessions lost at failover only log users out, while a prepaid API credit balance kept only in Redis needs its persistence settings reviewed and a tested restore.
</example>

For a distributed lock, decide whether duplicate work is merely wasteful or corrupts a protected resource, because a lease can expire while its holder pauses, and checking expiry before writing cannot exclude a pause immediately after the check. If correctness depends on exclusive access, prefer an enforceable database invariant or a mechanism with explicit failure assumptions. When using fencing, the destination must reject stale monotonic tokens, since a random ownership token alone is not fencing. Check a paused former holder writing after a new holder succeeds.

<example>
A Redis `SET lock NX PX 30000` around the nightly report rebuild is fine because a duplicate rebuild only wastes CPU, while a lock around decrementing a wallet's `balance` is replaced by `UPDATE ... SET balance = balance - :cost WHERE balance >= :cost`.
</example>

Do not treat Redis atomic operations as an atomic transaction with an external database, and check key placement and the supported transactional scope before grouping commands, because `MULTI` and Lua scripts cover only Redis keys and never the SQL write. If the invariant spans systems, identify the dual-write failure and use the narrowest verified consistency mechanism.

<example>
Incrementing `downloads:812` in Redis and `packages.downloads` in MySQL in one handler can disagree after a crash, so Redis is the counter and a job writes the totals back to the database in batches.
</example>
