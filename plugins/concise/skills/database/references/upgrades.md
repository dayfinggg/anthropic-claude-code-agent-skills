## PostgreSQL minor releases of 2026-11-12

- After installing 18.7, 17.12, 16.16, 15.20 or 14.25, reindex GIN indexes suspected of corruption, every GiST index that uses `gist_trgm_ops`, and B-tree indexes on `bpchar` columns declared without a length.
- Run `REINDEX TABLE` on any table that reports `missing chunk number`, and take a new full backup if you use incremental backups.
- Find `NOT NULL NO INHERIT` constraints on partitioned tables with `SELECT conrelid::regclass, conname FROM pg_constraint WHERE contype = 'n' AND connoinherit AND conrelid IN (SELECT oid FROM pg_class WHERE relkind = 'p');`. Drop them or run `ALTER TABLE ... ALTER CONSTRAINT ... INHERIT`.

## PostgreSQL 17 to 18

- `initdb` enables data checksums by default and `pg_upgrade` needs matching settings. Create the new cluster with `--no-data-checksums` when the old one has none.
- RESTRICT foreign key violations now raise SQLSTATE 23001 instead of 23503. Update code that catches 23503.
- `pg_upgrade` now keeps planner statistics but not extended statistics. Analyze tables that have `CREATE STATISTICS` objects afterwards, for example with `vacuumdb --all --analyze-in-stages --missing-stats-only`.
- On clusters whose default collation provider is ICU or builtin, reindex full text search and pg_trgm indexes after `pg_upgrade`.
- MD5 passwords are deprecated. Move roles to SCRAM before 19, which warns on every MD5 login.

## PostgreSQL 18 to 19

- JIT is off by default. Set `jit = on` again where large analytical queries relied on it.
- `log_lock_waits` is on by default.
- `standard_conforming_strings` is always on. Dumps taken by a pre-19 `pg_dump` from a server with it off do not load, so dump with the 19 client.
- `max_locks_per_transaction` defaults to 128 instead of 64, and existing settings must be doubled to keep the same capacity.
- `io_workers` is removed. Its replacements are `io_min_workers`, `io_max_workers`, `io_worker_idle_timeout` and `io_worker_launch_interval`.
- `default_toast_compression` is now lz4, and `wal_compression = on` picks the best available method.
- `pg_upgrade` refuses clusters with btree_gist indexes on inet or cidr columns. Rebuild them with the core GiST opclass first.
- Full text search and pg_trgm now classify characters with the database's locale provider. On ICU or builtin providers, reindex their indexes and recompute stored `tsvector` values after `pg_upgrade`. Reindex indexes that use fuzzystrmatch functions on every provider.
- The English, French, German, Spanish and several other stemmers produce different stems, so recompute stored `tsvector` columns and rebuild `to_tsvector` expression indexes.
- A `json_array()` call that returns no rows now gives an empty JSON array instead of NULL.
- RADIUS authentication is removed, and database, role and tablespace names may not contain carriage returns or line feeds.

## MySQL release lines

- Pick an LTS line (8.4 or 9.7) unless you will take every Innovation release, because each Innovation release is supported only until the next one. LTS lines get 5 years of premier and 3 years of extended support.
- LTS upgrades go 8.4 to 9.7 to the next LTS, and skipping an LTS is unsupported. Only 9.7.x can upgrade into the first calendar-versioned lineage.
- An Innovation release upgrades only within its compatibility lineage, up to the LTS that closes it. Downgrading an Innovation release needs a logical dump and load.
- Choose the track in the package repository, for example `mysql-innovation-community` or `mysql-9.7-lts-community` with Yum.
- `VERSION()` stays three-part. 9.7.4+ and 26.10 add `VERSION_WITH_UPDATE()` for the four-part release identity.
- 9.7 removed `replica_parallel_type`. Remove it from option files before upgrading.
