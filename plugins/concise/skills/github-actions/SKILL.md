---
name: github-actions
description: Current GitHub Actions practice on github.com for workflow security, correctness and failing checks. Use when writing, reviewing, debugging or hardening .github/workflows/*.yml, action.yml, actions.lock or dependabot.yml files, reusable workflows, triggers such as pull_request_target, workflow_run, issue_comment or merge_group, GITHUB_TOKEN permissions, pinning actions, OIDC to AWS, Azure or GCP, npm trusted publishing, secrets and masking, caches and artifacts, concurrency, runner labels, actionlint or zizmor findings, AI agent actions such as claude-code-action or gh aw agentic workflows, when a pull request check fails or a rerun is considered, or when a required check is stuck on "Waiting for status to be reported" or a workflow never starts. Also for quick questions about current action versions or recent Actions changes.
---

## Read first

Do these steps now, in order, before anything else and whatever the task. The files hold the traps this skill depends on, and a skipped file or page is the usual cause of a wrong result.

1. Read `references/untrusted-triggers.md` in full with the Read tool (Attacker-controlled data, pull_request_target, workflow_run, Comment and label gates, Platform controls, Reporting a finding).
2. Read `references/ai-agents.md` in full with the Read tool (Where attacker text reaches the agent, Containment, claude-code-action, Other agent actions, gh aw agentic workflows).
3. Read `references/ci-failures.md` in full with the Read tool (Reading the failure, Whose failure it is, Reruns).
4. Open https://github.com/actions/runner/tags.atom (Current runner release) and compare it with the facts below.
5. Open https://github.com/actions/checkout/tags.atom (Current `actions/checkout` release) and compare it with the facts below.

## Check first

- Inventory `.github/workflows/*.yml` and `*.yaml`, every `action.yml` (often under `.github/actions/`), `.github/workflows/actions.lock`, gh aw sources (`.github/workflows/*.md` next to `*.lock.yml`), `.github/dependabot.yml` and the `CODEOWNERS` lines for `.github/`.
- Confirm the host. Lockfiles, `$/` references, `cache-mode`, background steps, `queue: max`, immutable OIDC subjects and the default `pull_request_target` policy exist on github.com only, not on GitHub Enterprise Server.
- Self-hosted runners: `$/` needs runner 2.336.0 or later, Node 24 actions need 2.327.1 or later. The latest runner is 2.338.2.
- Resolve a tag to its commit before pinning, never from memory: `gh api repos/OWNER/REPO/commits/v7.0.1 --jq .sha`. In `git ls-remote --tags` output take the `^{}` line, not the annotated tag object. Confirm the commit belongs to the action's own repository, not a fork.
- Lint with `zizmor .` (1.32.0, security audits, knows lockfiles and the 2026 syntax) and `actionlint` (1.7.12, expressions and types).
- Facts verified 2026-11.

## Defaults

- Lock action dependencies: `gh extension install github/gh-actions-lock`, then `gh actions-lock` writes `.github/workflows/actions.lock` (GA 2026-10-28). Workflows keep readable tags and run the locked commits, including transitive actions. Rerun it after any `uses:` change, gate PRs on `gh actions-lock --verify`, and never edit the lockfile by hand. Dependabot updates the entries of onboarded workflows.
- The lockfile does not cover reusable workflow calls (`jobs.<id>.uses`). Pin those to a full commit SHA. After onboarding, an allowed-actions policy matches locked SHAs, so tag entries such as `actions/checkout@v7` stop matching.
- Without a lockfile, pin each third-party action to a 40-character SHA with a same-line `# v1.2.3` comment so Dependabot updates both. Dependabot raises no security alerts for SHA-pinned actions.
- Reference actions and reusable workflows from the same repository as `uses: $/.github/actions/build` (2026-07-30). It runs at the workflow's own commit, needs no checkout and takes no `@ref`. A `./` path resolves against whatever the workspace holds, so a fork checkout replaces it.
- Current majors: `actions/checkout@v7`, `actions/cache@v6`, `actions/upload-artifact@v7`, `actions/download-artifact@v8`, `actions/setup-node@v7`, `actions/setup-go@v7`, `actions/github-script@v9`, `actions/create-github-app-token@v3`, `github/codeql-action@v4` (v3 is deprecated in 2026-12).
- Node 20 left the runners on 2026-09-23. A JavaScript action declares `runs.using: node24`.
- Start every workflow with `permissions: {}` or `contents: read` and grant scopes per job. Naming one scope sets every unnamed scope to `none`. `id-token` and `copilot-requests` take only `write` or `none`, `vulnerability-alerts` only `read` or `none`. Artifact metadata APIs need `artifact-metadata`, not `contents`.
- Pass event text through `env:` and quote it as `"$TITLE"` in `run:`. In `actions/github-script` read `process.env.TITLE`, because `script:` is JavaScript and `${{ }}` inside it is code injection. Any `with:` input is safe only when the action treats it as data.
- Build fork CI on `pull_request`. Do privileged follow-up in a separate `workflow_run` workflow that treats the upstream artifacts as untrusted data.
- From 2026-12-02 public repositories block `pull_request_target` unless an Actions event policy allows it (Settings, Actions, Policies, with workflow file targeting). Brownouts block it on 2026-11-09 and 2026-11-16 from 16:00 to 18:00 UTC. Private and internal repositories are not affected.
- Untrusted triggers that run in the default-branch scope (`pull_request_target`, `issue_comment`, `workflow_run` and similar) get a read-only cache since 2026-06-26. Saves only log a warning. Warm caches from `push` or `schedule` and use `actions/cache/restore` in low-trust workflows.
- `cache-mode: read`, `write`, `write-only` or `none` at workflow or job level (GA 2026-09-10) limits cache access, and a caller's explicit mode caps its reusable workflows. Declaring `write` on a low-trust trigger reopens cache poisoning.
- Turn off caching in release and publish jobs: `cache-mode: none`, or `package-manager-cache: false` on setup-node (v5 and later cache npm automatically) and `cache: false` on setup-go (default `true`).
- OIDC subjects are immutable for repositories created, renamed or transferred after 2026-07-15: `repo:octo-org@123456/octo-repo@456789:ref:refs/heads/main`. Older repositories keep `repo:octo-org/octo-repo:...` until someone opts in. Write the trust policy for the format the repository emits.
- Condition cloud roles on `sub` and `aud`. The `sub` suffix is `environment:NAME` when the job uses an environment, `pull_request` for pull request events, and `ref:refs/...` otherwise. For a central deploy workflow, put `job_workflow_ref` into the subject template. Organization-selected custom properties arrive as `repo_property_*` claims. A `sub` pattern ending in `:*`, such as `repo:octo-org/octo-repo:*`, admits every branch, pull request and environment.
- Publish to npm with trusted publishing (`id-token: write`) from `push`, `release` or `workflow_dispatch`. npm rejects OIDC tokens from `pull_request_target` and `issue_comment`, and 2FA-bypass tokens lose direct publish around 2027-01. For a reusable workflow, register the calling workflow's file name and grant `id-token: write` in both. Remove `NODE_AUTH_TOKEN` and `_authToken` lines, because npm falls back to a configured token and hides a broken trusted publisher.
- Use `case(cond1, val1, cond2, val2, default)` (2026-01) instead of `cond && 'a' || 'b'`, which yields `'b'` whenever `'a'` is falsy.
- YAML anchors and aliases work (2025-09). Merge keys (`<<:`) do not.
- Run steps concurrently with `background: true` plus `wait: id`, `wait-all:` or `cancel: id`, or group them under `parallel:` (2026-06). At most 10 run at once, their outputs and env changes appear only after the `wait`, and composite actions cannot use them.
- Serialize deploys without dropping runs:

```yaml
concurrency:
  group: ${{ github.workflow }}-production
  queue: max
```

- `queue: max` (2026-05) holds up to 100 pending runs in order. It cannot be combined with `cancel-in-progress: true`. Without it a new run cancels the pending one.
- `ubuntu-latest` moves to Ubuntu 26.04 between 2026-10-19 and 2026-11-19. Pin `ubuntu-24.04` when the build depends on preinstalled tools. `macos-latest` is macOS 26, `macos-14` was retired on 2026-11-02, and `windows-latest` is Server 2025 with Visual Studio 2026. `ubuntu-slim` is an unprivileged 1 vCPU container without Docker-in-Docker.
- Set `defaults.run.shell: bash`. A step without `shell:` runs `bash -e {0}` without pipefail, while `shell: bash` adds `-o pipefail`.
- Use `actions/create-github-app-token@v3` for cross-repository work or pushes that must trigger CI. App installation tokens are about 520 characters since 2026-10, so 40-character validators and short columns break.

## Gotchas

- A required check whose workflow is skipped by `paths`, `branches` or `[skip ci]` stays Pending and blocks the merge. Run required workflows on every PR and filter inside, because a job skipped by `if:` reports success.
- A job skipped because a job in its `needs` failed counts as passing. Gate merges on one aggregator job:

```yaml
  ci-ok:
    if: always()
    needs: [lint, test]
    runs-on: ubuntu-slim
    steps:
      - if: contains(needs.*.result, 'failure') || contains(needs.*.result, 'cancelled')
        run: exit 1
```

- Required workflows must also trigger on `merge_group` (`types: [checks_requested]`), which takes only `branches` filters. Otherwise the queue never gets the check.
- In an unquoted YAML value, a space followed by `#` starts a comment. `run-name: ${{ format('PR #{0}', inputs.pr) }}` is cut off, the expression never closes, and no job starts. Double-quote any value that holds `${{ }}` together with `#` or `: `.
- `if: ${{ github.event_name }} == 'push'` is a non-empty string and always true. Keep the whole condition inside one `${{ }}` or omit the braces.
- An `if:` without a status function gets an implicit `success()`, so a report or cleanup step with `if: matrix.os == 'linux'` skips after a failure. Use `if: ${{ !cancelled() && matrix.os == 'linux' }}`.
- Expression comparisons ignore case. Step outputs are strings, so compare with `'true'` or wrap them in `fromJSON()`.
- Events made with `GITHUB_TOKEN` start no workflows, except `workflow_dispatch` and `repository_dispatch`. Pull requests it opens or updates create runs that wait for approval (2026-06). Use an App token when CI must start unattended.
- `GITHUB_ENV`, `GITHUB_PATH` and `GITHUB_OUTPUT` take effect from the next step. A fixed heredoc delimiter such as `EOF` lets an untrusted multi-line value inject extra variables. Write arbitrary data to a file instead.
- Redaction matches exact strings. Base64, URL-encoded, JSON-wrapped or sliced secrets print in clear text, so register derived values with `echo "::add-mask::$VALUE"`. The runner drops masked values from job outputs, so mint or fetch the secret in the job that uses it.
- `actions/checkout` keeps the token available to later steps unless `persist-credentials: false`. Since v6 it lives in a file under `$RUNNER_TEMP` instead of `.git/config`, but every later step can still use it. Set it to false unless the job pushes.
- Workflow-level `env` does not reach a called reusable workflow, and the callee's `env` does not come back. Use `inputs`, `secrets` and `outputs`. Nesting stops at 10 levels and 50 unique reusable workflows per caller.
- Dependabot PR runs get a read-only token and only Dependabot secrets. Dependabot OIDC tokens carry `event_name: dynamic`.
- In `dependabot.yml` only `directories` accepts globs such as `/packages/*`, not `directory`.
- `schedule`, `workflow_run` and `issue_comment` start only when the workflow file is on the default branch. Scheduled workflows in public repositories turn off after 60 days without activity.
- Environment branch rules match `refs/pull/N/merge` for `pull_request` events and the default branch for `pull_request_target` (since 2025-12-08). Old patterns that matched the head branch no longer unlock the environment.
- `upload-artifact` skips files and folders starting with `.` unless `include-hidden-files: true`, and a second upload with the same name in one run fails without `overwrite: true`. `download-artifact@v8` fails on a digest mismatch.
- actionlint 1.7.12 (2026-03-30) predates `$/`, `cache-mode`, `background`, `parallel`, `wait` and `queue`, and reports them as errors. Check the workflow syntax docs before rewriting valid YAML. zizmor 1.32.0 parses them.
