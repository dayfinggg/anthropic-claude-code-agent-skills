# Migrations and agent access

## Expand and contract

1. Expand. Add nullable columns, tables, or indexes that current code ignores.
2. Deploy code that writes both shapes and reads the new one with a fallback.
3. Backfill in batches, with a pause between them, outside one big transaction.
4. Switch reads to the new shape and add constraints.
5. Contract. Remove the old column or field in a later release, once nothing reads it.

## PostgreSQL details for populated tables

- Create indexes with `CREATE INDEX CONCURRENTLY`. It cannot run inside a transaction block, so turn off the migration tool's transaction wrapper for it.
- A failed concurrent build leaves an INVALID index. Drop it and build again.
- Add foreign keys and checks as `NOT VALID`, then run `VALIDATE CONSTRAINT` in a separate step.
- Set a short `lock_timeout` for the migration, so it does not queue behind long transactions and block all later queries.
- Set a longer `statement_timeout` for the backfill.

## Agent access

- Give an agent only the credentials its task needs. Keep development and production apart in infrastructure, because a prompt instruction does not enforce a boundary.
- Enforce read-only access with a database role. A read-only transaction in a tool can be escaped with stacked statements.
- Send one statement per call.
- Run `DROP`, `TRUNCATE`, deletes without `WHERE`, and bulk updates only when the user asks. Name the target and confirm a verified backup first.
- Check the backups and rollback options before telling the user that data is lost.
