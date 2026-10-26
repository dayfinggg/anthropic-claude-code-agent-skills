# Queries and pagination

## Contents

- Establish what is expensive
- Correct estimates before forcing plans
- Choose indexes for the real access path
- Inspect ORM behavior instead of method names
- Match pagination to its contract

## Establish what is expensive

Capture the emitted statement, parameter types, representative values, row distribution, existing indexes, and observed latency, and separate database execution from connection waiting, network transfer, and object hydration, because a slow page is often not a slow query. Compare frequent and rare values before treating one fast sample as representative, and keep the change provisional when the actual plan or representative data is missing.

<example>
A slow report page is timed in three parts, 40 ms in the database, 15 ms on the wire, and 900 ms in Python building 2,000 ORM `Invoice` objects, so the fix lies in hydration and not in an index.
</example>

In PostgreSQL, start with `EXPLAIN` estimates, as with any engine that supports estimated plans, and use `EXPLAIN (ANALYZE, BUFFERS)` only where execution is safe and authorized, and distinguish row estimates from actual rows and loops, because a parent node's time includes its children and per-loop times must be multiplied by the loop count. Do not sum every node as independent elapsed time.

<example>
A node showing `actual time=0.02..0.03 rows=1 loops=5000` costs about 150 ms, and its parent's time already includes that.
</example>

In MySQL and MariaDB, compare chosen keys, examined rows, filtering, and actual iterator loops where the installed version reports them, because plan formats and analyzed-statement support differ between the two servers and between versions. Do not copy PostgreSQL options into them, and check the installed version's documentation for the analyzed form, which executes the statement as well.

<example>
On MariaDB, `EXPLAIN FORMAT=JSON` gives the estimated `rows` for a `readings` lookup and `ANALYZE FORMAT=JSON` adds `r_rows`, the rows actually read, so a large gap points at stale statistics.
</example>

In SQLite, use `EXPLAIN QUERY PLAN` for the access strategy, covering indexes, and temporary sorting, and do not treat it as timing data or parse its text in application code, because it reports no measured times and its wording is not a stable interface. The shell's `.eqp on` still runs the entered statement after printing its plan.

<example>
`EXPLAIN QUERY PLAN` printing `SEARCH books USING INDEX idx_books_isbn` confirms the index is used, and a deploy check does not match on that text.
</example>

Where a service exposes no SQL plan, inspect the real request and its native access-path evidence instead of inventing an `EXPLAIN`, because DynamoDB filters apply after reading and do not reduce that request's read capacity. Compare key conditions, scanned versus returned items, capacity, and latency.

<example>
A DynamoDB `Query` with a `FilterExpression` on `status` that reads 1,000 items to return 20 consumes capacity for 1,000, so the fix is a key or index that includes `status`.
</example>

## Correct estimates before forcing plans

When estimated rows differ materially from observed rows, inspect data skew, stale statistics, correlated predicates, and parameter-sensitive behavior before forcing an index or repeatedly analyzing a table, because a forced plan hides the estimate error and breaks when the data changes. PostgreSQL extended statistics help supported correlated-column cases and not arbitrary cross-table dependencies, MySQL histograms and index statistics serve different estimates, and SQLite statistics maintenance depends on the installed version. Check the affected plan after an authorized statistics change.

<example>
PostgreSQL estimates 1 row for `WHERE city = 'Lyon' AND postal_code = '69001'` but reads 40,000 because the columns correlate, so `CREATE STATISTICS` on both columns is tried before any planner setting is forced.
</example>

Accept a scan when the table is small or a large fraction of it matches, and compare total work, rows discarded, random reads, sort spills, and workload latency, because an index scan that looks cheap can cost more when repeated many times. Include cold and warm behavior when that difference matters, and check that results are equivalent before comparing speed.

<example>
A 200-row `countries` table is read by a sequential scan on purpose, while an index lookup repeated 50,000 times inside a nested loop is what slows the order export.
</example>

## Choose indexes for the real access path

For a B-tree candidate, identify the lookup bounds, residual filters, required ordering, and early-stop condition, because index order decides which of them the index can serve. Equality columns followed by a range can narrow a common composite lookup, but that is a hypothesis and not a rule to put the most selective column first, since later columns may only filter without narrowing the traversal. Check the installed optimizer for capabilities such as skip scans before applying an absolute leftmost-prefix rule, and check the actual index bounds and rows visited.

<example>
For `WHERE device_id = 7 AND recorded_at < :cutoff ORDER BY recorded_at DESC LIMIT 20`, an index on `(device_id, recorded_at)` supplies bounds and order together and `EXPLAIN` shows no filesort.
</example>

If a predicate wraps an indexed column in a function, compare an equivalent range or a supported expression index while preserving time zone, collation, and null semantics, because the function hides the column from the index. For a calendar-day filter, derive half-open instant bounds before replacing the column-side date conversion. Check boundary results and the plan, not merely that the query mentions an indexed column.

<example>
`WHERE DATE(placed_at) = :day` becomes `placed_at >= :day_start AND placed_at < :next_day_start`, with both bounds computed in the application, and the midnight rows are compared before and after.
</example>

Add covering columns only when avoided table access outweighs the index width and write cost, because every added column makes each write maintain a wider index. Check actual reads, write latency, and index size before keeping the change.

<example>
Widening the index on `orders (customer_id)` with `status` and `total` to cover the account page is kept only if the plan shows the table reads gone and insert latency on `orders` stays within its budget.
</example>

Check how the installed engine covers a query before relying on an index-only plan, because PostgreSQL index-only scans still depend on visibility information and can perform heap fetches, InnoDB secondary indexes already carry the primary key, and SQLite has its own covering-index behavior.

<example>
On InnoDB an index on `(warehouse_id)` already contains `id`, so `SELECT id FROM shipments WHERE warehouse_id = 7` is covered without adding `id` to the index.
</example>

Write `INCLUDE`, partial-index, and concurrent-build syntax only for an engine whose documentation lists it, because these forms are not portable recipes.

<example>
`CREATE INDEX ON orders (customer_id) INCLUDE (total)` is PostgreSQL syntax, while a MySQL table gets the same cover by listing `total` as a second index column.
</example>

Inspect constraint-created indexes before adding duplicates, because primary keys and unique constraints already build one. PostgreSQL does not automatically index referencing foreign-key columns, whereas MySQL and MariaDB create a supporting index when none exists, and neither fact means every relationship needs an extra performance index.

<example>
Before adding `INDEX (book_id)` on `loans`, `SHOW CREATE TABLE loans` shows MySQL already created one for the foreign key, while the same foreign key on PostgreSQL leaves `loans.book_id` unindexed and a cascading book delete scans `loans`.
</example>

Before removing an apparently unused index, inspect representative traffic, rare jobs, constraint ownership, and rollback impact, because a monthly job may be its only user. Treat index advice copied from guides or other tools as a candidate and not as a measured speed promise.

<example>
`idx_payments_created` shows zero scans in `pg_stat_user_indexes`, but the quarterly tax export uses it, so it stays until that job has been checked.
</example>

## Inspect ORM behavior instead of method names

For an N+1 problem, measure statement counts as the result set grows, and compare explicit bounded eager loading, batched lookups, and supported joins while keeping only required columns and relationships, because joining several collections multiplies rows and can transfer more data than batching. Check parent cardinality before applying a page limit to a joined result. Check request latency, query count, payload size, and hydration cost, since a one-query implementation is not automatically the cheapest.

<example>
A dashboard that reads `project.owner` for each of 20 projects issues 21 statements, and loading the owners with one `WHERE id IN (...)` query gives 2 without joining the large `tasks` collection.
</example>

Check the installed ORM's transaction, loading, and pagination behavior before using framework-specific options, because defaults and option names differ between ORMs and releases. Keep the existing ORM facilities when they can express the verified fix, because a repository layer or an ORM replacement adds cost without evidence.

<example>
Before adding a `JOIN FETCH` to a Hibernate query, the installed version's documentation and a query log confirm what it emits for a page of 20.
</example>

Bind values through the driver and map dynamic identifiers such as sort columns to a fixed allowlist, because a placeholder cannot bind an identifier and string-built SQL invites injection.

<example>
`?sort=` goes through `{'price': 'unit_price', 'name': 'name'}.get(request.args.get('sort'), 'unit_price')` and never straight into the `ORDER BY`.
</example>

Keep tenant and authorization predicates on every generated path, because a raw query or relation shortcut that skips the model's default scope returns other tenants' rows.

<example>
The `tenant_id = :tenant` condition in the `Project` model's default scope is repeated in the hand-written `SELECT` behind the CSV export.
</example>

## Match pagination to its contract

For deep sequential browsing, evaluate keyset pagination against offset, using a total order with a unique tiebreaker, carrying every sort value in the cursor, and preserving filters and scope, because offset re-reads every skipped row and an order with ties can repeat or drop rows between pages. For descending `(created_at, id)`, continue strictly after the previous pair in that same order, using the engine's tuple comparison or an equivalent lexicographic predicate. Check null placement, mixed directions, and collation explicitly, and check with `EXPLAIN` which form the installed engine turns into index bounds.

<example>
The next page of the ledger view uses `WHERE posted_at < :p OR (posted_at = :p AND id < :i) ORDER BY posted_at DESC, id DESC LIMIT 20`, with the last row's `posted_at` and `id` carried in the cursor.
</example>

Keep offset pagination when sets are bounded or users need direct arbitrary-page navigation, and add an exact full-result count to a page only when the contract needs it, because counting a large filtered set can cost as much as fetching the page. Check the real plans at both shallow and deep positions.

<example>
The back-office customer list keeps `LIMIT 50 OFFSET 100` with page numbers, while the mobile app's history screen offers only "load older" and no "page 1 of 4,812".
</example>

For an export that needs one stable dataset, use an appropriate snapshot or an explicit fixed boundary, because keyset pagination alone does not freeze mutable sort values. Check ties, page joins, backwards traversal, insertions, deletions, and sort-key changes between requests.

<example>
The nightly inventory export fixes `max_id` and `updated_at <= :cutoff` at its start, so items edited during the export do not move between pages.
</example>
