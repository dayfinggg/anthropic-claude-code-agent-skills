# PostgreSQL 18 and 19 syntax

## PostgreSQL 18

- `RETURNING old.price, new.price` in `INSERT`, `UPDATE`, `DELETE` and `MERGE` returns values from before and after the change in one statement. Rename the aliases with `RETURNING WITH (OLD AS o, NEW AS n)` when a table has columns named `old` or `new`.
- Temporal keys replace an exclusion constraint built with btree_gist. `PRIMARY KEY (room_id, during WITHOUT OVERLAPS)` and `UNIQUE (..., during WITHOUT OVERLAPS)` reject overlapping ranges, and `FOREIGN KEY (room_id, PERIOD during) REFERENCES rooms (id, PERIOD valid)` checks range coverage.
- `CHECK (...) NOT ENFORCED` and `FOREIGN KEY ... NOT ENFORCED` record a constraint without checking it.
- `uuidv7()` generates time-ordered UUIDs, and `uuidv4()` is an alias of `gen_random_uuid()`.
- NOT NULL constraints are stored in `pg_constraint`, can be named, and accept `NOT VALID` plus a later `VALIDATE CONSTRAINT`.
- A virtual generated column cannot use a user-defined type, and its expression must not call user-defined functions or types. Use `STORED` for those.

## PostgreSQL 19

- `INSERT ... ON CONFLICT (key) DO SELECT RETURNING *` returns the existing row on conflict, for get-or-create in one statement. `DO SELECT FOR UPDATE` also locks it and needs UPDATE privilege on at least one column.
- `REPACK` replaces `VACUUM FULL` and `CLUSTER`, which stay as aliases. `REPACK (CONCURRENTLY) t` rewrites a table without blocking reads and writes, replacing pg_repack.
- `REPACK (CONCURRENTLY)` refuses partitioned, unlogged and materialized-view targets, tables without a primary key or index-based replica identity, and any table with an invalid index. It cannot run without a table name.
- For read-your-writes on a standby, read `pg_current_wal_insert_lsn()` on the primary after the write, then run `WAIT FOR LSN '0/306EE20' WITH (TIMEOUT '2s');` on the standby before the read. `MODE` chooses `standby_replay` (default), `standby_write`, `standby_flush` or `primary_flush`.
- `pg_stat_progress_repack` reports progress of `REPACK`, `CLUSTER` and `VACUUM FULL`.
- `GRANT ... GRANTED BY role` sets the role recorded as grantor.
