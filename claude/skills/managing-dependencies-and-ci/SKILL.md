---
name: managing-dependencies-and-ci
description: Vets, adds, updates, and removes dependencies and hardens CI. Use for package.json, lockfiles, npm or pip install, audits, Dockerfile base images, GitHub Actions, Dependabot, and Renovate.
---

# Managing dependencies and CI

Project conventions win over this skill. Publishing belongs to the releasing-software skill.

## Vetting a new package

AI assistants suggest packages that do not exist, and attackers then register those names. Before installing, confirm that

- no standard library module or existing dependency covers the need
- the exact name exists on the official registry, links to its real source repository, and is no lookalike
- it had a release in the last 12 months and has more than one maintainer
- its OpenSSF Scorecard score, deps.dev vulnerabilities, and license are acceptable
- its install scripts do no downloads, obfuscation, or exfiltration

Count 0.x, alpha, and beta versions as unstable. When a check fails or cannot be done, report it and let the user decide. Add packages only through the package manager.

## Rules for every change

- Install scripts run with the full access of the host. Install with scripts off, as in `npm ci --ignore-scripts`.
- Run the ecosystem's audit after every manifest or lockfile change, and report new findings.
- Applications commit the lockfile and pin exact versions. Libraries declare ranges.
- CI installs with the frozen command of the ecosystem.
- A release that fixes no known vulnerability waits 3 days after publication.
- Removing a package removes its imports and configuration and regenerates the lockfile.
- Tell the user about every change under `.github/workflows`.

## GitHub Actions

- Workflows start with `permissions: contents: read`. Only the job that needs a write scope gets more.
- Pin actions from other repositories to the full commit SHA, as in `uses: actions/checkout@<sha> # v7.0.1`.
- Untrusted event values reach `run` scripts only through `env`, as a quoted `"$VAR"`.
- Run no pull request code under `pull_request_target` or `workflow_run`.

## Reference files

- [reference/ecosystems.md](reference/ecosystems.md) for lockfile, frozen install, age gate, and audit commands, base images, internal packages, and update bots.
- [reference/github-actions.md](reference/github-actions.md) before writing or reviewing a workflow, for permissions, secrets, OIDC, required checks, and templates.
