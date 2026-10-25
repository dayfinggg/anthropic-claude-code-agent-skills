# Migration and validation

## Attach checks before implementation

For each acceptance criterion, choose the lowest-cost check that can actually observe the claimed result, distinguish rule-level tests, integration checks, and behavior through the real interface, reuse the project's checks before proposing new infrastructure, and record the environment, data, command or interaction, and expected evidence, because a cheap check that cannot see the claimed result passes whether or not the work is correct.

<example>
The criterion "a refunded order disappears from the revenue report" is checked by `pytest tests/reports/test_revenue.py` against a seeded database, and not by a unit test of `refund_amount()` alone.
</example>

For behavior changes, plan a reproduction or failing behavior test before the fix where tests exist, and for behavior-preserving changes identify the unchanged results to compare. Include a boundary check when isolated unit tests cannot exercise the affected interaction, and keep unavailable checks explicit instead of replacing them with syntax validation, because a fix that was never seen failing may not fix anything and a lint pass says nothing about behavior.

<example>
Before changing `parse_price()`, add a failing case for `"1.234,50"`, and when the staging payment sandbox is unreachable, list the checkout check as unavailable and not as "type-checked".
</example>

When verification could charge money, send messages, or modify live data, identify an isolated environment or a harmless observation, and treat replayed traffic and synthetic load as unsafe until shown otherwise, because both can still trigger real side effects.

<example>
Replaying last night's webhook log against staging waits until `SMTP_HOST` there points to a capture server, since the log contains real customer addresses.
</example>

## Plan a compatible transition

When old and new consumers cannot move atomically, inventory the writers, readers, versions, and deployment order, then plan an expansion that supports the old contract, the migration of consumers, and a removal only after evidence shows the old path is unused, with verification at each transition and not only at the end, because a single cutover cannot be partly undone when one consumer lags behind.

<example>
To rename `orders.total` to `orders.grand_total`, add the new column and write both, move readers one service at a time, and drop `total` only after the query log shows no reads.
</example>

For an API or schema change, check both directions of compatibility during the overlap and identify what older software will read after newer software writes, because a code rollback is not a recovery plan if it cannot interpret the resulting state.

<example>
After the new service writes `status = 'PENDING_REVIEW'`, the old worker's `Status` enum raises on that value, so the rollback plan first maps those rows back to a known status.
</example>

When migrating stored data, identify the authoritative source and the invariants the transformation must preserve, and plan representative samples, reconciliation, and verification through the consumer, choosing checks for user-important consistency and not counts alone, because equal row counts can hide wrong values.

<example>
After moving addresses into `customer_addresses`, compare the shipping labels the label service renders for 200 sampled customers against the old table, in addition to the row count.
</example>

For a long-running migration, specify bounded batches, progress evidence, interruption behavior, and safe restart conditions, and verify how concurrent writes are handled before scheduling the cutover, because retrying a partial transformation can apply it twice or skip rows.

<example>
The backfill handles 5,000 ids per batch, records the last id in `migration_cursor`, and uses an upsert, so a restart after a crash repeats no row's effect.
</example>

Before removing compatibility code or an old store, define the evidence that all required consumers have moved, include a final check for remaining uses, and add a way to detect reintroduction where the project already supports it, because removal is the step that turns a missed consumer into an outage.

<example>
Before deleting `legacy_orders`, search the repositories and job configs for the table name, read the database access log for its last read, and add a lint rule against new references if the project runs one.
</example>

## Design rollout gates from available signals

When live rollout is in scope, separate deployment from feature exposure where the existing system permits it, choose batches small enough to limit damage and large enough to observe the relevant workload, and reuse existing controls instead of importing a feature-flag system just to fill the plan, because a new mechanism adds its own failure modes to a rollout that is already risky.

<example>
Deploy the new pricing code dark behind the existing `settings.PRICING_V2` toggle, then enable it for the internal tenant first.
</example>

Before a rollout stage, name its population, observation window, baseline, and its pass, hold, and rollback signals, using existing user-impacting indicators and accepted thresholds, and require enough representative work to evaluate the stage. For asynchronous processing cover complete work units, and check whether shared dependencies could hide a failure in both populations, because a stage without defined signals ends when someone loses patience and not when the evidence is in.

<example>
The pilot tenants' checkout traffic goes to the new path, the `payment_failed` rate is compared with the old path's baseline over a full day that includes the nightly batch, and the stage holds if the rates differ beyond the team's existing alert threshold.
</example>

Take rollout percentages, waiting periods, and latency targets from the project's existing practice or from the user, and when signals or controls are missing, plan their prerequisite or state why safe progression cannot yet be decided, because a made-up number reads as an agreed safeguard.

<example>
No dashboard tracks `payment_failed` per tenant, so the plan's first increment adds that metric and the rollout stage stays conditional on it.
</example>

## Establish recovery before irreversible work

Identify the last reversible point and what rollback restores at each stage, separate application rollback, configuration rollback, and restoration or repair of changed data, and name the trigger, required access, known-good artifact or state, and the check that proves recovery, because rolling back code alone leaves changed data in place.

<example>
For the stage with `ALTER TABLE orders DROP COLUMN note`, the plan states that redeploying the previous release restores the code but not the column, names the nightly snapshot as the known-good state, and proves recovery by restoring it to staging and running `pytest tests/smoke`.
</example>

When recovery depends on a backup, require evidence that the relevant state can be restored in the intended environment, because a backup's presence or replicated copies are not proof, and identify the acceptable data loss and outage limits from actual requirements. Plan a safe recovery rehearsal when it is needed and permitted, because an untested backup is only a hope.

<example>
The plan cites the last successful restore test of the `orders` snapshot or schedules one in staging before the migration, and records the recovery point the user stated.
</example>

If rollback would discard valid writes or a transformation is irreversible, make that limit explicit before cutover, select an evidenced forward repair or restoration path, and escalate the material risk to the user when no permitted recovery satisfies the requirement, continuing past that boundary only on their decision, because proceeding silently turns a recoverable plan into a gamble.

<example>
Once customers place orders in the new `orders_v2` table, a rollback would drop those orders, so the plan names a forward fix that copies them back and asks the user before cutover if that copy cannot be tested.
</example>
