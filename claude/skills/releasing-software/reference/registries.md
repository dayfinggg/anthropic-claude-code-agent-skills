# Registries

Trusted publishing setup per registry, from each registry's documentation. Confirm the details on the linked page before writing a workflow. These pages change often.

## Contents

- npm
- PyPI
- crates.io
- RubyGems
- NuGet
- Maven Central
- Container registries

## npm

Source is [docs.npmjs.com/trusted-publishers](https://docs.npmjs.com/trusted-publishers) and [docs.npmjs.com/staged-publishing](https://docs.npmjs.com/staged-publishing).

- **Versions.** Trusted publishing needs npm CLI 11.5.1 or later and Node 22.14.0 or later. Check `npm --version` in the job.
- **CI providers.** GitHub Actions on GitHub-hosted runners, GitLab CI/CD on shared runners, and CircleCI cloud. Self-hosted runners are not supported.
- **Setup.** Add a trusted publisher in the package settings. Give the owner, the repository, the workflow file name with its extension, and optionally the environment.
- **Expiry.** A new configuration must publish successfully within 2 days. An existing configuration cannot be edited, only deleted and recreated.
- **Provenance.** It is generated automatically when all of these hold. The publish uses OIDC from GitHub Actions or GitLab CI/CD. The repository and the package are public. CircleCI gets none.
- **Staged publishing.** It needs npm CLI 11.15.0 or later and Node 22.14.0 or later. `npm stage publish` sends a version to a staging area. A maintainer approves it with 2FA.
- **Strictest setup.** Allow only `npm stage publish` on the trusted publisher and disallow tokens. Then `npm publish` from CI fails by design.
- **Afterwards.** In the package settings under Publishing access, choose "Require two-factor authentication and disallow tokens". Revoke old automation tokens and delete the `NPM_TOKEN` secret.
- **Private dependencies.** Trusted publishing covers publishing only. Installing private packages still needs a read-only granular token.

## PyPI

Sources are [docs.pypi.org/trusted-publishers](https://docs.pypi.org/trusted-publishers/) and the [pypa/gh-action-pypi-publish README](https://github.com/pypa/gh-action-pypi-publish).

- **Setup.** Add a trusted publisher on the project with the owner, repository, workflow file name, and the environment.
- **Token.** The OIDC token is exchanged for an API token that lasts 15 minutes.
- **Workflow.** Put `id-token: write` at job level, which PyPI strongly recommends over workflow level. Use `pypa/gh-action-pypi-publish` with no `user` or `password`.
- **Reusable workflows.** Trusted publishing cannot run from one. The publish job lives in a top-level workflow.
- **Attestations.** The action uploads them by default. Leave that on.
- **TestPyPI.** Use a separate trusted publisher on test.pypi.org and set `repository-url: https://test.pypi.org/legacy/`.
- **Afterwards.** Long-lived API tokens stay valid until revoked. Ask the user to revoke them and delete the secret.

## crates.io

Sources are the [crates.io update of July 2025](https://blog.rust-lang.org/2025/07/11/crates-io-development-update-2025-07) and the [rust-lang/crates-io-auth-action README](https://github.com/rust-lang/crates-io-auth-action). The current docs page on crates.io was not verified.

- **First release.** Publish the first version manually. Then configure trusted publishing in the crate settings.
- **Workflow.** The job needs `id-token: write`. `rust-lang/crates-io-auth-action` returns a short-lived token as its `token` output.
- **Publish.** Pass that token to `cargo publish --locked` as `CARGO_REGISTRY_TOKEN`.
- **Build split.** The publish command packages the source. The publish job therefore builds, unlike the npm split.

## RubyGems

Sources are [guides.rubygems.org/trusted-publishing](https://guides.rubygems.org/trusted-publishing/) and the [rubygems/release-gem README](https://github.com/rubygems/release-gem).

- **Setup.** On the gem page, add a trusted publisher with the owner, repository, workflow file name, and environment. The guide suggests the name `release`.
- **New gems.** A pending trusted publisher works for a gem that does not exist yet.
- **Workflow.** Use `rubygems/release-gem` with `id-token: write`. It also needs `contents: write`, because `rake release` pushes the release tag. That tag push is an outside effect.
- **Build split.** The publish command packages the source. The publish job therefore builds, unlike the npm split.

## NuGet

Source is [learn.microsoft.com/nuget/nuget-org/trusted-publishing](https://learn.microsoft.com/en-us/nuget/nuget-org/trusted-publishing).

- **Setup.** On nuget.org, add a policy with the owner, repository, and workflow file name only, such as `release.yml`.
- **Policy life.** A new policy may start as temporarily active for 7 days. It becomes permanent after the first successful publish.
- **Workflow.** The job needs `id-token: write`. `NuGet/login` takes the nuget.org profile name in `user`, not the email.
- **Key.** It returns a temporary key in the `NUGET_API_KEY` output that lasts 1 hour. Request it right before the push.

## Maven Central

The Central Portal documentation describes only user token credentials in `settings.xml` and does not mention OIDC. Store the token only as a secret of the gated environment. Check central.sonatype.org for changes.

## Container registries

- **GitHub Container Registry.** The pushing job logs in with `GITHUB_TOKEN` and needs `packages: write`. Attesting the image adds `id-token: write` and `attestations: write`.
- **Cloud registries.** Authenticate through OIDC federation to the cloud provider, never with stored access keys.
- **Digest.** Read the digest from the `digest` output of `docker/build-push-action`. Attest that digest and deploy by it.
