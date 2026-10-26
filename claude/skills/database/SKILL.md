---
name: database
description: Designs and changes data storage, including schemas, queries, indexes, transactions, migrations, imports, caches, and replication. Use for database-backed changes and for slow queries, locking, or data integrity problems.
---

# Database

These rules decide how data storage is designed, changed, and checked. The references hold the detailed checks for each branch and each engine.

Before an engine-dependent choice, establish the deployed engine and exact version (treat MySQL and MariaDB as different engines), the storage engine, the driver or ORM, the environment, and the workload, and read the installed version's documentation, because syntax, defaults, and locking differ between engines and between releases of one engine. Check which database each environment really connects to, because a staging configuration can point at the production database.

<example>
For a slow `bookings` query in a Rails app, run `SELECT VERSION()` and read `config/database.yml`, which shows MariaDB in production while the local Docker image runs MySQL, so a plan checked locally says nothing about production.
</example>

Do not transfer PostgreSQL semantics to MySQL, MariaDB, SQLite, or another store, because the same SQL text can behave differently there. Check each assumption against the installed engine's documentation or a test query before relying on it.

<example>
A PostgreSQL unique index on `username` treats `Alice` and `alice` as different values, while a MySQL column with a default case-insensitive collation rejects the second as a duplicate.
</example>

Inspect the actual plan for query, index, pagination, and locking decisions, and use the store's native access-path evidence where it has no plan API, because a change that reads well can still scan the whole table. When access or representative data is missing, label the conclusion provisional instead of inventing measurements, and add indexes, caches, storage replacements, or abstractions only for a demonstrated requirement, because each one adds write cost and upkeep.

<example>
`EXPLAIN SELECT id, total FROM orders WHERE customer_id = 7 ORDER BY placed_at DESC LIMIT 20` shows `Using filesort` on the 300-row dev copy, so the report names an index on `(customer_id, placed_at)` as a candidate to confirm against production-sized data.
</example>

Run an analyzed plan only on a statement that was reviewed for side effects (functions, triggers, writable CTEs, locking clauses) or on isolated data, and obtain authorization before profiling in production, because `EXPLAIN ANALYZE` executes its statement, and a rollback removes the data changes but not the load, the lock waits it imposed on other sessions, consumed sequence values, or effects outside the database.

<example>
`EXPLAIN (ANALYZE) UPDATE invoices SET status = 'void' WHERE due_at < now() - interval '1 year'` run on production voids real invoices, so the plan comes from plain `EXPLAIN` or a restored copy.
</example>

Treat a prepared migration, backfill, import, restore, or destructive operation as written but not applied, and run it only against a target the user has authorized, because a file does not say which database the command will reach. Before an authorized run, verify compatibility, recovery, lock impact, validation, and stop conditions.

<example>
On a laptop whose `flyway.conf` points at the production database, running `flyway migrate` to apply `V42__add_order_ref.sql` changes the production schema, so ask which target is authorized first.
</example>

## References

Choose the references that apply before the dependent work and read each one, because each holds the checks for its branch. Read only the engine section that matches the deployed engine and leave the rest unread, so a query change does not become a database-wide checklist, and revisit the choice when the work changes.

- For storage selection, relationships, keys, constraints, money, time, or nulls, read [Storage and schema](references/storage.md).
- For races, isolation, transactions, locks, deadlocks, or retries, read [Transactions and concurrency](references/transactions.md).
- For slow queries, indexes, statistics, ORM loading, or pagination, read [Queries and pagination](references/queries.md).
- For schema transitions, backfills, imports, or rollback preparation, read [Migrations and data](references/migrations.md).
- For Redis, stale reads, invalidation, or distributed cache locks, read [Redis and cache consistency](references/cache.md).
- For retention, replicas, CDC, backups, or restore verification, read [Retention, replication, and recovery](references/operations.md).

<example>
A slow shipment listing on PostgreSQL that needs a new index on `shipments` calls for queries and pagination plus migrations and data, and only their PostgreSQL parts, while the cache reference stays unread.
</example>
