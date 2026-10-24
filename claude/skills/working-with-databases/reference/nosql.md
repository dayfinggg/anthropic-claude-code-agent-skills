# NoSQL stores

NoSQL design starts from access patterns. Write down the queries, their frequency, and the data size before designing documents or keys.

## Store choice

| Store | Use for |
|---|---|
| Document store | Data read and written as whole documents |
| DynamoDB | Few known access patterns at very high scale |
| Redis | Caches, rate limits, queues, and ephemeral state, never the only copy of important data |

## MongoDB

- Embed child data that is read with the parent, owned by it, and bounded in size.
- Reference data that is large, shared by many parents, grows without limit, or is read on its own.
- Bound every array. Use subset or reference patterns, because documents are limited to 16 MB.
- Enforce structure with `$jsonSchema` validation. Add a `schemaVersion` field when the shape evolves.
- Store dates as BSON dates and money as `Decimal128`. Use `ObjectId` or strings for identifiers consistently.
- Copy only rarely changing fields into an extended reference, because copies need an update strategy.
- Avoid a collection per customer or per day, duplicate indexes, frequent `$lookup`, and case-insensitive queries without a matching collation or index.
- Order compound index fields by equality, sort, then range.
- Put a very selective range predicate before the sort fields instead.
- Use projections to return only needed fields.
- Single-document writes are atomic, so prefer a design where one document changes per operation.
- Multi-document transactions cost more and do not replace good schema design.
- Use write concern `majority` for important writes.

## DynamoDB

- List the access patterns first and design partition and sort keys to serve them. Related items share a partition key and the sort key orders them, as in `PK = CUSTOMER#42` with `SK = ORDER#2026-10-07#ord_1001`.
- Use as few tables as the access patterns allow.
- Add global secondary indexes for further patterns and project only the attributes those reads need.
- An item is limited to 400 KB, and attribute names count toward it. Keep large payloads in object storage with a pointer.
- Use `Query`, not `Scan`, on request paths.
- A `Query` returns at most 1 MB per call. Loop on `LastEvaluatedKey` until it is absent.
- Use condition expressions for optimistic locking and uniqueness, and TTL for expiring data.
- A transaction is limited to 100 unique items and 4 MB. It cannot span accounts or Regions.

## Redis

- Add a cache only after the query is sound. Give every entry an expiry and an invalidation rule.
- Use cache-aside by default. Read the cache, on a miss load from the database and store with a TTL, and delete the key when the data changes.
- Protect hot keys from stampedes with a lock, request coalescing, or early refresh.
- Never call `KEYS` in application code. Use `SCAN` instead.
- `SCAN` can return a key more than once and can return empty pages. Deduplicate results and loop until the cursor is 0.
- Treat Redis as rebuildable unless persistence and replication are deliberately configured.
