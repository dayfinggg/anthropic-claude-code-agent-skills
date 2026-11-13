## Node.js runtime

- Lines in November 2026: 26 (Lithium) Active LTS until 2029-04-30, 24 (Krypton) Maintenance until 2028-04-30, 22 (Jod) Maintenance until 2027-04-30. 20, 23 and 25 are end of life. 27 is in Alpha, Current from 2027-04-22.
- From 27 a major branches once a year, spends six months in Alpha (for library CI, not production), and every line gets 30 months of LTS. Odd numbers no longer mean short-lived.
- Node.js runs erasable TypeScript by default since 22.18 and 23.6, stable since 24.12 and 25.2, and 26 removed `--experimental-transform-types`. It reads no tsconfig, so `paths` aliases fail, and it checks no types.
- Type stripping throws `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` for `enum`, parameter properties, namespaces holding values and `import x =` aliases, and decorators fail to parse. It also refuses `.tsx` and `.ts` under `node_modules`, and needs the `.ts` extension in relative imports.
- `require()` loads ES modules without a flag since 20.19 and 22.12, stable since 25.4. A module graph with top-level `await` makes it throw `ERR_REQUIRE_ASYNC_MODULE`.
- Node.js 25 and later no longer ship Corepack. Install it separately or let the package manager manage its own version.
- On Node.js 26, reading `globalThis.localStorage` returns `undefined` and prints an ExperimentalWarning unless `--localstorage-file` is set.
- `node --test` without arguments matches `*.test.*`, `*-test.*`, `*_test.*`, `test-*.*` and files under `test/`, not `*.spec.*` elsewhere. Await every `t.test()` subtest, because the parent cancels outstanding ones as failures. `mock.module()` needs `--experimental-test-module-mocks`.
- Chain streams with `pipeline` from `node:stream/promises`. With `.pipe()`, an error in the source leaves the destination open.
- Read or cancel every `fetch` response body (`await res.body?.cancel()`), error responses included, and read or `destroy()` AWS SDK v3 stream bodies such as S3 `GetObject` `Body`. Node.js frees an unread body's connection only at garbage collection, so leaks stall later requests.

## Package managers

- npm 12 (July 2026) ships with the Node.js 27 alpha, while Node.js 26 ships npm 11.20. npm 12 skips dependency lifecycle scripts unless the root `allowScripts` policy allows them (`npm install-scripts approve`, then `npm rebuild`), blocks git and remote tarball dependencies (`allow-git` and `allow-remote` default to `none`), rejects unknown CLI flags, ignores `npm-shrinkwrap.json`, and needs Node.js 22.22.2, 24.15.0 or 26.
- pnpm 11 (April 2026) needs Node.js 22. It resolves no version younger than a day (`minimumReleaseAge: 1440`), fails installs with unreviewed build scripts (`strictDepBuilds`), replaces `onlyBuiltDependencies` and its siblings with an `allowBuilds` map, reads only auth, registry, TLS and proxy settings from `.npmrc`, ignores the `pnpm` field of `package.json` and `npm_config_*` variables, and filters `pnpm audit` by GHSA IDs.
- pnpm 12 (August 2026) is a Rust rewrite. `--frozen-lockfile false` is gone (use `--no-frozen-lockfile`), unknown `pnpm-workspace.yaml` keys fail when the pinned version matches, and git dependencies resolve over HTTPS.
- Move hoisting settings (`shamefully-hoist`, `node-linker`) from `.npmrc` to `pnpm-workspace.yaml` before upgrading to pnpm 11, or the `node_modules` layout changes.
- For a version published hours ago, add it to `minimumReleaseAgeExclude` instead of setting `minimumReleaseAge: 0`. `pnpm audit --fix` adds patched versions there itself.
- Packages that build or download binaries in install scripts stay unbuilt until approved, so they fail at import under npm 12. Review the script before approving it.
- Bun 1.4 (August 2026) is a Rust rewrite that reports Node.js 26. New workspaces use the isolated linker, `bun.lock` moved to `lockfileVersion: 2`, and Bun running as `node` (`bun --bun`, a `node` symlink) no longer loads `.env` files. It runs dependency scripts only for `trustedDependencies` and its default list, and trust from that list covers npm registry packages only.
- Deno 2.9 (June 2026) refuses npm versions younger than 24 hours (`min-release-age` in `.npmrc`), seeds `deno.lock` from an existing npm, pnpm, Yarn or Bun lockfile on first `deno install`, and with `"preferPackageJson": true` manages dependencies in `package.json`. Deno 2.8 moved `deno check` to TypeScript 6.0 with the Node.js types included by default.
