# GitHub Actions hardening

The SHAs below were checked against the release in each comment. Resolve the current release and its commit before copying them.

## Contents

- Permissions
- Pinning actions
- Untrusted input and privileged triggers
- Secrets
- Pull request checks
- Repository settings
- Fix for script injection
- Fix for stored cloud keys
- Workflow template
- Dependabot template

## Permissions

- A job `permissions` block replaces the workflow block, and every scope it leaves out becomes `none`. Repeat `contents: read` in a job block when the job checks out code.
- CodeQL upload needs `security-events: write`. OIDC needs `id-token: write`. For other scopes, grant only what the documentation of the action names.
- Use `permissions: {}` for a job that needs no token access.
- Set the default workflow permissions of the repository to read only.
- Pass `persist-credentials: false` to `actions/checkout` unless a later step pushes with git. Since checkout v6 the token sits in a separate file under `$RUNNER_TEMP`, and the setting still removes it after the step.

## Pinning actions

- Tags can be repointed. In March 2025 reports said every tag of `tj-actions/changed-files` pointed to one malicious commit. Workflows pinned to a SHA were not affected.
- Resolve the commit with `git ls-remote --tags https://github.com/owner/repo.git`. For an annotated tag, take the line ending in `^{}`.
- Pin actions from GitHub and reusable workflows the same way. Pin `container` and `services` images by digest.
- Read the source of a new third party action. Prefer actions from the vendor of the wrapped tool.

## Untrusted input and privileged triggers

- Untrusted values include issue and pull request titles and bodies, comments, review text, branch names, commit messages, and author names.
- An inline `${{ }}` is pasted into the script before the shell runs, so its content becomes code. An action that takes the value as an input avoids the shell entirely.
- The triggers `pull_request_target` and `workflow_run` hold the secrets of the base repository. Run no pull request code under them.
- CodeQL with the `actions` language flags vulnerable workflows.
- Checkout v7 refuses fork pull request code under `pull_request_target` unless `allow-unsafe-pr-checkout` is true. Leave it unset.
- When a later step needs write access, run it in a separate `workflow_run` workflow. Treat the artifacts of the first run as untrusted data.

## Secrets

- Register derived values with `::add-mask::` before printing them.
- Cloud access uses OIDC, with `id-token: write` on the deploying job only.
- Anyone with write access can read all repository secrets. Production secrets belong to an environment with required reviewers.
- After a leak, delete the log and rotate the secret.
- Turn on push protection for secret scanning, because it is off by default.

## Pull request checks

Pull requests run tests, linters, SAST such as CodeQL, and a dependency scan as required checks. For a supply chain audit, run OpenSSF Scorecard and report each finding with its file and fix.

`actions/dependency-review-action` fails a pull request that introduces a vulnerable version and reports indirect changes in lockfiles. On private repositories it needs a GitHub Advanced Security license. Elsewhere, run the audit command of the ecosystem.

## Repository settings

Change repository settings only when the user asks.

- Require approval for all external contributors before fork pull request workflows run.
- Add `/.github/workflows/ @owner/team` to `.github/CODEOWNERS` and require code owner review on the default branch.
- Leave "Allow GitHub Actions to create and approve pull requests" off.
- Use no self-hosted runners on public repositories. Elsewhere, make them ephemeral.

## Fix for script injection

Before

```yaml
      - name: Check branch name
        run: |
          if [[ "${{ github.head_ref }}" != feature/* ]]; then
            echo "Branch must start with feature/"
            exit 1
          fi
```

After

```yaml
      - name: Check branch name
        env:
          HEAD_REF: ${{ github.head_ref }}
        run: |
          if [[ "$HEAD_REF" != feature/* ]]; then
            echo "Branch must start with feature/"
            exit 1
          fi
```

A branch named with `$(...)` would execute in the first version. Through `env`, the value is only data in a quoted variable.

## Fix for stored cloud keys

Replace `aws-access-key-id` and `aws-secret-access-key` secrets with a role the job assumes through OIDC.

```yaml
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: aws-actions/configure-aws-credentials@e1253824e5c10ff9df46874f81ed3ec929e19cfd # v6.3.0
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-deploy
          aws-region: eu-central-1
      - run: ./deploy.sh
```

No key is stored. Only this job may request the OIDC token, and the production environment can require a reviewer.

## Workflow template

`.github/workflows/ci.yml` for a Node.js project. Swap the install, lint, and test steps for the ecosystem of the project. The CodeQL SHA matches v4.38.3, and a newer minor release exists.

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm audit signatures
      - run: npm run lint
      - run: npm test

  dependency-review:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/dependency-review-action@a1d282b36b6f3519aa1f3fc636f609c47dddb294 # v5.0.0

  codeql:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    strategy:
      matrix:
        language:
          - actions
          - javascript-typescript
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: github/codeql-action/init@24c54180a607b1449ed407dd24f251e4e9147c8d # v4.38.3
        with:
          languages: ${{ matrix.language }}
      - uses: github/codeql-action/analyze@24c54180a607b1449ed407dd24f251e4e9147c8d # v4.38.3
```

## Dependabot template

The default 3 day cooldown already applies to version updates, so there is no `cooldown` block.

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    groups:
      npm-minor-and-patch:
        patterns:
          - "*"
        update-types:
          - minor
          - patch
  - package-ecosystem: docker
    directory: /
    schedule:
      interval: weekly
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    groups:
      github-actions:
        patterns:
          - "*"
```
