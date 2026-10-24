# Relational databases

Project conventions and the engine documentation for the version in use win over this file.

## Design

- Default to PostgreSQL, with `jsonb` for loosely structured parts.
- The use case declares a repository interface in business terms, such as `find_active_orders_for(customer_id)`.
- The adapter keeps rows, ORM models, and driver types inside. See applying-clean-architecture for layering.
- Test repositories against the real engine, for example in a container. An in-memory fake cannot test SQL.

## Schema

- Normalize to third normal form. Denormalize only for a measured read problem, and document which copy is the source of truth.
- Every table has a surrogate primary key, a `bigint` identity or a time-ordered UUIDv7. UUIDv4 has poor index locality.
- PostgreSQL 18 has a native `uuidv7()`. Older versions need application generation or an extension.
- Natural keys such as email get unique constraints.
- Use `timestamptz` for moments, `date` for calendar days, and `numeric` for money.
- Use `text` without an arbitrary length limit. Use a check or an enum type for small fixed sets.
- Columns are `NOT NULL` unless absence has a real meaning. Foreign keys declare an explicit `ON DELETE` rule.
- Use soft deletes only when the business needs history. Filter them in one place, such as a view or the repository.
- Use `jsonb` only for attributes that genuinely vary.

## Naming

- Use lowercase `snake_case` with no quoted identifiers. Choose plural or singular table names once per project.
- Name the primary key `id` and foreign keys `<referenced_singular>_id`. Name timestamps `created_at` and `updated_at`.
- Prefix booleans with `is_` or `has_`.
- Name constraints and indexes explicitly, as in `orders_customer_id_fkey`, so migrations can refer to them.

## Indexes and queries

- Index for the queries the application runs. Drop unused indexes, because each one slows writes.
- Index foreign keys used in joins and deletes.
- Put equality columns first in a composite index, then range or sort columns.
- Use partial indexes for small subsets and expression indexes for expressions in `WHERE`, such as `lower(email)`.
- Use `INCLUDE` covering indexes in PostgreSQL and SQL Server for hot reads.
- List columns instead of `SELECT *`, so schema changes neither change results nor leak new fields.
- Write `created_at >= :start` instead of `date(created_at) = :day`, so the index stays usable.
- Use `INSERT ... ON CONFLICT` in PostgreSQL and SQLite, or `MERGE`, for idempotent writes.

## Pagination

Use keyset pagination for large or changing data. Offset pagination reads and discards every skipped row.

```sql
SELECT id, created_at, total
FROM orders
WHERE (created_at, id) < (:last_created_at, :last_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

Back it with an index on `(created_at DESC, id DESC)`. The sort includes a unique column so the order is total. SQL Server has no row value comparison, so expand it to `created_at < :c OR (created_at = :c AND id < :i)`.

## Transactions and concurrency

- Prevent lost updates with a `version` column checked in `UPDATE ... WHERE id = :id AND version = :version`.
- Use `SELECT ... FOR UPDATE` for short critical sections.
- Use `FOR UPDATE SKIP LOCKED` for simple job queues in PostgreSQL and MySQL.
- Retry serialization and deadlock failures a limited number of times.
- Keep pools small. A common start is `(core_count * 2) + effective_spindle_count`, then load test.

## ORMs

- Load relations with explicit eager loading to avoid N+1 queries.
- Write plain SQL for reports and complex queries.

## Vector search with pgvector

- HNSW indexes support up to 2,000 dimensions in pgvector 0.8.7.
- Create an IVFFlat index after the table holds data.

## Engine caveats

- SQLite. Run `PRAGMA foreign_keys = ON` on every connection, outside a transaction, because it does nothing inside one.
- SQLite WAL mode needs all processes on one host. It does not work over a network filesystem.
- MySQL. `ALTER TABLE` locking depends on the operation, so check the online DDL algorithm first.
- SQL Server. Use `datetime2` or `datetimeoffset`, and parameterized queries through the driver for plan reuse.
