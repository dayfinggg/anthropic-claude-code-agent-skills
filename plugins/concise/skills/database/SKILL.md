---
name: database
description: PostgreSQL, MySQL, PgBouncer, Prisma and Drizzle practice for SQL, data fixes, schema migrations, locks, indexes, row level security and connection pooling. Use when writing or running SQL, psql or mysql commands, changing rows or schema in a database production uses, writing a migration, ALTER TABLE or CREATE INDEX, when a deploy hangs on a lock or a query is slow, or on errors like lock timeout or prepared statement already exists.
---

# Databases

This skill matches PostgreSQL 18 (19 is at RC 2, general availability planned for 2026-11-19), MySQL 8.4 and 9.7 LTS and the 26.x Innovation releases, PgBouncer 1.26, Prisma ORM 7 with Prisma ORM 8 at release candidate, and Drizzle 0.45 with 1.0 at release candidate. Ask the server for its version with `SELECT version();`. Where the installed release is newer, its own release notes and `--help` are right.

## References

Each file below holds what this page only names. Read it in full with the Read tool before the first step its condition describes, also when that step comes late in a long task or after a compaction.

- [references/upgrades.md](references/upgrades.md): read when upgrading or patching a PostgreSQL, MySQL or PgBouncer server, or when choosing a MySQL release line.
- [references/postgresql-features.md](references/postgresql-features.md): read when code may use PostgreSQL 18 or 19 syntax such as `RETURNING old.*`, temporal keys, `ON CONFLICT DO SELECT`, `REPACK` or `WAIT FOR LSN`.
- [references/row-level-security.md](references/row-level-security.md): read when writing or debugging RLS policies, tenant isolation, `SECURITY DEFINER` functions or views over RLS tables.
- [references/orms.md](references/orms.md): read when the project uses Prisma or Drizzle, or when choosing an ORM version.

## Check first

- Find which environments share the database before any write: compare host, port, database name and user in the pre-production and production configs of the site. When pre-production points at the production database, every write from it, a test or a one-off script changes production.
- Before DDL on a live PostgreSQL table, look for old transactions: `SELECT pid, now() - xact_start AS age, state, query FROM pg_stat_activity WHERE xact_start IS NOT NULL ORDER BY xact_start;`. On MySQL read `SELECT * FROM information_schema.innodb_trx ORDER BY trx_started;` and `SHOW PROCESSLIST`.
- Find both connection strings, pooled and direct, in the site config, env files and ORM config (`DATABASE_URL`, `DIRECT_URL`, port 6432 for PgBouncer).

## Writes to a database production uses

- Before a write to a database that production uses, save the rows or objects about to change to a file that can restore them, and name that file next to the write. This covers updated rows as well as deleted ones, and schema, functions, triggers and grants.
- PostgreSQL rows: `\copy (SELECT * FROM orders WHERE id IN (...)) TO 'orders-before.csv' WITH (FORMAT csv, HEADER)` in psql, with the same `WHERE` the change will use. Objects: `pg_dump --schema-only --table=orders` (includes indexes, triggers and grants) and `SELECT pg_get_functiondef('app.fn(int)'::regprocedure);`.
- MySQL rows: `mysqldump --single-transaction --no-create-info --replace --where="id IN (...)" db orders > orders-before.sql` writes `REPLACE` statements that put the old values back. Objects: `SHOW CREATE TABLE`, `SHOW CREATE TRIGGER`, `SHOW CREATE PROCEDURE`.
- Run the change in a transaction, compare the affected row count with the saved file, then commit. MySQL DDL commits implicitly and cannot be rolled back, while PostgreSQL DDL is transactional except the `CONCURRENTLY` forms.
- In an interactive mysql session `SET sql_safe_updates = 1;` makes an `UPDATE` or `DELETE` without a key condition or `LIMIT` fail instead of changing every row.
- Change many rows in batches of a few thousand by primary key range, each in its own transaction, so locks stay short and replication keeps up. Write backfills that resume and skip finished rows: a migration tool's run-once tracking does not make them safe to repeat.

## PostgreSQL migrations and locks

- Run every DDL on a live table with a short lock wait, and retry the migration on SQLSTATE `55P03`: `SET lock_timeout = '2s';` before the `ALTER TABLE`.
- Build indexes with `CREATE INDEX CONCURRENTLY` in a migration of its own with the runner's transaction wrapper off, because it fails inside a transaction block.
- For a new unique constraint, build the unique index concurrently, then attach it: `ALTER TABLE t ADD CONSTRAINT t_email_key UNIQUE USING INDEX t_email_idx;`.
- Add a foreign key as `NOT VALID`, then run `VALIDATE CONSTRAINT` in a second transaction. The add step takes SHARE ROW EXCLUSIVE on both tables, so it also blocks writes to the referenced table. Validation takes SHARE UPDATE EXCLUSIVE, which allows reads and writes.
- On 18+ add NOT NULL in two steps: `ALTER TABLE orders ADD CONSTRAINT orders_status_nn NOT NULL status NOT VALID;`, then `ALTER TABLE orders VALIDATE CONSTRAINT orders_status_nn;`. On 17 and older add `CHECK (status IS NOT NULL) NOT VALID`, validate it, run `SET NOT NULL` (the valid check lets it skip the scan), then drop the check.
- `ADD COLUMN ... DEFAULT` with a constant or a STABLE function such as `now()` is metadata only. A volatile default (`gen_random_uuid()`, `uuidv7()`, `clock_timestamp()`), an identity column, a stored generated column or a domain with constraints rewrites the table under ACCESS EXCLUSIVE. Add the column nullable, `SET DEFAULT` for new rows, then backfill in batches.
- Since 18, `GENERATED ALWAYS AS (expr)` without a keyword is virtual and computed on read. Write `STORED` when the value must be persisted or published by logical replication.
- On 18+ give UUID keys `DEFAULT uuidv7()`, which is built in. B-tree skip scan can serve `WHERE y = 7` from an index on `(x, y)` when `x` has few distinct values, so check `EXPLAIN` before adding a second index.
- Plan migrations to roll forward. A down migration that drops a new column or reverses a data transform loses the writes made since the deploy.

## MySQL

- Before DDL run `SET SESSION lock_wait_timeout = 5;`. The default is 31536000 seconds (one year), and a pending metadata lock blocks every later query on the table.
- Name the algorithm so the statement fails instead of falling back to a table copy: `ALGORITHM=INSTANT` alone (it accepts only `LOCK=DEFAULT`), or `ALGORITHM=INPLACE, LOCK=NONE`.
- Upsert with a row alias: `INSERT INTO t (a, b) VALUES (1, 2) AS new ON DUPLICATE KEY UPDATE b = new.b;`. `VALUES(b)` in the update clause is deprecated.
- Choose an LTS line (8.4 or 9.7) for production. Innovation releases, including the calendar-versioned 26.x ones, are supported only until the next release, and the version number does not say whether a release is LTS.

## Pooling and connections

- Send application traffic through the transaction pooler. Run migrations, `pg_dump`, logical replication, `LISTEN`, session advisory locks and anything that relies on `SET` over the direct connection.
- In transaction pooling, scope settings with `SET LOCAL` or `set_config(name, value, true)` and use `pg_advisory_xact_lock` instead of `pg_advisory_lock`. SQL-level `PREPARE`, `LISTEN`, `WITH HOLD` cursors and temp tables that outlive a transaction do not work there.
- Protocol-level prepared statements work through PgBouncer 1.21+ when `max_prepared_statements` is above 0, the default (200) since 1.24. Drop Prisma's `pgbouncer=true` URL flag on those versions.
- PgBouncer older than 1.26.1 has CVE-2026-107350, which lets a user with a SCRAM password log in as another SCRAM user, including admins. Upgrade a pooler that uses SCRAM authentication.
- libpq's default `sslmode=prefer` and `sslmode=require` encrypt without checking the server certificate. For a remote server use `sslmode=verify-full` with `sslrootcert`, or `sslrootcert=system` (PostgreSQL 16+ libpq), which loads the system CAs and enforces `verify-full`.

## Gotchas

- A waiting ACCESS EXCLUSIVE request queues every later query on the table, plain SELECTs included. One idle-in-transaction session can turn a millisecond `ALTER TABLE` into an outage. Use `lock_timeout`, and set `idle_in_transaction_session_timeout` and `transaction_timeout` (17+) on application roles.
- A failed `CREATE INDEX CONCURRENTLY` leaves an invalid index that still costs writes, and a retry with `IF NOT EXISTS` silently keeps it. Find it with `SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;`, run `DROP INDEX CONCURRENTLY`, then build again.
- `CREATE INDEX CONCURRENTLY` is not supported on a partitioned table. Create the parent index with `ON ONLY parent`, build each partition's index concurrently, then `ALTER INDEX parent_idx ATTACH PARTITION part_idx` for each one.
- `ON CONFLICT (email)` matches a partial unique index only when the statement repeats its predicate: `ON CONFLICT (email) WHERE deleted_at IS NULL`.
- `ALTER TYPE ... ADD VALUE` inside a transaction leaves the new enum value unusable until commit, so a migration that adds a value and uses it fails. Split it into two migrations.
- After a migration changes a table, PgBouncer clients that prepared statements against it fail with `cached plan must not change result type`. Run `RECONNECT` on the PgBouncer admin console or recycle the application pool.
- Migration tools behind a transaction pooler fail with errors that do not mention pooling, such as Prisma Migrate's `prepared statement "s0" already exists` or a `SET search_path` that is gone by the next statement. Point the migration at the direct connection.
- MySQL `UUID()` returns version 1, not version 4. `UUID_TO_BIN(UUID(), 1)` reorders it for index locality. Store an app-generated UUIDv7 with `UUID_TO_BIN(?)` and no swap flag, because the swap scrambles its time order.
- MySQL `ON DUPLICATE KEY UPDATE` fires on whichever unique index collides, not only the one you meant. Avoid it on tables with more than one unique index.
- MySQL INSTANT add or drop column fails with `ERROR 4092` once a table has 64 row versions on 8.4 (255 since 9.1). A rebuild with `ALGORITHM=INPLACE` or `OPTIMIZE TABLE` resets the count.
- MySQL 8.4 disables `mysql_native_password` and 9.0 removed it, so old clients and accounts created with it cannot log in. 8.4 also rejects foreign keys to non-unique or partial keys while `restrict_fk_on_non_standard_key` is ON, its default.

Related skills: concise:php for PDO, mysqli and Doctrine code, concise:server-ops for running commands on the database host, concise:shell for quoting SQL inside ssh commands.
