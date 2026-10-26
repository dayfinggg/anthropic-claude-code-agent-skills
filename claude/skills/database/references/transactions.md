# Transactions and concurrency

## Contents

- Choose the invariant before the mechanism
- Check isolation through an executable schedule
- Apply the actual engine's semantics
  - PostgreSQL
  - MySQL InnoDB
  - SQLite
- Diagnose deadlocks and bound retries

## Choose the invariant before the mechanism

Identify which reads and writes must succeed together, including implicit ORM flushes and every connection that takes part, and put the dependent database operations in one transaction while keeping network requests and user interaction outside its lock-holding interval, because a partial business change is hard to repair and a lock held across a slow call blocks other writers. A transaction method name alone does not prove the boundary. Check that a failure between the writes leaves no partial business change.

<example>
Placing an order inserts the `orders` row and its `order_items` rows inside one `with conn.transaction():` block on a single psycopg connection, and the call that sends the confirmation email runs after the block exits.
</example>

For one-row arithmetic or a state transition, prefer a supported atomic conditional update over reading a value and writing a literal back, because a concurrent writer can change the row between the read and the write. Check simultaneous contenders and the committed result.

<example>
Claiming a seat runs `UPDATE seats SET holder = :user WHERE id = 12 AND holder IS NULL`, and not a `SELECT` of `holder` followed by an `UPDATE` that writes the user.
</example>

Put the guard in the write condition, increment the version in a version-checked edit, and inspect the affected-row count, because zero matches means a conflict or a missing row and not success.

<example>
`UPDATE reservations SET status = 'confirmed', version = version + 1 WHERE id = 812 AND version = 7` is followed by a check that `RowsAffected()` is 1, because 0 means another request changed the row first.
</example>

On MySQL, ask the driver for matched rows or increment a version column so that the affected-row count stays meaningful, because the server reports changed rows by default and an update that writes identical values reports 0 although the row matched.

<example>
A Go service using `go-sql-driver/mysql` sets `clientFoundRows=true` in its DSN, so a repeated confirm of reservation 812 reports 1 affected row and not 0.
</example>

When the affected-row count shows a conflict, re-read and retry or return the conflict to the caller according to the user-visible contract, because the caller must learn whether its change was applied.

<example>
A `PUT /reservations/812` with a stale version returns 409 with the current version, while a background counter job re-reads the row and applies its change again.
</example>

Enforce uniqueness with a supported unique constraint or an atomic conditional create and not with an application precheck, because a precheck does not stop another writer between the check and the insert. Define whether a repeated request returns its previous result or performs another operation, since an upsert that increments a value is not idempotent merely because it is an upsert. Check duplicate delivery and an ambiguous response after commit.

<example>
A checkout handler that runs `SELECT COUNT(*)` on `payments` before inserting lets two double-clicks both pass, while a unique key on `(order_id, idempotency_key)` makes the second submit return the first payment's id.
</example>

## Check isolation through an executable schedule

Drive an isolation claim with separate connections and synchronization barriers and observe successful commits, returned values, blocking, and error codes, because a sleep-based test passes or fails by luck. Run only the schedules relevant to the changed invariant.

<example>
Two sessions driven by a short script that releases each step in a fixed order reproduce the double booking of one seat, while a `Thread.sleep(1000)` in a JUnit test does not.
</example>

To test a read-modify-write path for a lost update, have both sessions read the value and both write the computed literal, because if both commit and the final value reflects only one change, the other update was lost. Compare an atomic increment or a version condition as the fix.

<example>
Two sessions read `products.stock` as 100 and both write 99, and a final 99 after two sales is the lost update that `SET stock = stock - 1` removes.
</example>

To test a report that spans several rows for read skew, let one session read part of a multi-row invariant while another changes and commits both rows, then let the first read the remainder, because a mismatch shows the report did not see a coherent snapshot.

<example>
A report reads `departments.headcount` and then counts rows in `employees` while an HR import moves 5 employees between departments, and the two totals disagree.
</example>

To test a cross-row rule for write skew, let two sessions each observe the same satisfied rule and each change a different row, because if both commit and the rule is now broken, stable per-row snapshots did not protect it.

<example>
Two on-call engineers each see two engineers marked on duty in the `rota` and each mark a different one off duty, and both commits succeed with nobody on call.
</example>

To test for an absence race, let both sessions observe that no conflicting row exists and then insert one, and check whether a unique constraint covers the actual conflict, because overlapping intervals with different start times pass a uniqueness check on the start column.

<example>
Two bookings for the `room-4` meeting room both see no overlap and insert `10:00` to `11:00` and `10:30` to `11:30`, and a unique key on `start_time` accepts both.
</example>

For a cross-row rule, evaluate an enforceable constraint or a shared guard row used by every writer, with serializable transactions and bounded retries as another candidate, because locking only each writer's separate target row does not protect a rule that spans rows. Check the failure schedule again after the change, including inserts into a previously empty result set.

<example>
To cap a customer at 5 active subscriptions under Read Committed, every path that adds a subscription first locks that customer's `customers` row with `SELECT ... FOR UPDATE`, then counts and inserts.
</example>

## Apply the actual engine's semantics

### PostgreSQL

Check the configured isolation level and do not rely on the default, because Read Committed gives each statement its own snapshot, Repeatable Read stabilizes reads but can still allow serialization anomalies, and Serializable can reject a conflicting execution instead of blocking. Check both the conflict path and the successful path.

<example>
A report job that runs three queries under Read Committed sees three snapshots, so it opens with `BEGIN ISOLATION LEVEL REPEATABLE READ` to get one.
</example>

Retry the whole transaction after a serialization failure, including the decisions based on earlier reads, because a retry that reuses the earlier read results repeats the conflict. Check the successful retry as well as the failure.

<example>
On SQLSTATE `40001` the Ruby wrapper re-runs the whole block, including the `SELECT` that picked which driver gets the delivery, up to 3 times.
</example>

For existing-row coordination, choose the least restrictive supported row lock that protects the operation, because a stronger lock blocks writers the rule does not concern. A missing row is not locked merely because a query returned nothing, and advisory locks protect only cooperating clients, so check that every competing writer follows the mechanism.

<example>
Editing an `invoices` row uses `SELECT ... FOR NO KEY UPDATE`, which does not block `invoice_lines` inserts that reference it, while `FOR UPDATE` does.
</example>

Take a guard lock before reading the data it protects, because a lock acquired after a snapshot was taken does not refresh that snapshot. If the snapshot predates the lock, choose a fresh valid view or a mechanism that detects the conflict.

<example>
A coupon redemption path that takes `pg_advisory_xact_lock` as the first statement of a Repeatable Read transaction still counts against a snapshot taken before the lock was granted, so it runs the lock, the count, and the insert in a Read Committed transaction, where each statement takes a fresh snapshot.
</example>

Use `SKIP LOCKED` for queue-style work distribution and not for business queries, because it silently omits locked rows and so returns an inconsistent answer.

<example>
A job worker claims one `jobs` row with `FOR UPDATE SKIP LOCKED`, while the dashboard count of pending jobs uses a plain `SELECT COUNT(*)`.
</example>

### MySQL InnoDB

Check the configured isolation level and `autocommit` before reasoning about a MySQL or MariaDB transaction, because with `autocommit` on each statement is its own transaction and a locking read releases at once. Under Repeatable Read, plain consistent reads and locking reads need not observe the same state, so do not transfer PostgreSQL snapshot behavior to InnoDB.

<example>
A `mysql2` script with `autocommit` on holds no lock after `SELECT ... FOR UPDATE` returns, and inside `START TRANSACTION` a plain `SELECT` can show the old row after another session's commit while the locking read shows the new one.
</example>

Inspect the real plan and the competing transactions before reasoning about protected rows or gaps, because range and gap locking depend on the isolation level, the predicate, and the index actually scanned. Check which index the locking statement uses.

<example>
`UPDATE licenses SET active = 0 WHERE license_key = 'x'` with no index on `license_key` scans and locks far more rows than expected, which `EXPLAIN` shows before the deadlock reports arrive.
</example>

Distinguish a deadlock from a lock-wait timeout before choosing the retry, because InnoDB rolls back the whole transaction on a deadlock but normally only the statement on a timeout, unless configuration changes that. Check the driver and transaction state first, roll back any surviving partial transaction before replaying the complete business unit, and leave server rollback settings alone, because changing them hides an application error.

<example>
A `MySqlException` with number 1213 means the transaction is gone and can be re-run, while 1205 means earlier statements may still hold locks, so the C# code rolls back before re-running.
</example>

### SQLite

Check journal mode and connection boundaries, because WAL permits overlapping readers and one writer and not several concurrent writers. Check with the actual driver and journal mode.

<example>
A background sync and the Python readers of a desktop app share `local.db` in WAL mode, so readers continue during the sync while a second sync process gets `SQLITE_BUSY`.
</example>

For a known short read-then-write unit, evaluate `BEGIN IMMEDIATE`, because a stale read snapshot cannot always be upgraded to a write transaction. On `SQLITE_BUSY_SNAPSHOT`, restart from a fresh transaction and not by retrying the write against stale reads, since the earlier reads no longer hold.

<example>
A counter update runs `BEGIN IMMEDIATE`, reads, and writes, and a second writer that gets `SQLITE_BUSY` from its own `BEGIN IMMEDIATE` retries it within the busy timeout, while a deferred transaction that read first and then fails with `SQLITE_BUSY_SNAPSHOT` rolls back and repeats the read as well as the write.
</example>

## Diagnose deadlocks and bound retries

Reconstruct the wait cycle from the conflicting statements, acquired locks, transaction age, and plans, and in InnoDB read the recorded deadlock before assuming the visible last statement caused it, because the statement that reports the error is only the victim. Acquire shared objects in a consistent order, shorten the locked interval, and consider an index only when the plan shows avoidable scanning and its total cost is acceptable. Check the original interleaving and a representative concurrent load.

<example>
`SHOW ENGINE INNODB STATUS` lists the `LATEST DETECTED DEADLOCK` with one transaction updating `accounts` then `ledger_entries` and the other doing the reverse, so both paths now update `accounts` first.
</example>

Retry only classified transient failures within a bounded attempt count and request deadline, because endless retries amplify load and replaying a permanent error cannot succeed. Do not retry validation errors or permanent uniqueness conflicts.

<example>
A deadlock gets up to 3 retries inside a 5 second request budget, while a unique-key violation on `users.email` is returned to the caller at once.
</example>

Roll back before replaying an aborted unit, because the aborted attempt may still hold locks and its partial writes would otherwise mix with the replay.

<example>
After a lock-wait timeout the Go handler calls `tx.Rollback()` and only then re-runs the whole order placement in a new transaction.
</example>

If a connection fails during commit, resolve the unknown outcome by the operation's idempotency key or authoritative business state before issuing another externally visible action, because the commit may have succeeded and a blind replay would duplicate it.

<example>
A dropped connection during `COMMIT` checks the `client_token` row before the notification email is sent again.
</example>
