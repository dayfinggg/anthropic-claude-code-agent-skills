# Recovery and runbooks

## Control the incident before experimenting

When recovery work starts on a production system, identify who currently owns the system, which changes are in flight, and which actions are authorized, and coordinate through the existing channel, because two people applying competing repairs to one server produce conflicting mutations. Check the current owner and the live state before acting.

<example>
Another administrator is already restarting Redis on the cache host, so `who` and `systemctl status redis` come first, and the two agree who acts before a second restart or a config change lands.
</example>

When customer harm is ongoing, choose a narrow, understood mitigation with an observable result, and preserve logs, operation identifiers, and relevant state when feasible, because an emergency mitigation need not wait for perfect causality, yet its side effects still matter. Check whether it reduces the impact and whether further mutation should stop.

<example>
Suspending the running import with `kubectl patch job nightly-import-29412000 -p '{"spec":{"suspend":true}}'` stops its pods and keeps the data, and suspending the `nightly-import` CronJob as well blocks the next run, while deleting the files it wrote would erase the evidence.
</example>

## Distinguish recovery operations

Before choosing a recovery command, identify what must recover, whether code, data, a primary database, or a half-finished deployment, because these are distinct operations and not interchangeable meanings of rollback, and a known command is not proof of a safe current target. Check the current state against the matching row of the table.

<example>
A bad release that has already written new `orders` rows can go back to the previous artifact with `ln -sfn releases/prev current` only if the old code still reads those rows, so the compatibility check comes before the symlink.
</example>

| Situation | Decision | Tradeoff and check |
| --- | --- | --- |
| Bad application revision with compatible state | Redeploy a verified previous artifact through the existing mechanism. | Faster than a new fix, but only safe if current data and configuration remain compatible. Verify both. |
| Corrupted or missing data | Evaluate the existing restore procedure and recovery point. | A restore can lose valid writes or restore corruption. Verify scope, consistency, and explicit authorization before replacement. |
| Unavailable primary with a standby | Evaluate failover readiness, replication lag, capacity, and writer ownership. | Faster routing can create competing writers or stale reads. Verify fencing and the authoritative primary. |
| Incomplete deployment after lost connectivity | Inspect real operation and resource state. | Blind retry may duplicate work. Verify what completed before resuming or reversing it. |

## Test restoration, not merely backup creation

When recovery assurance is requested, locate the existing recovery-time and recovery-point objectives instead of inventing numbers, because they are business decisions, and choose the smallest safe exercise that tests the actual recovery path. State what an isolated restore does not prove, such as production routing or full-load capacity, and check the promised scope.

<example>
Restoring last night's `pg_dump` archive with `pg_restore` into a scratch database named `booking_restore_test` measures restore time and row counts, and the result says that it does not exercise the failover path.
</example>

Before a restore the user requested, verify the backup identity, age, completeness, encryption-key access, target, available capacity, and application compatibility, and restore into an approved isolated destination first when feasible, because a completed backup job does not prove that the data is usable, and a drill that overwrites the live source loses the writes it was meant to protect. Before starting an application against a restored copy, switch off its outbound mail, webhooks, queue consumers, and scheduled jobs, because a restored copy that runs its cron entries acts on real customers. Check representative records, application reads and writes, and the measured recovery time.

<example>
`RESTORE VERIFYONLY FROM DISK = N'D:\Backups\ledger.bak'` confirms the backup is readable, `Get-PSDrive D` confirms room for the restore, and the backup loads into `ledger_restore_test`, where the app starts with the mail driver set to `log` and the scheduler disabled, before anything touches `ledger`.
</example>

When testing failover, follow the established procedure and check the replication lag, writer fencing, routing, credential availability, and the way back, because a faster cutover can sacrifice freshness, and a drill promoted to a production failover without authorization changes live traffic. Measure the recovery path and compare it with the existing objectives.

<example>
On a MySQL replica, the replica status statement that the installed version supports shows the lag before promotion, and the old primary is made read-only with `SET PERSIST super_read_only = ON`, which also blocks accounts holding `SUPER` or `CONNECTION_ADMIN` and survives a restart, so two writers never exist.
</example>

## Use and repair existing runbooks

When following a runbook, inspect prerequisites, target identifiers, required permissions, command effects, stop conditions, and expected results before executing, and verify the state after every mutating step instead of running the whole sequence blindly, because old instructions can encode expired assumptions.

<example>
A runbook step `docker compose -f /srv/inventory/compose.yaml restart api` is checked against `docker compose -f /srv/inventory/compose.yaml config --services` to confirm that the service name still exists, and the output after the restart is compared with the line the runbook expects.
</example>

When the task includes runbook upkeep, correct the existing procedure where evidence showed a gap, and include only what identifies the target, acts safely, verifies recovery, and escalates, because more detail helps an unfamiliar responder but stale duplicated commands increase risk. Rehearse the changed path in an authorized environment.

<example>
The restore runbook for `shop` gets one corrected line with the new dump path `/srv/backups/shop/` and the check `ls -l /srv/backups/shop/ | tail -n 3` on the server, and no new document.
</example>
