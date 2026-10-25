# Dependency and build boundaries

## Review what code enters the project

When adding or replacing a dependency, first determine whether the feature needs it, confirm the exact package, canonical project, publisher, registry, supported versions, and relevant maintenance or advisory history, and inspect direct and consequential transitive changes, because a package name alone is not a trust decision, and popularity or a verified account is a signal and not proof that a release is safe. Keep the change from growing into an unrelated dependency migration. Check the proposed name and source against the project's official installation guidance, and reject a lookalike, an unexpected fork, or a registry substitution before executing its code.

<example>
For a slug helper in the JavaScript build, the install command is compared with the project's own README and repository link, `slugifly` is rejected as a lookalike of `slugify`, and a 20-line helper in the repository replaces the package.
</example>

When dependency resolution affects privileged development or deployment, use the ecosystem's supported lock and integrity mechanisms, review changed resolved sources, transitive packages, and executable installation hooks, and bind private package namespaces to their intended registry instead of allowing public fallback, because a lockfile can faithfully pin malicious code and a colliding public name can win over a private one. Library compatibility testing may need several supported dependency versions. Check manifest-lock consistency, a changed digest, and a colliding private and public name in controlled resolution tests, using commands documented for the installed package-manager version and not flags copied from another ecosystem.

<example>
The CI job runs `npm ci` so `package-lock.json` is enforced, a pull request that changes `poetry.lock` is reviewed for new packages and new source URLs, and the private `@acme` scope is mapped to the internal registry in `.npmrc`.
</example>

## Separate untrusted builds from privileged execution

When CI processes pull-request code, titles, branch names, artifacts, or caches, treat them as untrusted, keep them out of generated shell syntax, build and test without publish or deployment credentials, and promote reviewed outputs through a separately authorized path, because a trusted workflow file does not make checked-out contributor code safe and a fresh job can still consume a poisoned artifact. Inspect shared workspaces and caches that cross trust levels. Check that an untrusted revision cannot read a dummy release credential, write a protected artifact, or trigger a privileged publish, and test with dummy secrets and not real production ones.

<example>
A workflow step that interpolates `${{ github.event.pull_request.title }}` inside `run:` is changed to pass the title through an `env:` variable, and a pull request titled `"; echo $DEPLOY_KEY #` prints nothing sensitive.
</example>

When CI uses third-party actions, reusable workflows, or build tools, constrain their effective credentials and sources as executable dependencies, use supported immutable dependency resolution, and review provenance under the platform's current guidance, because a friendly tag can move, and host mounts, a container socket, or inherited credentials can expose the host despite a sandbox label. Check whether a low-trust job can influence files or caches later used by a privileged job, and verify the boundary with an inert marker and the platform's actual permissions model and not only a visible approval screen.

<example>
The deploy workflow references `actions/checkout` by full commit SHA and sets `permissions: contents: read` at the top, and a test job that writes `marker.txt` into the cache is confirmed not to leave that file in the deploy job's workspace.
</example>

## Verify identity and expectations, not just signatures

When artifact provenance is required, verify its signature against a configured trust root, match the artifact digest, and check the expected builder, canonical source, build type, and relevant parameters, because a valid signature from the wrong publisher or builder is not sufficient, and provenance establishes specified origin properties and not freedom from malicious source or vulnerabilities. Match the verifier to the artifact ecosystem and the supported provenance version. Check a modified artifact, a wrong source repository, an unexpected builder, and missing required provenance, so that required verification rejects and never silently downgrades to an unchecked download.

<example>
The deploy script downloads `api-server-1.4.tgz`, computes its SHA-256, verifies the attestation against the repository `acme/api-server` and the workflow `release.yml`, and exits non-zero when the attestation is absent.
</example>

When a security update or dependency finding affects the requested feature, inspect the deployed version, reachable functionality, and upstream fix, apply the smallest compatible remediation, and exercise the actual integration, because scanners complement code and behavior checks but cannot prove exploitability or safety. Treat a critical exposed dependency as real even when no public exploit is known, and distinguish development-only, build-time, and runtime exposure using evidence. Check the fixed behavior and confirm that the old vulnerable version is absent from the resulting dependency graph or artifact.

<example>
`npm audit` flags a vulnerable `qs` under Express in the booking API, so the fix bumps Express to a release that depends on the patched `qs`, `npm ls qs` then shows only the fixed version, and a flagged dev-only linter plugin is recorded as build-time exposure.
</example>
