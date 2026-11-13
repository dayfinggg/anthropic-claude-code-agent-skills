---
name: containers-iac
description: Current practice for Dockerfiles and BuildKit, Docker Compose, Kubernetes manifests, Terraform and OpenTofu, and OpenTelemetry. Use when writing, reviewing or debugging a Dockerfile, docker build or buildx flags, build cache or build secrets, compose.yaml or docker-compose.yml, depends_on, healthchecks or Compose watch, Kubernetes YAML, Helm or Kustomize output, probes, sidecars, Ingress or Gateway API, cluster upgrades, .tf, .tofu or .tftest.hcl files, state locking, import, moved or removed blocks, .terraform.lock.hcl, OTEL_* environment variables, semantic conventions or Collector config. Also use for errors like "no matches for kind", "version is obsolete", "Error acquiring the state lock" or "too many open files" in containers, and when choosing versions of these tools.
---

## Read first

Go through these steps before you act on this skill. Do each step whose condition fits the task, and read each such file in full with the Read tool. When you cannot tell whether a step fits, do it. When the work later reaches a step you skipped, do it then.

1. Read `references/kubernetes.md` when writing or reviewing Kubernetes manifests, Helm or Kustomize output, or planning a cluster upgrade.
2. Read `references/terraform-opentofu.md` when working on Terraform or OpenTofu configuration, state, modules, imports or tests.
3. Read `references/opentelemetry.md` when adding OpenTelemetry instrumentation, setting `OTEL_*` variables, or configuring a Collector.
4. Fetch https://raw.githubusercontent.com/kubernetes/website/main/data/releases/schedule.yaml (Kubernetes minors and end-of-life dates) with `curl -sL` or WebFetch when the task depends on that version or rule, and follow the page where it is newer than this skill.
5. Fetch https://checkpoint-api.hashicorp.com/v1/check/terraform (Current Terraform release) with `curl -sL` or WebFetch when the task depends on that version or rule, and follow the page where it is newer than this skill.
6. Fetch https://github.com/open-telemetry/semantic-conventions/tags.atom (Current semantic conventions release) with `curl -sL` or WebFetch when the task depends on that version or rule, and follow the page where it is newer than this skill.

## Check first

- Read what the project pins before writing syntax: the `# syntax=` line and `FROM` tags in Dockerfiles, then `docker version`, `docker buildx version` and `docker compose version`.
- Kubernetes: the server minor in `kubectl version` decides which APIs and fields exist. Check a field with `kubectl explain <kind>.<path>` and validate with `kubectl apply --dry-run=server -f <file>`.
- Terraform or OpenTofu: read `required_version`, the provider hosts in `.terraform.lock.hcl` (`registry.opentofu.org` means OpenTofu), any `.tofu` files, and the binary the CI job runs. Then run `terraform version` or `tofu version`.
- OpenTelemetry: read SDK and instrumentation versions in the lockfile, every `OTEL_*` variable in the deployment config, and the Collector image name and tag.
- Latest releases on 2026-11-12: Docker Engine 29.9.3, Buildx 0.39.0, Compose 5.7.1, Dockerfile frontend 1.29.0, Kubernetes 1.37.2, Terraform 1.17.2, OpenTofu 1.13.9, semantic conventions 1.45.0, Collector 0.165.0.
- Facts verified 2026-11.

## Defaults

- Start every Dockerfile with `# syntax=docker/dockerfile:1`. BuildKit then pulls the newest stable 1.x frontend (1.29.0 on 2026-11-11) whatever the Engine version. Pin a minor such as `docker/dockerfile:1.29` when the file sets `# check=error=true`, because checks added later would start failing the build.
- These Dockerfile flags are stable in the 1.x frontend and need no `1-labs`: `COPY --exclude` (1.19), `COPY --parents` (1.20), `RUN --mount=type=secret,env=NAME` (1.10), `ADD --checksum` for HTTP (`sha256:<hex>`) and Git commits (1.16), `ADD --unpack` (1.17), `RUN --device` (1.27). `FROM --reset`, `ENV --unset` and `LABEL --unset` still need `docker/dockerfile:1-labs`.
- Pass build secrets with `docker build --secret id=TOKEN` (reads the environment variable `TOKEN`) or `--secret id=npmrc,src=$HOME/.npmrc`. Consume them only through a mount, and set `required=true`, since the default `false` silently builds without the secret:

```dockerfile
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc,required=true npm ci
RUN --mount=type=secret,id=NPM_TOKEN,env=NPM_TOKEN,required=true npm ci
```

- Run `docker build --check .` (Buildx 0.15+) to lint without building. It exits non-zero on violations, while a normal build only prints warnings. `SecretsUsedInArgOrEnv` flags names like `TOKEN` or `PASSWORD` in `ARG` and `ENV`.
- Export CI cache with `--cache-to type=registry,ref=<repo>:buildcache,mode=max` plus the same ref in `--cache-from`. The default `mode=min` stores only final-stage layers, so earlier stages of a multi-stage build always rebuild. Workflow-side setup for CI lives in concise:github-actions.
- Write multi-line `RUN` steps as `RUN <<EOF` heredocs that begin with `set -eu`. Without it the step fails only when the last command fails.
- For minimal non-root base images, Docker Hardened Images are free under Apache-2.0 at `dhi.io/<image>:<tag>` and need `docker login dhi.io` with a Docker account.
- Docker Compose is v5 (5.0.0 shipped 2025-12, versions 3 and 4 were skipped) and delegates builds to Buildx Bake. Name the file `compose.yaml` and drop the top-level `version:` key, which is obsolete and only produces a warning.
- Gate startup on readiness with long-form `depends_on` and a `healthcheck` on the dependency. Short-form `depends_on` waits only until the container starts. Use `service_completed_successfully` for one-shot setup services.

```yaml
depends_on:
  db:
    condition: service_healthy
    restart: true
```

- Use `pre_start` (Compose 5.3+) for init steps such as migrations or a `chown`. Each step runs in its own ephemeral container after `depends_on` is satisfied and before the service starts, and it reruns only when its definition changes or the service is recreated. Migration design itself belongs to concise:database.
- Use `develop.watch` with `docker compose up --watch` for the dev loop: `sync` for hot-reloaded source, `rebuild` for dependency manifests, `sync+restart` for config files. `sync+exec` and `restart` need Compose 2.32+.

## Gotchas

- Cache mounts (`RUN --mount=type=cache`) live only in the builder's local storage. `--cache-to` does not export them, so fresh CI runners start every build with empty cache mounts.
- Debian and Ubuntu images delete downloaded packages through `/etc/apt/apt.conf.d/docker-clean`, which makes an apt cache mount useless. Remove that file first and lock both directories:

```dockerfile
RUN rm -f /etc/apt/apt.conf.d/docker-clean
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends gcc
```

- Changing a secret's value does not invalidate the build cache, so a cached `RUN` keeps the result built with the old secret. Declare `ARG CACHEBUST` before that step and change its value together with the secret.
- The `gha` cache backend uses `scope=buildkit` by default, so every image built in the repository overwrites one shared cache. Set `scope=<image-name>` on both `--cache-to` and `--cache-from`.
- The default `docker` driver exports `registry`, `local` and `gha` caches only with the containerd image store. Fresh Docker Engine 29 installs use it, upgraded daemons usually keep the classic store. Use `docker buildx create --driver docker-container --use` when the export fails.
- `ADD` extracts local tar archives but not remote ones. State `--unpack=true` or `--unpack=false` explicitly, and add `--checksum` to every remote `ADD` so the input is pinned.
- `COPY --link --chown` needs a numeric `UID:GID`, because a linked layer cannot see users created by earlier `RUN` steps.
- Docker Engine 29 removed Docker Content Trust from the CLI. `docker trust` and `DOCKER_CONTENT_TRUST=1` no longer verify image signatures.
- Docker Engine 29 lowered the default open-file limit in containers from 1048576 to 1024 (containerd 2.1.5). Databases and proxies then fail with "too many open files". Raise it per service with `--ulimit nofile=65536:65536` or Compose `ulimits: nofile:`.
- Docker CLI 29 `docker image ls` prints a collapsed tree view and hides untagged images unless `--all` is set. Parse `docker image ls --format json` in scripts.
- Compose interpolates `$VAR` everywhere in the file, including healthcheck commands. Write `$$` when the container shell must expand it, as in `pg_isready -U $${POSTGRES_USER}`. Use `${VAR:?message}` to fail fast when a required value is missing.
- In Compose, `environment:` overrides `env_file:` even when the `environment:` value is empty or unset.
- `docker compose config` prints interpolated values, including secrets read from `.env`. Validate with `docker compose config --quiet` instead.
- Compose watch tracks only services with `build:`, needs `stat`, `mkdir` and `rmdir` inside the image, and needs the container `USER` to own the sync target (`COPY --chown`). Distroless runtime stages therefore cannot use `sync`.
- Watch `ignore` and `include` patterns are relative to the rule's `path`, not the project root. Quote patterns that start with `*`, since YAML reads `*` as an alias.
- `healthcheck.start_interval` needs Docker Engine 25 or later.
- From Git Bash on Windows, `docker -v` and `docker exec` path arguments get rewritten, and CRLF scripts fail inside Linux containers. Apply concise:shell before running them.
