## Prisma versions

- `npm install prisma` and `npx prisma` now install the Prisma ORM 8 CLI, because npm `latest` for `prisma` is `8.0.0-rc.33` while `@prisma/client` stays at `7.10.1`. The v8 CLI does not read `schema.prisma` and has no `generate`, `migrate dev` or `db push`. It exits with `CLI.COMMAND_MOVED`.
- In a Prisma 7 project, pin `"prisma": "^7"` and `"@prisma/client": "^7"` in `package.json`, install with `npm install --save-dev prisma@7`, and run `npx prisma@7` in CI and one-off commands.
- Unversioned pages on prisma.io describe Prisma 8. Prisma 7 docs live under `/docs/orm/v7` and its CLI reference under `/docs/cli/v7`.
- Prisma 8 general availability was expected in October 2026 and it is still a release candidate. Prisma 7 gets fixes for 18 months after Prisma 8 GA. Prisma 6 gets security patches only, until 2026-11-19.
- Prisma Accelerate retires on 2026-12-01. Replace its pooling with the provider's pooler or the Prisma Postgres pooled URL. Its query cache (`cacheStrategy`) has no replacement.

## Prisma 7

- The CLI takes its connection from `datasource.url` in `prisma.config.ts`, not from `url` or `directUrl` in `schema.prisma`. Put the direct URL there for migrations and pass the pooled URL to the driver adapter at runtime.
- The CLI does not load `.env` by itself. Start `prisma.config.ts` with `import "dotenv/config";`. Bun loads `.env` on its own.
- `migrate dev` and `db push` no longer run `prisma generate` or the seed script. Run `prisma generate` and `prisma db seed` yourself after them.
- Every database needs a driver adapter, such as `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`. The `prisma-client` generator needs an explicit `output`, and code imports the client from that path.
- Pool settings now come from the driver. The `pg` adapter defaults to `max: 10` and `connectionTimeoutMillis: 0`, which waits forever where v6 timed out. Set both on the adapter, which replaces v6's `connection_limit`, `pool_timeout` and `connect_timeout` URL parameters.
- Prisma 7 validates TLS certificates where v6 ignored invalid ones, which surfaces as `P1010`. Trust the CA with `NODE_EXTRA_CA_CERTS` or `node --use-openssl-ca` instead of turning off certificate checks.

## Prisma 8

- Prisma 8 is the `prisma` CLI plus one library per database: `@prisma/orm-postgres` (release candidate), `@prisma/orm-mongo` (early access), `@prisma/orm-mysql` (early preview), `@prisma/orm-sqlite` (experimental). MariaDB, SQL Server and CockroachDB stay on Prisma 7.
- CLI and library versions differ by design. Install both at `latest` and keep exactly one copy of the `@prisma/orm-*` libraries, checked with `npm ls @prisma/orm-framework`.
- Needs Node.js 22.18+, 24.11+ or 26+, and TypeScript 5.9+.
- The schema file is `contract.prisma`. `prisma generate` becomes `prisma contract emit` (commit `contract.json` and `contract.d.ts`). `migrate dev` becomes `prisma db update`, or `prisma migration plan` then `prisma db migrate`. `migrate deploy` becomes `prisma db migrate`, `db pull` becomes `prisma contract infer`, and `db push` becomes `prisma db init` on an empty database and `prisma db update` after that. There is no `db seed` and no `studio`.
- A Prisma 8 `.prisma` contract file must start with the line `// use prisma-8`. `prisma contract emit` silently skips a file without it. `prisma orm init` writes the line, so add it only to files created by hand.
- Missing in Prisma 8: `$extends` (use middleware), `{ increment: n }`, filters inside JSON, nested writes beyond `create`, `connect` and `disconnect`, transaction `isolationLevel` and `timeout`, `omit`, and `P2002`-style codes. Detect a unique violation with `error.sqlState === "23505"`.
- Move a running Prisma 7 app with `npx prisma@latest orm init --from-prisma7-schema prisma/schema.prisma`, which keeps v7 as a `prisma7` command, rather than with a new-project install.

## Drizzle

- orm.drizzle.team documents the 1.0 RC API. On 0.45 the names differ: `relations()` per table instead of `defineRelations()`, `.enableRLS()` instead of `pgTable.withRLS()`, `drizzle({ casing })` instead of `snakeCase.table()`, `getTableColumns()` instead of `getColumns()`, and `drizzle-zod` instead of `drizzle-orm/zod`.
- `withReplicas()` on 0.x sends reads to a replica automatically, so a read right after a write can miss it. 1.0 sends everything to the primary unless the query goes through `db.$replica`.
- Upgrade to 1.0 with `drizzle-orm@rc` and `drizzle-kit@rc`, then run `drizzle-kit up` to convert the migrations folder (no `journal.json`, one folder per migration). Relational Queries v1 is removed, so move relations to `defineRelations()` and pass them as `drizzle(url, { relations })`. `drizzle-kit drop` is gone.
- In 1.0, relational query filters throw on an explicit `undefined` value. Omit the key instead.
- drizzle-kit 1.0 does not prompt in a shell without a TTY, which includes agent shells. When `generate` or `push` hits a possible rename or data loss, it exits 2 and lists the open decisions. Rerun the same command with `--hints-file hints.json` holding one `rename`, `create` or `confirm_data_loss` entry per decision. `--output json` returns the list as JSON.
- Do not edit `snapshot.json` files by hand. To change a migration that no database has run yet, delete its folder and run `generate` again.
- `drizzle-kit push` and `pull` in 1.0 manage every schema, where 0.x managed only `public`. Set `schemaFilter` before pushing to a shared database such as Supabase. `push` asks before data loss unless `--force`, and `push --explain` prints the SQL first.
