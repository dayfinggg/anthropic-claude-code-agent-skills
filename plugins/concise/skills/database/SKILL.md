---
name: database
description: Load before the first SQL statement, psql or mysql command, data fix, migration, ALTER TABLE or CREATE INDEX in a task, before changing rows or schema in a database production uses, and when a deploy hangs on a lock, a query is slow, or PostgreSQL, MySQL, PgBouncer, Prisma or Drizzle report an error or need an upgrade.
---

# Databases

This skill matches PostgreSQL 18, MySQL 8.4 and 9.7 LTS and the 26.x Innovation releases, PgBouncer 1.26, Prisma ORM 7 and Drizzle 0.45. On 2026-11-19 PostgreSQL 19 was at RC 2 with general availability planned for that day, and Prisma ORM 8 and Drizzle 1.0 were release candidates. Ask the server for its version with `SELECT version();`. Where the installed release is newer, its own release notes and `--help` are right.

## References

- Read [references/upgrades.md](references/upgrades.md) when upgrading or patching a PostgreSQL, MySQL or PgBouncer server, or when choosing a MySQL release line.
- Read [references/postgresql-features.md](references/postgresql-features.md) when code may use PostgreSQL 18 or 19 syntax such as `RETURNING old.*`, temporal keys, `ON CONFLICT DO SELECT`, `REPACK` or `WAIT FOR LSN`.
- Read [references/row-level-security.md](references/row-level-security.md) when writing or debugging RLS policies, tenant isolation, `SECURITY DEFINER` functions or views over RLS tables.
- Read [references/orms.md](references/orms.md) when the project uses Prisma or Drizzle, or when choosing an ORM version.

## Check first

- Before a write, compare host, port, database name and user in the site's pre-production and production configs. When they match, a write from pre-production, a test or a one-off script changes production.
- Before DDL on a live PostgreSQL table, look for old transactions with `SELECT pid, now() - xact_start AS age, state, query FROM pg_stat_activity WHERE xact_start IS NOT NULL ORDER BY xact_start;`. On MySQL read `SELECT * FROM information_schema.innodb_trx ORDER BY trx_started;` and `SHOW PROCESSLIST`.
- Find both connection strings, pooled and direct, in the site config, env files and ORM config (`DATABASE_URL`, `DIRECT_URL`, port 6432 for PgBouncer).

## Writes to a database production uses

- Save PostgreSQL rows in psql with `\copy (SELECT * FROM orders WHERE id IN (...)) TO 'orders-before.csv' WITH (FORMAT csv, HEADER)`, using the same `WHERE` as the change. Save objects with `pg_dump --schema-only --table=orders`, which includes indexes, triggers and grants, and functions with `SELECT pg_get_functiondef('app.fn(int)'::regprocedure);`.
- Save MySQL rows with `mysqldump --single-transaction --no-create-info --replace --where="id IN (...)" db orders > orders-before.sql`, which writes `REPLACE` statements that put the old values back, and objects with `SHOW CREATE TABLE`, `SHOW CREATE TRIGGER` and `SHOW CREATE PROCEDURE`.
- Run the change in a transaction, compare the affected row count with the saved file, then commit. MySQL DDL commits implicitly and cannot be rolled back, while PostgreSQL DDL is transactional except the `CONCURRENTLY` forms.
- In an interactive mysql session, `SET sql_safe_updates = 1;` makes an `UPDATE` or `DELETE` without a key condition or `LIMIT` fail instead of changing every row.
- Change many rows in batches of a few thousand by primary key range, each in its own transaction, so locks stay short and replication keeps up. Write backfills that resume and skip finished rows, because a migration tool's run-once tracking does not make them safe to repeat.

## PostgreSQL migrations and locks

- Run DDL on a live table after `SET lock_timeout = '2s';`, and retry the migration on SQLSTATE `55P03`.
- Build indexes with `CREATE INDEX CONCURRENTLY` in a migration of its own with the runner's transaction wrapper off, because it fails inside a transaction block.
- For a new unique constraint, build the unique index concurrently, then attach it with `ALTER TABLE t ADD CONSTRAINT t_email_key UNIQUE USING INDEX t_email_idx;`.
- Add a foreign key as `NOT VALID`, then run `VALIDATE CONSTRAINT` in a second transaction. The add step takes SHARE ROW EXCLUSIVE on both tables, so it also blocks writes to the referenced table, while validation takes SHARE UPDATE EXCLUSIVE, which allows reads and writes.
- On 18 and later add NOT NULL in two steps, `ALTER TABLE orders ADD CONSTRAINT orders_status_nn NOT NULL status NOT VALID;` and then `ALTER TABLE orders VALIDATE CONSTRAINT orders_status_nn;`. On 17 and older add `CHECK (status IS NOT NULL) NOT VALID`, validate it, run `SET NOT NULL`, which the valid check lets skip the scan, then drop the check.
- `ADD COLUMN ... DEFAULT` with a constant or a STABLE function such as `now()` changes only metadata. A volatile default (`gen_random_uuid()`, `uuidv7()`, `clock_timestamp()`), an identity column, a stored generated column or a domain with constraints rewrites the table under ACCESS EXCLUSIVE, so add the column nullable, `SET DEFAULT` for new rows, then backfill in batches.
- Since 18, `GENERATED ALWAYS AS (expr)` without a keyword is virtual and computed on read. Write `STORED` when the value must be persisted or published by logical replication.
- On 18 and later give UUID keys the built-in `DEFAULT uuidv7()`. B-tree skip scan can serve `WHERE y = 7` from an index on `(x, y)` when `x` has few distinct values, so check `EXPLAIN` before adding a second index.
- Plan migrations to roll forward, because a down migration that drops a new column or reverses a data transform loses the writes made since the deploy.

## MySQL

- Before DDL run `SET SESSION lock_wait_timeout = 5;`. The default is 31536000 seconds (one year), and a pending metadata lock blocks every later query on the table.
- Name the algorithm so the statement fails instead of falling back to a table copy, either `ALGORITHM=INSTANT` alone (it accepts only `LOCK=DEFAULT`) or `ALGORITHM=INPLACE, LOCK=NONE`.
- Upsert with a row alias, as in `INSERT INTO t (a, b) VALUES (1, 2) AS new ON DUPLICATE KEY UPDATE b = new.b;`, because `VALUES(b)` in the update clause is deprecated.

## Pooling and connections

- Send application traffic through the transaction pooler. Run migrations, `pg_dump`, logical replication, `LISTEN`, session advisory locks and anything that relies on `SET` over the direct connection.
- In transaction pooling, scope settings with `SET LOCAL` or `set_config(name, value, true)` and use `pg_advisory_xact_lock` instead of `pg_advisory_lock`. SQL-level `PREPARE`, `LISTEN`, `WITH HOLD` cursors and temp tables that outlive a transaction do not work there.
- Protocol-level prepared statements work through PgBouncer 1.21 and later when `max_prepared_statements` is above 0, which is the default (200) since 1.24. Drop Prisma's `pgbouncer=true` URL flag on those versions.
- PgBouncer 1.17.0 through 1.26.0 has CVE-2026-107350, which lets a user with a SCRAM password log in as another SCRAM user, admins included. Upgrade a pooler that uses SCRAM authentication.
- libpq's default `sslmode=prefer` and `sslmode=require` encrypt without checking the server certificate. For a remote server use `sslmode=verify-full` with `sslrootcert`, or `sslrootcert=system` (PostgreSQL 16+ libpq), which loads the system CAs and enforces `verify-full`.

## Gotchas

- A waiting ACCESS EXCLUSIVE request queues every later query on the table, plain SELECTs included, so one idle-in-transaction session can turn a millisecond `ALTER TABLE` into an outage. Use `lock_timeout`, and set `idle_in_transaction_session_timeout` and `transaction_timeout` (17+) on application roles.
- A failed `CREATE INDEX CONCURRENTLY` leaves an invalid index that still costs writes, and a retry with `IF NOT EXISTS` keeps it without a warning. Find it with `SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;`, run `DROP INDEX CONCURRENTLY`, then build again.
- `CREATE INDEX CONCURRENTLY` is not supported on a partitioned table. Create the parent index with `ON ONLY parent`, build each partition's index concurrently, then run `ALTER INDEX parent_idx ATTACH PARTITION part_idx` for each one.
- `ON CONFLICT (email)` matches a partial unique index only when the statement repeats its predicate, as in `ON CONFLICT (email) WHERE deleted_at IS NULL`.
- `ALTER TYPE ... ADD VALUE` inside a transaction leaves the new enum value unusable until commit, so a migration that adds a value and uses it fails. Split it into two migrations.
- After a migration changes a table, PgBouncer clients that prepared statements against it fail with `cached plan must not change result type`. Run `RECONNECT` on the PgBouncer admin console or recycle the application pool.
- Migration tools behind a transaction pooler fail with errors that do not mention pooling, such as Prisma Migrate's `prepared statement "s0" already exists`, or a `SET search_path` that is gone by the next statement on poolers that do not track it (PgBouncer tracks it from 1.26 on PostgreSQL 18). Point the migration at the direct connection.
- MySQL `UUID()` returns version 1, not version 4, and `UUID_TO_BIN(UUID(), 1)` reorders it for index locality. Store an app-generated UUIDv7 with `UUID_TO_BIN(?)` and no swap flag, because the swap scrambles its time order.
- MySQL `ON DUPLICATE KEY UPDATE` fires on whichever unique index collides, not only the one you meant. Avoid it on tables with more than one unique index.
- MySQL INSTANT add or drop column fails with `ERROR 4092` once a table has 64 row versions on 8.4 (255 since 9.1). A rebuild with `ALGORITHM=INPLACE` or `OPTIMIZE TABLE` resets the count.
- MySQL 8.4 disables `mysql_native_password` by default and 9.0 removed it, so old clients and accounts created with it cannot log in. Move those accounts to `caching_sha2_password`, the client default since 8.4, and on 8.4 set `mysql_native_password=ON` under `[mysqld]` only while they move. 8.4 also rejects foreign keys to non-unique or partial keys while `restrict_fk_on_non_standard_key` is ON, its default, so point them at a primary key or a full unique key.

Related skills: concise:php for PDO, mysqli and Doctrine code, concise:server-ops for running commands on the database host, concise:shell for quoting SQL inside ssh commands.
