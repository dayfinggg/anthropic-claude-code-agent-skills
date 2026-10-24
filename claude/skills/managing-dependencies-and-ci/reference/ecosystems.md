# Package ecosystems

## Commands

| Ecosystem | Lockfile | CI install | Audit |
|---|---|---|---|
| npm | `package-lock.json` | `npm ci` | `npm audit --audit-level=<level>`, `npm audit signatures` |
| pnpm | `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` | `pnpm audit --prod` |
| Yarn | `yarn.lock` | `yarn install --immutable` | `yarn npm audit --all --recursive` |
| pip | `requirements.txt` with hashes | `pip install --require-hashes -r requirements.txt` | `pip-audit -r requirements.txt` |
| uv | `uv.lock` | `uv sync --locked` | `uv export --format requirements.txt`, then `pip-audit -r` |
| Poetry | `poetry.lock` | `poetry check --lock`, then `poetry sync` | `poetry run pip-audit` |
| Go | `go.mod`, `go.sum` | `go build ./...` | `govulncheck ./...` |
| Cargo | `Cargo.lock` | `cargo build --locked` | `cargo audit` |
| Maven | none | `mvn -B -C verify` | `dependency-check-maven` |
| Gradle | `gradle.lockfile` | `./gradlew build` | `org.owasp.dependencycheck` |
| NuGet | `packages.lock.json` | `dotnet restore --locked-mode` | NuGet Audit during restore |

## Age gates and install scripts

A gate holds back a version until it has been public for some time. Security fixes bypass the gate in Dependabot and Renovate.

| Tool | Setting | Notes |
|---|---|---|
| npm | `min-release-age` in `.npmrc` | Counts days. Off by default. `ignore-scripts` also defaults to false. |
| pnpm | `minimumReleaseAge` in `pnpm-workspace.yaml` | Counts minutes. Default is 1440 in pnpm 11. `4320` gives 3 days. |
| pnpm | `allowBuilds` | Lists reviewed packages that may run build scripts. Unlisted packages are blocked by default. |
| Yarn | `npmMinimalAgeGate` in `.yarnrc.yml` | Takes a duration string. Default is `1w`. |
| Yarn | `enableScripts` | Default is false. Leave it false unless a reviewed package needs its script. |
| Dependabot | `cooldown` | Version updates wait 3 days by default. Set it only to lengthen the wait. |
| Renovate | `minimumReleaseAge: "3 days"` | Applies to version updates only. |

A gate does not stop a package that was compromised long ago and is still served.

## Notes by ecosystem

### npm

- Libraries never publish `npm-shrinkwrap.json`.
- `npm ci` fails when the lockfile and `package.json` disagree, and it writes neither. Keep `npm install` and `npm update` out of CI.
- Keep any `.npmrc` that holds a token out of the repository.

### pip and uv

- Generate hashed requirements with `uv pip compile --generate-hashes`.
- Install the project itself afterwards with `--no-deps`.
- `uv sync --locked` fails on an out of date lockfile. `uv lock --check` checks the lockfile alone.

### Poetry

Poetry has no audit command. Install pip-audit in the project environment.

### Go

- Commit `go.mod` and `go.sum` for libraries and applications.
- Since Go 1.16, build commands act as `-mod=readonly`. With a `vendor` directory and `go 1.14` or higher they act as `-mod=vendor`.
- Leave `GOFLAGS=-mod=mod` out of CI.
- `go mod tidy -diff` fails when `go.mod` or `go.sum` is not tidy, without writing them. `go mod verify` checks the module cache.
- Leave `GOSUMDB` at `sum.golang.org`, because `GOSUMDB=off` accepts any module.
- Install the audit tool with `go install golang.org/x/vuln/cmd/govulncheck@<pinned version>`.

### Cargo

- `--frozen` adds `--offline` to `--locked`.
- Use `cargo install --locked`, because `cargo install` ignores the lockfile of the package by default.

### Maven

- Declare exact versions. Keep shared versions in `dependencyManagement` or an imported BOM, and declare every plugin version.
- Enforce this with Maven Enforcer rules `banDynamicVersions`, `requireReleaseDeps`, `requirePluginVersions`, and `dependencyConvergence`.
- `-C` fails the build on a checksum mismatch.
- Run `dependency-check-maven` with the `check` goal during `verify` and set `failBuildOnCVSS`.

### Gradle

- Enable `dependencyLocking { lockAllConfigurations() }` and commit `gradle.lockfile`. A resolved version that differs from the lock fails the build.
- `lockMode = LockMode.STRICT` also fails configurations that have no lock state.
- Write locks with `./gradlew dependencies --write-locks` only when dependencies change.
- `./gradlew --write-verification-metadata sha256` writes `gradle/verification-metadata.xml`.
- Run `./gradlew dependencyCheckAnalyze` with `failBuildOnCVSS` set.

### NuGet

- Set `RestorePackagesWithLockFile` to `true`. Commit the lockfile for applications and not for libraries.
- When implicit SDK packages break locked mode, pin the SDK in `global.json` with roll forward disabled.
- Applications use no floating versions such as `Version="3.6.*"`.
- Set `NuGetAuditMode` to `all` for transitive packages. It is the default only from `net10.0`.
- Make `NU1903` and `NU1904` errors with `WarningsAsErrors`.
- For a report, run `dotnet list package --vulnerable --include-transitive`.

## Update bots

- Dependabot reads `.github/dependabot.yml` with `version: 2` and one `updates` entry per ecosystem and directory.
- The `package-ecosystem` value `npm` also covers pnpm and Yarn. The value `pip` also covers Poetry.
- Other values are `uv`, `gomod`, `cargo`, `maven`, `gradle`, `nuget`, `docker`, and `github-actions`.
- Cover the app ecosystem, `docker`, and `github-actions`, so pins and their comments stay current.
- Dependabot security updates must be turned on for security fixes to skip the age gate.
- Renovate keeps digest pins of container images current with `pinDigests`.

## Images, registries, and credentials

- Pin base images by digest and keep the tag, as in `python:3.13-slim@sha256:...`.
- Run installation in a step without deployment credentials.
- Put internal packages under a reserved scope mapped to the internal registry, with no public fallback.
