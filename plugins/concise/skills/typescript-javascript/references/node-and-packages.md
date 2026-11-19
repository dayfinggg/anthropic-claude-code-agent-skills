# Node.js runtime and package managers

## Node.js release lines

- 26 (Lithium) has been Active LTS since 2026-10-28 and is scheduled to enter Maintenance on 2027-10-20 and to reach end of life on 2029-04-30. 24 (Krypton) is in Maintenance until 2028-04-30, and 22 (Jod) until 2027-04-30. 20, 23 and 25 are end of life.
- 27 has been in Alpha since 2026-10-28 and is scheduled to become Current on 2027-04-22. From 27 on, one major line branches per year, spends six months in Alpha (for library CI, not production), and every line gets LTS, so an odd number no longer means a short-lived line.
- `https://raw.githubusercontent.com/nodejs/Release/main/schedule.json` publishes the release schedule as data when a task needs exact dates.

## Node.js runtime

- Node.js runs erasable TypeScript by default since 22.18 and 23.6, stable since 24.12 and 25.2, and 26 removed `--experimental-transform-types`. It reads no tsconfig and checks no types.
- `require()` loads ES modules without a flag since 20.19 and 22.12, stable since 25.4. A module graph with top-level `await` makes it throw `ERR_REQUIRE_ASYNC_MODULE`.
- Node.js 25 and later no longer ship Corepack, so install it separately or let the package manager manage its own version.
- On Node.js 26, reading the `localStorage` global without `--localstorage-file` throws a `DOMException`, where 25 returned an empty object. Every request on a server shares that data, so it cannot hold per-user state.
- `node --test` without arguments matches `**/*.test.*`, `*-test.*`, `*_test.*`, `test-*.*`, `test.*` and files under `test/`, for `.js`, `.cjs`, `.mjs`, `.ts`, `.cts` and `.mts`, so `*.spec.*` outside `test/` needs an explicit glob. Await every `t.test()` subtest, because the parent cancels outstanding ones as failures. `mock.module()` needs `--experimental-test-module-mocks`.
- Read or cancel every `fetch` response body (`await res.body?.cancel()`), error responses included, and read or `destroy()` AWS SDK v3 stream bodies such as the S3 `GetObject` `Body`. Node.js frees an unread body's connection only at garbage collection, so leaks stall later requests.

## Package managers

- npm 12 (2026-07-08) ships with the Node.js 27 alpha, while Node.js 26 ships npm 11.20. npm 12 skips dependency lifecycle scripts unless the root `allowScripts` policy allows them (`npm install-scripts approve`, then `npm rebuild`), blocks git and remote tarball dependencies (`allow-git` and `allow-remote` default to `none`), rejects unknown and abbreviated CLI flags, ignores `npm-shrinkwrap.json`, and needs Node.js 22.22.2, 24.15.0 or 26.
- Packages that build or download binaries in install scripts stay unbuilt until approved, so they fail at import under npm 12. Review the script before you approve it.
- pnpm 11 (2026-04-28) needs Node.js 22. It resolves no version younger than a day (`minimumReleaseAge: 1440`), fails installs with unreviewed build scripts (`strictDepBuilds`), replaces `onlyBuiltDependencies` and its siblings with an `allowBuilds` map, reads only auth and registry settings from `.npmrc`, ignores the `pnpm` field of `package.json` and `npm_config_*` variables (use `pnpm_config_*`), and filters `pnpm audit` by GHSA IDs.
- Move hoisting settings (`shamefully-hoist`, `node-linker`) from `.npmrc` to `pnpm-workspace.yaml` before upgrading to pnpm 11, or the `node_modules` layout changes.
- For a version published hours ago, add it to `minimumReleaseAgeExclude` instead of setting `minimumReleaseAge: 0`. `pnpm audit --fix` adds patched versions there itself.
- pnpm 12 (2026-08-26) is the Rust CLI. `--frozen-lockfile false` is gone (use `--no-frozen-lockfile`), an unknown `pnpm-workspace.yaml` key fails with `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS` when the project pins a matching pnpm, and git dependencies on GitHub, GitLab and Bitbucket resolve over HTTPS, so SSH needs a machine-level `git config url.insteadOf`.
- Bun 1.4 is a Rust rewrite with Node.js 26 compatibility. New monorepos use the isolated linker while existing lockfiles keep hoisted, `bun.lock` moved to `lockfileVersion: 2`, and Bun running as `node` (`bun --bun`, a `node` symlink) no longer loads `.env` files. Dependency scripts run only for `trustedDependencies` and its default list, which covers npm registry packages only.
- Deno 2.9 refuses npm versions younger than 24 hours (`min-release-age` in `.npmrc`), seeds `deno.lock` from an existing npm, pnpm, Yarn or Bun lockfile on the first `deno install`, and with `"preferPackageJson": true` manages dependencies in `package.json`. Deno 2.8 moved `deno check` to TypeScript 6.0 with the Node.js types included by default.
