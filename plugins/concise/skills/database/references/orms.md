# Prisma and Drizzle

## Contents

- Prisma versions
- Prisma 7
- Prisma 8
- Drizzle
- Hosted PostgreSQL poolers

## Prisma versions

- `npm install prisma` and `npx prisma` now install the Prisma ORM 8 CLI, because npm `latest` for `prisma` is an 8.0.0 release candidate while `@prisma/client` stays at 7.10.1. The v8 CLI does not read `schema.prisma` and has no `generate`, `migrate dev` or `db push`.
- In a Prisma 7 project, pin `"prisma": "^7"` and `"@prisma/client": "^7"` in `package.json`, install with `npm install --save-dev prisma@7`, and run `npx prisma@7` in CI and one-off commands. `npm ls prisma @prisma/client` shows what is installed.
- Unversioned pages on prisma.io describe Prisma 8. Prisma 7 docs live under `/docs/orm/v7` and its CLI reference under `/docs/cli/v7`.
- Prisma 8 has no general availability date yet. Prisma 7 gets bug and security fixes for 18 months after Prisma 8 GA. Prisma 6 gets security patches only, until 2026-11-19.
- Prisma Accelerate retires on 2026-12-01. Replace its pooling with the provider's pooler or the Prisma Postgres pooled URL. Its query cache (`cacheStrategy`) has no replacement.

## Prisma 7

- The CLI takes its connection from `datasource.url` in `prisma.config.ts`, not from `url` or `directUrl` in `schema.prisma`. Put the direct URL there for migrations and pass the pooled URL to the driver adapter at runtime.
- The CLI does not load `.env` by itself. Start `prisma.config.ts` with `import "dotenv/config";`. Bun loads `.env` on its own.
- `migrate dev` and `db push` no longer run `prisma generate` or the seed script. Run `prisma generate` and `prisma db seed` yourself after them.
- Every database needs a driver adapter, such as `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`. The `prisma-client` generator needs an explicit `output`, and code imports the client from that path.
- Pool settings come from the driver. The `pg` adapter defaults to `max: 10` and `connectionTimeoutMillis: 0`, which waits forever where v6 timed out. Set both on the adapter, which replaces v6's `connection_limit`, `pool_timeout` and `connect_timeout` URL parameters.
- Prisma 7 validates TLS certificates where v6 ignored invalid ones, which surfaces as `P1010`. Trust the CA with `NODE_EXTRA_CA_CERTS` or `node --use-openssl-ca` instead of turning off certificate checks.

## Prisma 8

- Prisma 8 is the `prisma` CLI plus one library per database, such as `@prisma/orm-postgres` (release candidate) and `@prisma/orm-mongo`. MariaDB, SQL Server and CockroachDB stay on Prisma 7.
- CLI and library versions differ by design. Install both at `latest` and keep exactly one copy of the `@prisma/orm-*` libraries, checked with `npm ls @prisma/orm-framework`. `@prisma/orm-postgres` needs the `temporal-polyfill` peer dependency, which Yarn does not install by itself.
- Needs Node.js 22.18+, 24.11+ or 26+, and TypeScript 5.9+.
- The schema file is `contract.prisma`. `prisma generate` becomes `prisma contract emit` (commit `contract.json` and `contract.d.ts`). `migrate dev` becomes `prisma db update`, or `prisma migration plan` then `prisma db migrate`. `migrate deploy` becomes `prisma db migrate`, `db pull` becomes `prisma contract infer`, and `db push` becomes `prisma db init` on an empty database and `prisma db update` after that. There is no `db seed`.
- `prisma db update` changes whatever database `DATABASE_URL` names. Check that value before running any `db` command in a project that sits next to a Prisma 7 app.
- A Prisma 8 `.prisma` contract file must start with the line `// use prisma-8`. `prisma contract emit` silently skips a file without it. `prisma orm init` writes the line, so add it only to files created by hand.
- Missing in Prisma 8: `$extends`, atomic `increment`, filters inside JSON, most nested writes, transaction isolation levels, and `P2002`-style codes. Detect a unique violation with `error.sqlState === "23505"`.
- Move a running Prisma 7 app with `npx prisma@latest orm init --from-prisma7-schema prisma/schema.prisma` and the incremental migration guide, rather than with a new-project install.

## Drizzle

- npm `latest` is drizzle-orm 0.45.4 with drizzle-kit 0.31, and 1.0.0-rc.5 is on the `rc` tag. orm.drizzle.team documents the 1.0 RC API. On 0.45 the names differ: `relations()` per table instead of `defineRelations()`, `.enableRLS()` instead of `pgTable.withRLS()`, `drizzle({ casing })` instead of `snakeCase.table()`, `getTableColumns()` instead of `getColumns()`, and `drizzle-zod` instead of `drizzle-orm/zod`.
- `withReplicas()` on 0.x sends reads to a replica automatically, so a read right after a write can miss it. 1.0 sends everything to the primary unless the query goes through `db.$replica`.
- Upgrade to 1.0 with `drizzle-orm@rc` and `drizzle-kit@rc`, then run `drizzle-kit up` to convert the migrations folder (no `journal.json`, one folder per migration). Relational Queries v1 is removed, so move relations to `defineRelations()` and pass them as `drizzle(url, { relations })`. `drizzle-kit drop` is gone.
- In 1.0, relational query filters throw on an explicit `undefined` value. Omit the key instead.
- drizzle-kit 1.0 does not prompt in a shell without a TTY, which includes agent shells. When `generate` or `push` hits a possible rename or data loss, it exits 2 and lists the open decisions. Rerun the same command with `--hints-file hints.json` holding one `rename`, `create` or `confirm_data_loss` entry per decision. `--output json` returns the list as JSON.
- Do not edit `snapshot.json` files by hand. To change a migration that no database has run yet, delete its folder and run `generate` again.
- `drizzle-kit push` and `pull` in 1.0 manage every schema, where 0.x managed only `public`. Set `schemaFilter` before pushing to a shared database. `push` asks before data loss unless `--force`, and `push --explain` prints the SQL first.

## Hosted PostgreSQL poolers

- Neon pooled hosts end in `-pooler`, PlanetScale Postgres pools on port 6432, and Prisma Postgres pools on `pooled.db.prisma.io`. Use the host without the pooler for migrations and `pg_dump`.
