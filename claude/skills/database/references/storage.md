# Storage and schema

## Choose storage from required operations

When choosing or questioning a store, start from the operation that must become correct or faster, and establish its read and write shapes, atomic boundary, cardinality, growth, ordering, and consistency requirement, because storage fitness is a property of operations and not of a category. Use observed traffic for an existing system, label load assumptions for a new one, and keep the existing store unless an unmet requirement justifies the migration and its operational cost. Check that the recommendation names the operation it serves.

<example>
A request to make the order history screen faster starts by counting that the endpoint runs 14 statements against PostgreSQL, and the fix is one join and an index, not a document store.
</example>

When queries need changing joins or relationships require database enforcement, evaluate a relational model first, because a storage category's popularity is not evidence that the current engine cannot serve them. Check the important queries and concurrent invariants on representative data.

<example>
Books, authors, and subjects in a library catalog stay in PostgreSQL tables, where `book_subjects` enforces which book has which subject and "books by subject" is a join.
</example>

When related data has shared ownership and is normally read and changed together, consider a bounded document, and reference separately growing or shared entities instead of embedding an unbounded collection, because an ever-growing embedded array slows every update and creates write contention. MongoDB single-document atomicity does not make a multi-document operation atomic. Check document growth and update contention.

<example>
A product document embeds its 3 to 5 `variants`, while its reviews, which grow without bound, live in a separate collection that stores the product id.
</example>

For DynamoDB, map each required request to a partition key, sort key, or index before choosing table boundaries, and compare hot-key concentration, item collection size, and read and write capacity, because the key design fixes which requests are cheap. Single-table design is useful for data locality and is not a universal target, and separate operational requirements can justify several tables. Check the read consistency of the chosen path, since a global secondary index cannot provide strongly consistent reads.

<example>
"Latest readings per device" maps to partition key `device_id` and sort key `recorded_at`, and a read that must see a just-saved reading goes to the base table with a strongly consistent read, not to a global secondary index.
</example>

Measure requests, transferred data, and failure behavior before replacing a join with application fan-out, and when denormalization fixes a measured read cost, name the authoritative value and its update mechanism, because a copy without an owner drifts. Check stale copies and partial update failures before relying on the duplicate.

<example>
Copying `project_name` into `tasks` to avoid a join is accepted only with `projects.name` as the source and an update step that refreshes the copies when a project is renamed.
</example>

## Model relationships and enforce invariants

When the members of a relationship need searching, joining, or independent validation, store them as relational rows and not as delimiter-separated identifiers, because a comma list cannot enforce uniqueness or references and cannot use an index for lookup. A many-to-many table can enforce a unique pair and both parent references, and opaque text can stay text when no operation needs its individual members. Check membership queries, duplicate rejection, and parent deletion behavior.

<example>
`students.course_ids = '3,17,42'` becomes an `enrollments` table with primary key `(student_id, course_id)` and foreign keys to both parents.
</example>

Derive uniqueness from the business identity and not from the presence of a synthetic `id`, and for tenant-scoped identities decide whether uniqueness must include the tenant, because an auto-increment key makes every row unique and so enforces nothing about duplicates. Where the schema supports it, a composite foreign key can stop a child from referencing another tenant's parent. Check duplicate business keys and cross-tenant references directly.

<example>
Two tenants in one database may both create a `billing` project, so `projects` is unique on `(tenant_id, slug)` and a bare unique index on `slug` would wrongly reject the second tenant.
</example>

Do not put a cross-row query inside a PostgreSQL `CHECK` and treat it as an invariant, because the check runs only for the row being written and later changes to other rows are not re-checked. Express a cross-row rule with a unique index, an exclusion constraint, a foreign key, or a guarded write.

<example>
A `CHECK (is_username_free(username))` function that queries `accounts` passes at insert and stays silent when a later update creates a duplicate, so a unique index on `username` carries the rule.
</example>

Choose natural, surrogate, or composite keys from stability, width, external exposure, and the actual lookup patterns, and keep business uniqueness as a separate constraint when introducing a surrogate, because every reference and index inherits the key choice. In InnoDB the primary key is carried by every secondary index entry, so compare real index sizes and write behavior before changing a key representation, and judge each table on its own lookups instead of mandating UUIDs or integer identities everywhere.

<example>
Switching `shipments` from `INT UNSIGNED` to a random `CHAR(36)` UUID primary key on InnoDB inflates every secondary index, so the change first compares `INDEX_LENGTH` in `information_schema.TABLES` for both designs after `ANALYZE TABLE` on each.
</example>

Check existing data for violations before adding enforcement, and confirm that enforcement is actually on, because a constraint that cannot be added cleanly or is silently off gives false assurance. In SQLite, foreign-key enforcement is a per-connection setting that cannot change inside a transaction, so verify it on the connection that writes and do not infer it from an ORM relationship declaration.

<example>
A SQLite-backed script that calls `sqlite3.connect()` anew on each run executes `PRAGMA foreign_keys = ON` right after connecting, since the setting does not persist.
</example>

In MySQL and MariaDB, confirm the table's storage engine and look for the indexes that foreign keys create automatically before adding enforcement or duplicate indexes, because a MyISAM table accepts a `FOREIGN KEY` clause and ignores it. Check existing violations first.

<example>
Before adding a foreign key from `bookings.room_id`, `SHOW CREATE TABLE bookings` confirms `ENGINE=InnoDB`, and `SELECT b.id FROM bookings b LEFT JOIN rooms r ON r.id = b.room_id WHERE b.room_id IS NOT NULL AND r.id IS NULL` lists the orphaned bookings.
</example>

## Choose types from meaning

For monetary amounts, use supported exact decimal arithmetic or integer minor units with an explicit scale and currency, and keep binary floating point out of the calculation, because rounding error accumulates in sums and breaks reconciliation. Do not assume every currency has two fractional digits. PostgreSQL `numeric` and MySQL `DECIMAL` hold exact values, while SQLite `DECIMAL` affinity alone does not give that guarantee. Check rounding, negative values, overflow, aggregation, and driver round trips.

<example>
Line totals are stored as `DECIMAL(12,4)` with a currency code column, and the Java code reads them as `BigDecimal` and never through `double`, so `SUM()` matches the invoice.
</example>

Separate instants, calendar dates, durations, and local appointments, because each behaves differently under time-zone and daylight-saving changes. PostgreSQL `timestamptz` preserves an instant and not the original named zone, MySQL `TIMESTAMP` and `DATETIME` have different conversion and range behavior, and SQLite needs an explicit representation and unit. Keep a named zone in its own column when future local scheduling needs it. Check session-zone changes, daylight-saving boundaries, precision, and serialization.

<example>
A clinic appointment booked for 08:00 `Europe/Berlin` stores the local time and the zone name, because a stored UTC instant would land an hour off after the clock change.
</example>

Use `NULL` only for a defined missing-value meaning, and do not replace it with a fake zero or empty string to simplify queries, because the fake value is counted, summed, and joined as real data. A nullable `CHECK` passes on unknown and nullable uniqueness differs between engines, so check null operands, aggregates, and duplicate null-containing keys. For absence checks, define null matching first and then choose `NOT EXISTS` or another form, because `NOT IN` with a nullable right side can reject every candidate.

<example>
`SELECT id FROM orders WHERE customer_id NOT IN (SELECT customer_id FROM blocked_customers)` returns no rows once one `blocked_customers.customer_id` is `NULL`, so the query uses `NOT EXISTS`.
</example>

For a genuinely fixed domain, a supported enum or check can be appropriate, and for business-managed choices with labels, retirement, or frequent additions, evaluate reference rows with a foreign key, because changing an enum is a schema change and it cannot carry labels or retirement. Check historical values and how the application obtains all permitted choices, since existing data values are not the full permitted domain.

<example>
`invoices.status` with `draft`, `sent`, and `paid` can be an enum, while expense categories that finance staff add and retire become an `expense_categories` table with an `is_active` flag.
</example>
