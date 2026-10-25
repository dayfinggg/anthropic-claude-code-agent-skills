# Dependency lifecycle

## Select only what the task needs

When adding a dependency or generator, check first whether existing components already solve the problem, then evaluate the exact registry identity, source repository, license, supported runtimes, maintenance, advisories, and installation hooks, and weigh fit against maintenance cost instead of download counts, because a popular name can be a lookalike and a mature single-maintainer library can still be the right choice. Test the needed behavior, since a score is not a security guarantee.

<example>
Before `go get github.com/xuri/excelize/v2`, confirm the module path matches the publisher's repository, read its license and the `go` directive in its `go.mod`, and run the one export the task needs in a scratch program.
</example>

For private packages, inspect the scope-to-registry mappings and the credential scope so that an internal name cannot resolve from the public registry, because a mixed registry setup invites dependency confusion. Check the package origin and the integrity recorded by the manager without printing authentication values.

<example>
`@acme:registry=https://npm.internal.example/` in `.npmrc` maps the `@acme` scope to the private registry, and `grep -c 'npm.internal.example' package-lock.json` confirms the lockfile resolves `@acme` packages from that host, while the `.npmrc` token line stays unprinted.
</example>

When a package runs installation or native-build scripts, review why it needs them and the installed manager's policy, then use the narrowest supported policy and confirm the resulting binary loads, because blocking every script breaks legitimate binaries and allowing every script exposes the build host. Keep integrity checks and permissions as they are when suppressing an error, because widening them hides the cause.

<example>
A point-of-sale kiosk app that depends on `better-sqlite3` needs its build script, so the installed pnpm's allow-list names that one package while other scripts stay blocked, and `node -e "require('better-sqlite3')"` confirms the native binding loads.
</example>

## Preserve the dependency contract

Before installation, identify the manager, its version, workspace boundaries, resolution settings, and lockfile format, commit a supported lockfile for applications, and follow the ecosystem's publication conventions for libraries, because replacing a library's version ranges to imitate an application breaks its consumers. Check that the manifest and lockfile agree.

<example>
A Python service commits `uv.lock` and deploys from it, while a published library keeps its version ranges in `pyproject.toml` for the projects that install it.
</example>

Use a reproducible installation mode only after checking its actual semantics, because each mode differs in what it replaces and what it skips. These rows depend on the installed version, so read that version's documentation, and apply the existing tool's equivalent for other ecosystems after reading their official documentation.

<example>
`npm ci` failing in the CI job because `package-lock.json` disagrees with `package.json` is the signal to repair the lockfile through `npm install` locally, and the job stays on `npm ci`.
</example>

| Existing tool | Decision | Tradeoff and verification |
| --- | --- | --- |
| npm | Use `npm ci` when its required lockfile exists and matches the manifest. | It replaces the installed dependency tree. Preserve relevant resolution settings and verify no tracked file changed. |
| pnpm | Use `pnpm install --frozen-lockfile` for a validated locked install. | Workspace scope can exceed the current package. Verify the selected projects and reject stale lockfiles. |
| uv | Use `uv sync --locked` when metadata agreement must be checked. | `--frozen` skips the freshness check. Verify the intended groups and account for removal of undeclared environment packages. |

## Upgrade without hiding incompatibility

For a requested upgrade, read the release notes, supported-runtime changes, deprecations, and the direct and transitive differences, and update the smallest coherent set through the manager, because a broad refresh resolves conflicts but makes regressions hard to attribute. Check the lockfile diff, the dependency graph, the relevant tests, packaging, and startup.

<example>
Bumping Npgsql runs `dotnet add package Npgsql --version 8.0.5`, and `git diff --stat Booking.Api.csproj packages.lock.json` shows only Npgsql and its own dependencies moving.
</example>

When a security advisory drives the change, confirm the affected version and whether the vulnerable code is used before choosing a fix, prefer a supported fixed release, and when an override or backport is necessary check its compatibility and the exact graph it produces, because an absent advisory match does not prove a package harmless and a force-fix command silently accepts breaking upgrades.

<example>
`npm audit` flags a transitive `semver`, `npm ls semver` shows which parent pulls it in, and the fix upgrades that parent instead of running `npm audit fix --force`.
</example>

For routine updates, keep an established release-age policy, because a cooldown reduces exposure to newly malicious releases, and install a relevant security fix without waiting out the delay, because the wait would only extend a known exposure. Check the selected release and the existing policy before installing, and avoid imposing a delay on a project that has none, because a mechanical delay postpones fixes.

<example>
A `dependabot.yml` with a `cooldown` of 7 days keeps that wait for a routine minor bump, while a patched release for an actively exploited flaw is installed right after its checks pass.
</example>

## Remove and investigate carefully

When removing a dependency, inspect imports, dynamic loading, build plugins, scripts, tests, and configuration first, regenerate the lockfile through the manager, and remove only what the request made unnecessary, because a package that looks unused in source can still drive packaging. Check the build and the packaged startup afterwards.

<example>
Before dropping `jakarta.xml.bind-api` from `pom.xml`, `git grep -n 'jakarta.xml.bind'` and the plugin configuration show whether any class or generated source still needs it, and `mvn -B verify` runs again afterwards.
</example>

When a locked install fails, classify the failure as stale metadata, incompatible runtime, registry access, integrity mismatch, or native compilation, and keep the failing output, because deleting the lockfile or accepting new checksums hides the cause. Check the registry identity and the expected bytes before repairing a genuinely corrupted entry.

<example>
`npm ci` ending in `EINTEGRITY` for one tarball leads to checking which registry served it and the `integrity` value recorded for it, and `package-lock.json` stays in place.
</example>
