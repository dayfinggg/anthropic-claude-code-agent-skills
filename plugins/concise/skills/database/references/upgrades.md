# Server upgrades and patch releases

## Contents

- PostgreSQL minor releases of 2026-11-12
- PostgreSQL 17 to 18
- PostgreSQL 18 to 19
- MySQL release lines
- PgBouncer

## PostgreSQL minor releases of 2026-11-12

- 18.7, 17.12, 16.16, 15.20 and 14.25 fix 52 CVEs, many of them arbitrary code execution by an authenticated user, and over 140 bugs. 14.25 is the last PostgreSQL 14 release: 14 is end of life since 2026-11-12. Minor updates need no dump or `pg_upgrade`, only new binaries and a restart.
- After the update, reindex GIN indexes suspected of corruption, every GiST index that uses `gist_trgm_ops`, and B-tree indexes on `bpchar` columns declared without a length (`char(n)` is not affected).
- Run `REINDEX TABLE` on any table that reports `missing chunk number`, and take a new full backup if you use incremental backups.
- Find `NOT NULL NO INHERIT` constraints on partitioned tables with `SELECT conrelid::regclass, conname FROM pg_constraint WHERE contype = 'n' AND connoinherit AND conrelid IN (SELECT oid FROM pg_class WHERE relkind = 'p');`. Drop them or run `ALTER TABLE ... ALTER CONSTRAINT ... INHERIT`, which fails while a partition holds NULLs in that column.
- Clusters that skipped earlier minor releases may need the post-update steps of those releases too.

## PostgreSQL 17 to 18

- `initdb` enables data checksums by default and `pg_upgrade` needs matching settings. Create the new cluster with `--no-data-checksums` when the old one has none.
- RESTRICT foreign key violations now raise SQLSTATE 23001 instead of 23503. Update code that catches 23503.
- `pg_upgrade` now keeps planner statistics but not extended statistics. Analyze tables that have `CREATE STATISTICS` objects afterwards, for example with `vacuumdb --all --analyze-in-stages --missing-stats-only`.
- On clusters whose default collation provider is ICU or builtin, reindex full text search and pg_trgm indexes after `pg_upgrade`.
- MD5 passwords are deprecated. Move roles to SCRAM before 19, which warns after every MD5 login.

## PostgreSQL 18 to 19

- JIT is off by default. Set `jit = on` again where large analytical queries relied on it.
- `log_lock_waits` is on by default.
- `standard_conforming_strings` is always on. Dumps taken by a pre-19 `pg_dump` from a server with it off do not load, so dump with the 19 client.
- `max_locks_per_transaction` defaults to 128 instead of 64, and existing settings must be doubled to keep the same capacity.
- `io_workers` is removed. Its replacements are `io_min_workers`, `io_max_workers`, `io_worker_idle_timeout` and `io_worker_launch_interval`.
- `default_toast_compression` is now lz4, and `wal_compression = on` picks the best available method.
- `pg_upgrade` refuses clusters with btree_gist indexes on inet or cidr columns, and clusters whose database, role or tablespace names contain carriage returns or line feeds. Rebuild such indexes with the core GiST opclass first.
- Full text search and pg_trgm now classify characters with the database's locale provider. On ICU or builtin providers, reindex their indexes and recompute stored `tsvector` values after `pg_upgrade`. Reindex indexes that use fuzzystrmatch functions on every provider.
- The English, French, German, Spanish, Dutch and several other stemmers produce different stems, so recompute stored `tsvector` columns and rebuild `to_tsvector` expression indexes.
- A `json_array()` call that returns no rows now gives an empty JSON array instead of NULL.
- READ ONLY transactions pass that status to postgres_fdw sessions and can no longer modify remote rows.
- RADIUS authentication is removed.
- Expression indexes, generated columns or partition keys built on `JSON_ARRAY()` or `JSON_OBJECT()` over arrays, composite or range types while testing 19 RC 1 must be dropped before upgrading, because RC 2 forbids them again.

## MySQL release lines

- Choose an LTS line (8.4 or 9.7) unless you will take every Innovation release, because each Innovation release is supported only until the next one. LTS lines get 5 years of premier and 3 years of extended support. MySQL 8.0 reached end of life with 8.0.46.
- 9.7 is the last sequentially numbered line. From 26.7.0 (July 2026) releases use calendar versions `YY.M.P`, and the number does not say whether a release is LTS. Read the release notes for its maturity.
- An Innovation release upgrades only within its compatibility lineage, up to the LTS that closes it. An LTS upgrades within its line or into the next lineage and cannot skip one. Only 9.7.x can upgrade directly into the first calendar-versioned lineage.
- Downgrading an Innovation release needs a logical dump and load.
- Choose the track in the package repository, for example `mysql-innovation-community` or `mysql-9.7-lts-community` with Yum.
- `VERSION()` stays three-part. 9.7.4+ and 26.10 add `VERSION_WITH_UPDATE()` for the four-part release identity.
- 9.7 removed `replica_parallel_type`. Remove it from option files before upgrading.
- Doctrine DBAL 4.6 deprecates support for MySQL 8.0 to 8.3, another reason to move PHP sites to 8.4.

## PgBouncer

- 1.26.1 fixes CVE-2026-107350 (a client could log in as another SCRAM user, including admins), CVE-2026-107349 (a startup `options` value such as `-c=` spins a CPU core forever when `ignore_startup_parameters` is non-empty) and CVE-2026-107348.
- Since 1.26.0 `search_path` is tracked by default on PostgreSQL 18+, and `default_transaction_read_only` on 14+, so `SET search_path` in transaction pooling no longer leaks to other clients. In 1.26.1 listing `search_path` in `ignore_startup_parameters` restores the 1.25 behaviour.
- 1.26 sends `pgbouncer.version`, `pgbouncer.pool_mode` and `pgbouncer.max_prepared_statements` as `ParameterStatus` on login, so drivers can detect the pooler.
