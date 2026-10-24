---
name: working-with-databases
description: Writes and reviews SQL, ORM code, schemas, indexes, migrations, MongoDB, DynamoDB, Redis caching, and slow queries. Use for any query, schema change, migration, N+1 problem, or agent database access.
---

# Working with databases

This skill owns SQL and NoSQL injection. Writing-secure-code owns other sinks and access control. Adding-observability owns what may be logged.

## Rules

- Bind user input as query parameters. Parameters carry values only, so map sort columns, directions, and table names to an allow-list of application-owned tokens.
- Manual escaping is not a defense. Dynamic SQL built inside a stored procedure is still injectable.
- ORM raw query APIs are the usual injection path. Use the tagged template or bound form, never the Unsafe or string-concatenated form.
- Build NoSQL filters from named fields with validated scalar types. A denylist of `$` keys misses object values.
- Reject client-controlled `$where`, `$regex`, and `$expr` unless validated.
- The application account has only the rights it needs. Migrations run with a separate account.
- Constraints live in the database, such as `NOT NULL`, uniqueness, foreign keys, checks, and MongoDB `$jsonSchema`. Application checks fail under concurrent writers.
- Every read is bounded. Transactions stay short and hold no calls to other services.
- Writes are safe to retry through natural keys, upserts, or idempotency keys.
- Store instants as UTC in a time-zone aware type. For local-time schedules, also store the IANA zone name.
- Store money as `numeric` or integer minor units, never as float.
- Keep personal data and secrets out of query and parameter logs.
- Read the plan before tuning, using `EXPLAIN (ANALYZE, BUFFERS)` in PostgreSQL or `explain("executionStats")` in MongoDB. Use production-like data.
- Every schema change is a new versioned migration in the project's tool. A migration that ran in a shared environment stays as it is.
- Production changes use expand and contract.

## Reference files

- [reference/sql.md](reference/sql.md) covers relational schema, indexes, pagination, concurrency, pgvector, and engines. Read it before relational work.
- [reference/nosql.md](reference/nosql.md) covers MongoDB, DynamoDB, and Redis modeling and store choice. Read it before NoSQL work.
- [reference/operations.md](reference/operations.md) covers migration steps and agent database access. Read it before a migration or when an agent touches a database.
