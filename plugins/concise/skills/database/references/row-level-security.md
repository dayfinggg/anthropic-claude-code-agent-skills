# Row level security in PostgreSQL

- RLS does not apply to superusers, `BYPASSRLS` roles or the table owner. Apps often connect as the role that ran the migrations and owns the tables. Connect as a separate non-owner role, or run `ALTER TABLE t FORCE ROW LEVEL SECURITY`.
- A table with RLS enabled and no policy denies every row to non-owner roles while the owner still sees everything. Test policies while connected as the application role.
- Under RLS, an `UPDATE` or `DELETE` that filters on a column only sees rows that a SELECT policy allows, so a missing SELECT policy makes them change 0 rows with no error. `RETURNING` and `ON CONFLICT DO UPDATE` raise an error instead.
- `SET app.tenant_id = '42'` through a transaction pooler leaks into another client's transactions, which turns RLS into a cross-tenant leak. PgBouncer 1.26 tracks only parameters that PostgreSQL reports to clients, such as `search_path` on PostgreSQL 18+ and `default_transaction_read_only`. Set custom ones inside the transaction with `SELECT set_config('app.tenant_id', $1, true);`.
- A view reads its base tables with the view owner's rights and RLS context. Create views over RLS tables `WITH (security_invoker = true)` (PostgreSQL 15+).
- A `SECURITY DEFINER` function bypasses RLS, and every new function grants EXECUTE to PUBLIC. Revoke EXECUTE from PUBLIC in the same transaction that creates it, grant it to the roles that need it, and pin `SET search_path = app, pg_temp` on the function.
- Unique and foreign key checks ignore RLS, so a duplicate key error can reveal that another tenant's row exists. Put `tenant_id` into tenant-scoped unique keys.
- The 2026-11-12 minor releases fix two RLS bypasses: `INSERT ... ON CONFLICT` could read rows despite row security policies (CVE-2026-120154), and `DROP OWNED` could remove restrictive policies from tables the role did not own (CVE-2026-116311). Run 18.7, 17.12, 16.16 or 15.20 or later where RLS guards tenant data.
