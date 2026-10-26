# Builds and environments

## Locate the actual build boundary

When local development works but CI fails, compare the source revision, working directory, OS, architecture, runtime, manager, and resolution settings, and look at the first failing stage instead of changing downstream code, because local caches and globally installed tools can hide missing inputs. Run the failing command under the intended build conditions before changing versions.

<example>
A Vite build that passes on Windows and fails on the Linux runner at the import `./Header.vue` points to a case-sensitive path because the file is `header.vue`, so the import is corrected to `./header.vue` and the Node version stays.
</example>

When repeatability matters, use declared toolchain versions and locked dependency inputs, and separate fetching dependencies from compilation when the tool supports it, because undeclared inputs are what make two builds differ. Stronger isolation costs setup and maintenance, so skip a new build system adopted only to claim hermeticity, and compare independent artifact digests only when byte-for-byte reproducibility is required, because a lockfile alone does not prove identical output.

<example>
A `global.json` pinning the SDK plus `dotnet restore --locked-mode` fixes the .NET build inputs, and `sha256sum` on `Catalog.Api.dll` from two runners is compared only for a release that must be byte-identical.
</example>

For packaged applications, test the final package instead of the development server, checking included assets, runtime dependencies, permissions, entry point, and startup without the source checkout, because a development server hides assumptions that the package does not satisfy. Use the smallest representative environment that exercises the boundary.

<example>
A FastAPI service built with `python -m build` is installed from `dist/catalog-1.0.0-py3-none-any.whl` into an empty virtualenv and started as the `app` user with `sudo -u app .venv-clean/bin/uvicorn catalog.main:app`, which exposes templates missing from the package or an unreadable `.env` before its unit file is touched.
</example>

## Use caches as an optimization

When introducing or repairing a cache, include the toolchain, platform, lockfile, and build settings in its key, and keep credentials and trusted release outputs out of paths that untrusted jobs can write, because reusing more state saves time but can carry stale or attacker-controlled inputs into a release. Check that a cache miss still produces a working build, and clear only the failing cache instead of unrelated ones.

<example>
A GitHub Actions cache keyed with `${{ runner.os }}-ruby-<version>-${{ hashFiles('Gemfile.lock') }}` is exercised once with the cache removed to prove the build still passes from nothing.
</example>

## Treat configuration as a release input

When changing environment configuration, identify each value's producer, precedence, consumer, and the phase that consumes it, separating build-time substitution, startup settings, and live reload, because a value changed in the wrong phase has no effect or lands in the wrong environment. Check names, presence, and approved non-secret values without dumping the environment, and confirm the effective target in each affected environment, because shared defaults can point development at production.

<example>
A changed `LOG_LEVEL` in the `inventory-config` ConfigMap has no effect on running pods that read it as an environment variable, so the edit is followed by `kubectl rollout restart deployment/inventory-api` and a log line that shows the effective level.
</example>

When changing required settings, use the existing configuration parser and validate the semantic boundary by checking the units, ranges, paths, and resource identities that the task changes, because a syntax check cannot catch a nonexistent directory or a wrong unit. Check that missing and invalid values fail in the intended way.

<example>
Raising `spring.servlet.multipart.max-file-size` to `20MB` starts cleanly, which proves only that the value parses, so a 15 MB upload through the real load balancer confirms the ceiling together with `max-request-size` and the balancer's own body limit.
</example>

For live configuration, confirm whether updates are atomic, when each instance observes them, and how the previous revision is restored, and test the supported reload or restart path, because a fast change that bypasses release checks can spread a bad value everywhere at once. Keep the platform's established error behavior instead of adding a silent fallback.

<example>
A scheduled task that reads `C:\ProgramData\Billing\settings.ini` sees an edit on its next run, so the edit gets a dry run first, while the always-on `BillingSync` service reads it only after `Restart-Service BillingSync`, which makes the restart part of the change.
</example>

## Keep secrets out of public artifacts

When an application needs credentials, keep its existing runtime injection and secret store and give access only to the process and environment that need them, because build-time convenience can embed credentials in assets, layers, source maps, or metadata. Inspect the resulting artifact using harmless test values, because printing a real value to prove injection puts it into logs and transcripts.

<example>
Build with `$env:API_KEY = 'test-sentinel-123'`, then search `dist` for `test-sentinel-123` to see whether the value ended up in the bundle.
</example>

For browser builds, treat every exposed environment variable as public and check the generated client assets against the framework's exposure rules, because Vite bundles `VITE_*` values at build time and a secret renamed to a similar name stays readable. Keep secrets on the server side of the boundary.

<example>
A payment secret placed in `VITE_PAYMENT_SECRET` appears in `dist/assets/index-*.js`, so the call moves to a Go handler that reads the key from the server's environment.
</example>

## When containers already belong to the project

When a project already ships a container, inspect the context boundaries, ignore rules, base image, target architecture, runtime user, entry point, volumes, and writable paths, and use build stages when they remove compilers or development dependencies, because smaller images reduce exposure but a changed libc or architecture can break native modules. Build and run the final image with its real permissions and runtime dependencies.

<example>
Moving a Rails image from `ruby:<version>-slim` to `ruby:<version>-alpine` changes the libc, so native gems such as `nokogiri` and `pg` are rebuilt and the final image is started with `docker run --rm --user 1000 booking-app bundle exec puma`.
</example>

When pinning a base image by digest, verify the registry and digest together and keep a deliberate update path with a test of the updated image, because a pin stops silent replacement and also stops automatic security refreshes. Refresh the base with an explicit pull, because disabling the build cache does not fetch a newer base.

<example>
`docker buildx imagetools inspect debian:<tag>` shows the digest to record in `FROM debian@sha256:<digest>`, and a scheduled job runs `docker build --pull` and the smoke test before that digest is updated.
</example>

For private build inputs, use supported secret or SSH mounts instead of persistent image settings, inspect the build output and layers using test credentials, and confirm that the final image starts without the build secret, because a mount protects delivery but a build command can still copy or log the secret.

<example>
`docker build --secret id=mvnsettings,src=./test-settings.xml .` with a `RUN --mount=type=secret,id=mvnsettings,target=/root/.m2/settings.xml` step keeps the repository token out of layers, and `docker history --no-trunc` on the result shows no token.
</example>
