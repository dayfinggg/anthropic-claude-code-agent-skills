## Reading the failure

- `gh run view <run-id> --log-failed` and `--log` refuse with "still in progress" until the whole run completes, even with `--job`. Fetch a finished job's log earlier with `gh api repos/{owner}/{repo}/actions/jobs/<job-id>/logs`, and list failed job IDs with `gh run view <run-id> --json jobs --jq '.jobs[] | select(.conclusion == "failure") | .databaseId'`.
- Read a failing step from its first error. `Process completed with exit code 1` only names the step, and later errors are usually fallout.
- A run with the conclusion `action_required` is waiting for approval and has neither passed nor failed.

## Whose failure it is

- Before calling a failure unrelated to the change, find the same job on the base branch with `gh run list --branch <base> --workflow <file> --limit 10`. Jobs that run only on pull requests have no base-branch runs, so say that instead of implying a comparison.
- Call a failure flaky only with evidence, such as a green run of the same job on the same SHA. A green retry does not show that the cause is gone.
- For a failure that reproduces only in CI, compare the environments as concise:debugging describes.

## Reruns

- `gh run rerun <run-id> --failed` reuses the original commit, ref and workflow file, and the original actor's privileges. It cannot pick up a fix. A new commit starts fresh runs, so do not also rerun the old SHA.
- Rerun only a diagnosed flaky or infrastructure failure. A run can be rerun at most 50 times, counting full and partial reruns.
