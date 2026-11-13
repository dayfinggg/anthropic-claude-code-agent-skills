---
name: database
description: Current PostgreSQL 18 and 19, MySQL 8.4, 9.7 and 26.x, PgBouncer, Prisma 7 and 8, and Drizzle practice for schema migrations, locks, indexes, row level security and connection pooling. Use when writing or reviewing SQL, a migration file, an ALTER TABLE or CREATE INDEX, an RLS policy, schema.prisma or prisma.config.ts, a Drizzle schema or drizzle.config.ts, or pooler, sslmode and connection settings, when a deploy hangs on a lock or a query is slow, when picking or upgrading a database server or ORM version, or on errors like canceling statement due to lock timeout, prepared statement already exists, cached plan must not change result type, too many clients or permission denied for table.
---

## Read first

Do these steps now, in order, before anything else and whatever the task. The files hold the traps this skill depends on, and a skipped file or page is the usual cause of a wrong result.

1. Read `references/orms.md` in full with the Read tool (Prisma versions, Prisma 7, Prisma 8, Drizzle).
2. Read `references/upgrades.md` in full with the Read tool (PostgreSQL minor releases of 2026-11-12, PostgreSQL 17 to 18, PostgreSQL 18 to 19, MySQL release lines).
3. Open https://www.postgresql.org/versions.json (PostgreSQL majors, latest minors and end-of-life dates) and compare it with the facts below.
4. Open https://github.com/mysql/mysql-server/tags.atom (Current MySQL releases (`mysql-*` tags)) and compare it with the facts below.
5. Open https://www.prisma.io/docs/orm/release-status.md (Prisma release lines) and compare it with the facts below.

## Check first

- Ask the server for its version with `SHOW server_version;` on PostgreSQL or `SELECT VERSION();` on MySQL.
- Find the ORM and its installed versions with `npm ls prisma @prisma/client @prisma/orm-postgres drizzle-orm drizzle-kit`, then read `prisma.config.ts`, `schema.prisma` or `contract.prisma`, `drizzle.config.ts` and the migrations folder.
- Compare with the registry: `npm view prisma dist-tags`, `npm view @prisma/client dist-tags`, `npm view drizzle-orm dist-tags`.
- Find both connection strings, pooled and direct, in env files and ORM config (`DATABASE_URL`, `DIRECT_URL`, `DATABASE_URL_UNPOOLED`, a `-pooler` host, port 6432).
- Before DDL on a live PostgreSQL table, look for old transactions: `SELECT pid, now() - xact_start AS age, state, query FROM pg_stat_activity WHERE xact_start IS NOT NULL ORDER BY xact_start;`
- Facts verified 2026-11.

## Defaults

- PostgreSQL 18 is the current major (18.7). PostgreSQL 19 is at RC 2 with general availability planned for 2026-11-19. PostgreSQL 14 reached end of life on 2026-11-12 with 14.25.
- The 2026-11-12 minor releases (18.7, 17.12, 16.16, 15.20, 14.25) fix 52 CVEs, two of them RLS bypasses. Run the latest minor and follow the post-update steps in references/upgrades.md.
- MySQL LTS lines are 8.4 (8.4.13) and 9.7 (9.7.4). 9.7 is the last sequentially numbered line. Since 26.7.0 (2026-07-28) MySQL uses calendar versions `YY.M.P`, and the number does not mark a release as LTS. 26.7 and 26.10 carry no LTS label, so treat them as Innovation releases, each supported only until the next one. MySQL 8.0 reached end of life in April 2026 with 8.0.46.
- Prisma ORM 7 (`@prisma/client` 7.10.1) is the stable line. Prisma ORM 8 is a release candidate with new packages and commands. Drizzle stable is 0.45.4 on npm `latest`, and 1.0.0-rc.5 is on `rc`.
- PgBouncer 1.26.1 is current.
- On PostgreSQL 18+, give UUID keys `DEFAULT uuidv7()`. It is built in, so skip the `pg_uuidv7` extension. `uuidv4()` is an alias of `gen_random_uuid()`.
- Since PostgreSQL 18, `GENERATED ALWAYS AS (expr)` without a keyword is virtual and computed on read. Write `STORED` when the value must be persisted or published by logical replication. Adding a virtual column needs no rewrite, adding a stored one rewrites the table.
- PostgreSQL 18 syntax replaces old workarounds: `RETURNING old.price, new.price`, `PRIMARY KEY (room_id, during WITHOUT OVERLAPS)`, `FOREIGN KEY (room_id, PERIOD during)` and `CHECK (...) NOT ENFORCED`.
- On PostgreSQL 19, use `INSERT ... ON CONFLICT (key) DO SELECT RETURNING *` for get-or-create, `REPACK (CONCURRENTLY) t` instead of `VACUUM FULL`, `CLUSTER` or pg_repack, and `WAIT FOR LSN '...'` on a standby after reading `pg_current_wal_insert_lsn()` on the primary for read-your-writes.
- `REPACK (CONCURRENTLY)` needs a primary key or replica identity index and refuses partitioned, unlogged and materialized-view targets and tables with an invalid index.
- Run every PostgreSQL DDL on a live table with a short lock wait, and retry the migration on SQLSTATE `55P03`:

```sql
SET lock_timeout = '2s';
ALTER TABLE orders ADD COLUMN note text;
```

- Build PostgreSQL indexes with `CREATE INDEX CONCURRENTLY` in a migration of its own with the runner's transaction wrapper off, because it fails inside a transaction block.
- PostgreSQL 18 B-tree skip scan can serve `WHERE y = 7` from an index on `(x, y)` when `x` has few distinct values. Check `EXPLAIN` before adding a second index for a trailing column.
- For a new unique constraint, build the unique index concurrently, then attach it with `ALTER TABLE t ADD CONSTRAINT t_email_key UNIQUE USING INDEX t_email_idx;`.
- Add a PostgreSQL foreign key as `NOT VALID`, then run `VALIDATE CONSTRAINT` in a second transaction. The add step takes SHARE ROW EXCLUSIVE on both tables, so it also blocks writes to the referenced table. Validation takes SHARE UPDATE EXCLUSIVE, which allows reads and writes.
- Add NOT NULL on PostgreSQL 18+ in two steps:

```sql
ALTER TABLE orders ADD CONSTRAINT orders_status_nn NOT NULL status NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT orders_status_nn;
```

- On PostgreSQL 17 and older, add `CHECK (status IS NOT NULL) NOT VALID`, validate it, run `SET NOT NULL` (the valid check lets it skip the scan), then drop the check. `SET NOT NULL NOT VALID` and `VALIDATE NOT NULL ON` do not exist.
- `ADD COLUMN ... DEFAULT` with a constant or a STABLE function such as `now()` is metadata only. A volatile default (`gen_random_uuid()`, `uuidv7()`, `clock_timestamp()`), an identity column, a stored generated column or a domain with constraints rewrites the table under ACCESS EXCLUSIVE. For a volatile default, add the column nullable, run `ALTER COLUMN ... SET DEFAULT` (it only affects new rows), then backfill old rows in batches.
- Plan migrations to roll forward. A down migration that drops a new column or reverses a data transform loses the writes made since the deploy. The tool's run-once tracking does not make a backfill safe to repeat, so write backfills that resume and skip finished rows.
- Before MySQL DDL, run `SET SESSION lock_wait_timeout = 5;`. The default is 31536000 seconds (one year), and a pending metadata lock blocks every later query on the table.
- Name the MySQL algorithm so the statement fails instead of falling back to a table copy: `ALGORITHM=INSTANT` alone (it accepts only `LOCK=DEFAULT`), or `ALGORITHM=INPLACE, LOCK=NONE`.
- MySQL upsert: `INSERT INTO t (a, b) VALUES (1, 2) AS new ON DUPLICATE KEY UPDATE b = new.b;`. `VALUES(b)` in the update clause is deprecated.
- Send application traffic through the transaction pooler. Run migrations, `pg_dump`, logical replication, `LISTEN`, session advisory locks and anything that relies on `SET` over the direct URL. Neon pooled hosts end in `-pooler`, PlanetScale Postgres pools on port 6432, Prisma Postgres pools on `pooled.db.prisma.io`.
- In transaction pooling, scope settings with `SET LOCAL` or `set_config(name, value, true)` and use `pg_advisory_xact_lock` instead of `pg_advisory_lock`. SQL-level `PREPARE`, `LISTEN`, `WITH HOLD` cursors and temp tables that outlive a transaction do not work there.
- Protocol-level prepared statements work through PgBouncer 1.21+ when `max_prepared_statements` is above 0, which is the default (200) since 1.24. Drop Prisma's `pgbouncer=true` URL flag on those versions.
- libpq's default `sslmode=prefer` and `sslmode=require` encrypt without checking the server certificate. For a remote server use `sslmode=verify-full` with `sslrootcert`, or `sslrootcert=system` (PostgreSQL 16+ libpq), which loads the system CAs and enforces `verify-full`. A new `sslmode=disable` toward a non-local host is a plaintext regression.

## Gotchas

- A waiting ACCESS EXCLUSIVE request queues every later query on the table, plain SELECTs included. One idle-in-transaction session can turn a millisecond `ALTER TABLE` into an outage. Use `lock_timeout`, and set `idle_in_transaction_session_timeout` and `transaction_timeout` (PostgreSQL 17+) on application roles.
- A failed `CREATE INDEX CONCURRENTLY` leaves an invalid index that still costs writes, and a retry with `IF NOT EXISTS` silently keeps it. Find it with `SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;`, run `DROP INDEX CONCURRENTLY`, then build again.
- `CREATE INDEX CONCURRENTLY` is not supported on a partitioned table. Create the parent with `CREATE INDEX ... ON ONLY parent`, build each partition's index concurrently, then `ALTER INDEX parent_idx ATTACH PARTITION part_idx` for each one.
- `ON CONFLICT (email)` matches a partial unique index only when the statement repeats its predicate: `ON CONFLICT (email) WHERE deleted_at IS NULL`.
- RLS does not apply to superusers, BYPASSRLS roles or the table owner. Apps often connect as the role that ran the migrations and owns the tables. Connect as a separate non-owner role, or run `ALTER TABLE t FORCE ROW LEVEL SECURITY`.
- `SET app.tenant_id = '42'` through a transaction pooler leaks into another client's transactions, which turns RLS into a cross-tenant leak. PgBouncer 1.26 tracks only parameters that PostgreSQL reports to clients, such as `search_path` on PostgreSQL 18+ and `default_transaction_read_only`. Set custom ones inside the transaction with `SELECT set_config('app.tenant_id', $1, true);`.
- A view reads its base tables with the view owner's rights and RLS context. Create views over RLS tables `WITH (security_invoker = true)` (PostgreSQL 15+).
- A `SECURITY DEFINER` function bypasses RLS, and every new function grants EXECUTE to PUBLIC. Revoke EXECUTE from PUBLIC in the same transaction that creates it, grant it to the roles that need it, and pin `SET search_path = app, pg_temp` on the function.
- Under RLS, an UPDATE or DELETE that filters on a column only sees rows that a SELECT policy allows, so a missing SELECT policy makes them change 0 rows with no error. RETURNING and `ON CONFLICT DO UPDATE` raise an error instead.
- A table with RLS enabled and no policy denies every row to non-owner roles while the owner still sees everything. Test policies while connected as the application role.
- Unique and foreign key checks ignore RLS, so a duplicate key error can reveal that another tenant's row exists. Put `tenant_id` into tenant-scoped unique keys.
- `ALTER TYPE ... ADD VALUE` inside a transaction leaves the new enum value unusable until commit, so a migration that adds a value and uses it in a default, UPDATE or check fails. Split it into two migrations.
- After a migration changes a table, PgBouncer clients that prepared statements against it fail with `cached plan must not change result type`. Run `RECONNECT` on the PgBouncer admin console or recycle the application pool.
- Migration tools behind a transaction pooler fail with errors that do not mention pooling, such as Prisma Migrate's `prepared statement "s0" already exists` or a `SET search_path` that is gone by the next statement. Point the migration CLI at the direct URL.
- MySQL `UUID()` returns version 1, not version 4. `UUID_TO_BIN(UUID(), 1)` reorders it for index locality. Store an app-generated UUIDv7 with `UUID_TO_BIN(?)` and no swap flag, because the swap scrambles its time order. MySQL has no built-in UUIDv7 function.
- MySQL `ON DUPLICATE KEY UPDATE` fires on whichever unique index collides, not only the one you meant. Avoid it on tables with more than one unique index.
- MySQL INSTANT add or drop column fails with `ERROR 4092` once a table has 64 row versions on 8.4 (255 since 9.1). A rebuild with `ALGORITHM=INPLACE` or `OPTIMIZE TABLE` resets the count.
- MySQL 8.4 disables `mysql_native_password` and 9.0 removed it, so old clients and accounts created with it cannot log in. 8.4 also rejects foreign keys to non-unique or partial keys while `restrict_fk_on_non_standard_key` is ON, its default.
