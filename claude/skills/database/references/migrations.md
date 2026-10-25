# Migrations and data

## Establish the transition, not just the final schema

Use the project's migration mechanism, and correct an already applied shared migration with a new migration and not by rewriting its history, because other environments have already recorded the old version as run and will not run the edited file. Check that the new migration works from both the old and the corrected state.

<example>
A wrong column length in the applied `0042_add_customer_ref.sql` is fixed by `0043_widen_customer_ref.sql`, because staging and production already list 0042 as done.
</example>

Determine which application versions, workers, reports, CDC consumers, and external clients still use the old representation, because a change is safe only if its intermediate states support the required readers and writers. Check the actual rollback version and not a hypothetical old binary.

<example>
Renaming `products.title` to `name` during a rolling deploy breaks the old release that still selects `title`, so `name` is added first and `title` stays until no running release reads it.
</example>

Before authorized execution, establish expected row changes, relation sizes, disk headroom, long transactions, replication lag, and lock sensitivity, and inspect the migration runner's transaction behavior and the engine's DDL semantics, because the same statement can hold a lock for milliseconds on a small table and minutes on a busy one. Rehearse with representative data and competing writes, and set observable stop conditions for blocking, errors, lag, and resource use. A successful empty-database migration does not validate the production transition.

<example>
`ALTER TABLE readings ADD COLUMN validated TINYINT NOT NULL DEFAULT 0` is rehearsed on a restored copy with 3 million rows while a script inserts readings, and the production run stops if inserts wait longer than 5 seconds.
</example>

## Expand and contract when compatibility requires it

For an incompatible representation change, use separate deployable stages, and do not impose dual writing on a compatible additive change, because every extra stage is extra risk and needs its own rollback. Check whether any old reader or writer would actually break before adding stages.

<example>
Adding a nullable `invoices.purchase_order` is one additive migration, while moving `invoices.client_name` into `clients` rows follows the stages below.
</example>

In the first stages, add the new representation without removing the old one, keep a declared authoritative value, and deploy code that handles both shapes, because old code must keep working and new constraints must not reject valid old writes. If both shapes must change together, use a supported transaction or a recoverable synchronization mechanism. Check partial failures and mixed application versions.

<example>
A nullable `client_id` column is added beside `client_name`, `client_name` stays authoritative, and the Python save path writes both inside one transaction.
</example>

Backfill historical data with explicit conversion rules, updating only eligible rows or rows whose source revision still matches, because an older batch snapshot would otherwise overwrite a newer application edit.

<example>
`UPDATE invoices i JOIN clients c ON c.name = i.client_name SET i.client_id = c.id WHERE i.client_id IS NULL` skips rows that the application already saved with a `client_id`.
</example>

Reconcile missing, conflicting, and rejected rows before switching reads or write authority, and keep the old shape usable while the supported rollback version still requires it, because switching on a partial backfill hides the rows that were left behind.

<example>
Invoices whose `client_id` is still `NULL` after the backfill, such as names spelled "N/A" or with a typo, are listed and resolved before reads move to `client_id`.
</example>

Remove the old representation only after old consumers and the rollback requirement are gone, and verify the accepted recovery path before removing data that cannot be reconstructed, because a dropped column is recoverable only from a backup.

<example>
`ALTER TABLE invoices DROP COLUMN client_name` waits until the last release that reads it is retired and a restore of the pre-drop dump has been rehearsed.
</example>

Do not infer historical meaning from a convenient default, and separate unavailable historical values from valid zeroes, because a fabricated default is indistinguishable from real data afterwards. A newly required timestamp may not have existed in historical records, and a unit conversion may require a rounding decision. Check conversion samples and domain totals before declaring the backfill complete.

<example>
Old `invoices` rows have no `first_paid_at`, so the backfill leaves them `NULL` and does not copy `created_at`, and the cents conversion of legacy `amount` values is checked by comparing `SUM(amount)` before and after.
</example>

## Choose DDL for the installed engine

### PostgreSQL

Check whether the exact alteration rewrites rows, scans existing data, or takes a restrictive table lock, because different `ALTER TABLE` forms have different lock behavior. For supported constraints, separate adding enforcement from validating existing rows with `NOT VALID` and a later validation, after checking which constraint kinds the installed version supports that form for. Check the enforcement and validation state afterwards.

<example>
`ALTER TABLE order_items ADD CONSTRAINT order_items_order_fk FOREIGN KEY (order_id) REFERENCES orders (id) NOT VALID` is followed by `VALIDATE CONSTRAINT` in a separate step that scans `order_items` without blocking normal writes.
</example>

For a measured need on a busy table, evaluate `CREATE INDEX CONCURRENTLY` instead of a blocking build, because a blocking build stops writes for its whole duration. It cannot run in a transaction block, it still waits for transactions, and it consumes resources. A failed build can leave an invalid index and, for a unique index, continuing enforcement effects, so inspect the catalog state before choosing recovery, and do not rerun or drop an index owned by another change without checking, because that change may still be building it.

<example>
After a cancelled `CREATE INDEX CONCURRENTLY idx_bookings_room_id`, `\d bookings` marks the index `INVALID`, and recovery is `DROP INDEX CONCURRENTLY` followed by a rebuild once the owning migration is confirmed.
</example>

### MySQL

Determine the supported online algorithm and lock mode for the exact operation, storage engine, and server, since MySQL and MariaDB differ, and request the permitted behavior so that unsupported execution fails, because otherwise the server may silently copy a busy table while blocking writes. Online DDL can still wait on metadata locks and affect replication, and a cancelled or failed operation can be expensive to roll back. Check the observed lock and lag behavior in rehearsal.

<example>
`ALTER TABLE sensors ADD INDEX idx_serial (serial), ALGORITHM=INPLACE, LOCK=NONE` errors at once if the server would need a table copy, whereas without those clauses it may block writes to `sensors`.
</example>

Expect DDL to commit implicitly, and do not put DDL and corrective DML into one transaction and claim they share PostgreSQL-style rollback, because MySQL commits the open transaction around most DDL statements and atomic DDL only makes a single statement all-or-nothing. Inspect each statement's documented boundary and check failure between stages.

<example>
A migration that runs `BEGIN`, `ALTER TABLE`, a corrective `UPDATE`, and `ROLLBACK` on MariaDB has already committed the `ALTER` when the `UPDATE` fails, so each stage is written to be safely re-runnable.
</example>

### SQLite

Check `ALTER TABLE` support against the installed library version and not an old summary of SQLite limitations, and when a rebuild is necessary follow the official generalized procedure for that version, preserving dependent indexes, triggers, and views, because a hand-rolled table copy silently drops them. Change foreign-key mode outside an active transaction when required and restore enforcement afterwards. Do not edit `sqlite_schema` as a shortcut, because a wrong edit corrupts the database. Check both integrity and foreign keys at the end.

<example>
To change a column type in a SQLite-backed tool, the script creates `books_new`, copies the rows, drops `books`, renames the new table, recreates `idx_books_isbn`, and finishes with `PRAGMA foreign_key_check`.
</example>

## Make data work restartable and reconcilable

For a live backfill, use bounded batches with a stable progress key and commit each completed batch with its progress when possible, because a restart must be able to tell what was already processed. Check races with concurrent inserts, updates, and deletes, tune batch size from observed transaction duration, contention, and lag and not from an arbitrary universal count, and check the eligible remainder and not only the worker's last checkpoint.

<example>
The backfill walks `shipments` by `id` in batches of 1,000 and stores the last id, and a final `SELECT COUNT(*) FROM shipments WHERE carrier_id IS NULL` confirms that nothing eligible is left.
</example>

For imports, define encoding, column mapping, exact units, null markers, duplicate handling, and conflict policy before loading, use a staging area when the source needs validation or reconciliation, and keep rejected records distinguishable from successful rows, because a loader exit code alone does not prove that the intended dataset arrived. Check row counts, stable business keys, domain totals, relationships, and representative application reads.

<example>
A legacy product CSV in Windows-1252 is loaded into `products_staging` as `utf8mb4`, rejected rows go to `products_rejects` with a reason, and the check compares the 18,204 source rows with loaded plus rejected rows.
</example>

For recurring imports, choose a stable source identity and an explicit update, ignore, or reject policy, because feeds are retried and overlap, and check that a replay creates no duplicates and does not overwrite newer destination edits. In PostgreSQL CSV loading, quoted empty strings and unquoted null markers can mean different things, so test both before importing data where missing and empty differ.

<example>
The supplier price import runs `INSERT ... ON DUPLICATE KEY UPDATE` on `supplier_sku` and sets only the supplier-owned columns, so rerunning the same file creates no duplicates and keeps local edits to `description`.
</example>

Use the engine's supported bulk-loading facility when its behavior fits the task, because row-by-row inserts cost far more, and remember that PostgreSQL `COPY` is not a cross-engine command. Advice for loading an empty table does not authorize dropping live constraints or indexes, disabling logging, or breaking replication, because those protect a running system. Reassess statistics and real query plans after a substantial distribution change.

<example>
A one-off load of archive rows into a new `timesheets_archive` table on MySQL can use `LOAD DATA INFILE`, while the live `timesheets` table keeps its keys and indexes during any load.
</example>

## Separate three recovery questions

Choose the recovery mechanism for the failure at hand, because an application rollback needs compatible persisted data, an inverse data migration needs a reversible mapping, and a restore needs a verified backup and log chain and can discard later valid writes, so a down migration does not solve all three. Check recovery on an isolated target before a destructive transition, and for a lossy change define a safe stopping point or an accepted roll-forward repair before execution.

<example>
Before dropping `invoices.client_name`, the plan states that rolling back the application release works while the column exists, that restoring the dump would lose payments recorded since, and that the repair path re-adds the column from `clients.name`.
</example>
