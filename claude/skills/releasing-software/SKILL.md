---
name: releasing-software
description: Versions and publishes software with SemVer, trusted publishing, and provenance. Use when bumping a version, tagging, writing a release workflow, publishing to npm or PyPI, or fixing a bad release.
---

# Releasing software

A project's existing release process, tag format, or release tool wins over this skill. CI hardening belongs to the managing-dependencies-and-ci skill.

## Outside effects

Publishing, pushing a tag or image, creating a release, and running a release workflow cannot be cleanly undone.

- Prepare the version bump, the workflow, and the notes. Run publishing steps only when the user asks.
- Before such a step, state the package, version, registry, tag, and environment. Run the registry's dry run, such as `npm publish --dry-run`.
- An agent holds no publish credentials. CI publishes, and untrusted issue or pull request text never reaches a job with credentials.
- Registry and repository settings belong to the user. Say exactly what to set.

## Versions

- Derive the bump from commits since the last release tag. `!` or `BREAKING CHANGE:` means MAJOR, `feat` MINOR, and `fix` PATCH. Other types change nothing.
- Moving from 0.y.z to 1.0.0 is the user's decision.
- A released version is never changed or re-published. Any fix is a new version, and release tags stay where they are.

## Publishing

- Publish from CI only, from a fresh checkout of the tagged commit.
- Use OIDC trusted publishing wherever the registry supports it, with no registry token in secrets.
- Put `id-token: write` only on the job that publishes or attests. Set `permissions: contents: read` at the top.
- The build job builds and tests read-only and uploads artifacts. The publish job downloads them and does not build.
- Run the publish job in a GitHub environment with required reviewers. Restrict the trusted publisher to it.
- Pin third-party actions to a full commit SHA. Re-resolve the SHAs in this skill first.

## Reference files

- [reference/registries.md](reference/registries.md) before writing a publish workflow, for each registry's trusted publishing setup.
- [reference/provenance-and-sbom.md](reference/provenance-and-sbom.md) before adding attestations, signing, an SBOM, or promoting a build.
- [reference/special-cases.md](reference/special-cases.md) when fixing a bad release, using tokens, or setting up repository protections.
- [examples.md](examples.md) for a broken npm release fix and a split npm publish workflow.
