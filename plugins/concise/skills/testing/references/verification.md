# Proving a change works and checking a green run

## Contents

- Before and after
- What a run proves
- End to end in a running app
- Gamed gates in a diff
- Reading a green run
- Checking another agent's claim

## Before and after

- Write the reproduction as one command a reader can rerun: fixed input, fixed seed, output captured to a file. Run it on the code without the change and keep the failure, then run the same command unchanged on the change. An after run without a reproduced before failure proves nothing.
- Get the before state without touching the working tree: `git worktree add --detach ../base <base-sha>` and run the command there. `git stash` and `git checkout` in the working tree risk the user's uncommitted work.
- The before run must fail for the reason the change fixes. Read the failure message: an import error, a compile error, a missing fixture or a timeout is a broken reproduction, not a red test.
- If you edit the reproduction between the two runs, rerun both. A before and an after from different scripts compare nothing.
- For a new feature there is no failure to reproduce. Capture the starting state instead (the 404, the missing field, the old output) with the same command you use afterwards.
- Add a control case: a nearby behavior that must not change, run before and after. Deleting the feature or returning a constant must not pass as a fix.
- For a refactor, compare behavior instead of looking for a failure: run the old and the new code on the same inputs (recorded production requests, a fixture corpus, generated inputs) and diff the outputs. Any difference is either a bug or a behavior change the user has to accept.
- For a refactor or a new check, plant a deliberate behavior change and confirm the tests or the check fail on it. A suite that stays green under a planted bug does not cover the code.
- For a performance claim, run before and after on the same machine with the same data, discard warm-up runs, take several runs and report the median and the spread. One run each is noise.

## What a run proves

- Name the level you ran at: unit, integration, full local stack or deployed. A test that mocks the boundary where the bug lives passes whether or not the bug is fixed.
- Restart servers, workers, queues and watchers after switching code, and confirm which build answered with a version string, build hash or log line. A long-running process keeps serving the old code, and a cached bundle keeps serving the old frontend.
- Test what ships: the built package, container or binary. A file missing from the package passes every source-tree test. `npm pack --dry-run` lists the files an npm package will contain. Install a built wheel into a fresh virtual environment and import it from outside the source tree.
- Run with the configuration production uses. A feature flag, environment variable or settings file that differs between the test run and production makes the run prove something else. When a flag gates the change, check both values.
- For a background job, prove it ran: the job's log line with its ID, the row or file it wrote, the message it published. "Enqueued" is not "done".
- For data changes, read the data back with a separate query after the write, and count the rows the change should and should not touch.

## End to end in a running app

- Drive the change the way a user does: clicks, typing, form submission, real HTTP requests. `page.evaluate()` and `electronApp.evaluate()` may inspect or stage state but do not count as proof.
- Before calling a page working, confirm its URL and title, real app content in the DOM, no framework error overlay (Next.js, Vite) and no unexplained console errors. Collect them with `page.consoleMessages()` and `page.pageErrors()` and fail on unexpected entries.
- Assert on the request the UI sent and the response it got: `page.waitForResponse()` around the action, then check method, payload and status. A UI that shows success while the request returned 500 is a common optimistic-update bug.
- Reload the page, or open a new browser context, and check that the change persisted. An optimistic UI shows the new state before the server has stored it.
- Check the error path too: invalid input, a denied permission, an expired session. The happy path alone does not prove a validation or authorization fix.
- For an API, keep the full exchange as evidence: `curl -sS -i` with method, URL, body, status line and response body. For a CLI, keep the exit code and the stdout and stderr.
- Keep evidence a reader can check without rerunning: a trace (`trace: 'retain-on-failure-and-retries'`), a screenshot of the final state, or a screencast recorded with `page.screencast` (Playwright 1.59 and later).

## Gamed gates in a diff

- Read the whole change: `git diff $(git merge-base origin/main HEAD)` plus `git ls-files --others --exclude-standard`. Plain `git diff` misses staged work and new files.
- In tests, flag: added `.skip`, `.only`, `xit`, `@pytest.mark.skip`, `#[ignore]` or `t.Skip(`, deleted test files, assertions removed from tests that stayed, cases removed from a parametrized list, an exact count loosened to a bound (`toBe(3)` to `toBeGreaterThan(0)`), and expected values edited in the same change as the code so they match the new output.
- A test file renamed so the runner's glob no longer matches it (`user.test.ts` to `user.tests.ts`, or `test_user.py` to `user_tests.py`, which the default pytest patterns `test_*.py` and `*_test.py` both miss) disappears from the run without any skip marker.
- `@pytest.mark.xfail` without `strict=True` keeps the suite green whether the test fails or passes. Only strict xfail, or the `strict_xfail` ini option, fails on an unexpected pass.
- Retries and slack hide failures: `retries` in `playwright.config`, `jest.retryTimes()`, `pytest --reruns`, raised timeouts, wider tolerances, lowered coverage or mutation thresholds, and new coverage exclusions.
- Some suppressions switch off a gate, not a style rule: `istanbul ignore` and `c8 ignore` drop code from coverage, `Stryker disable` hides a surviving mutant, `nosemgrep` and `gitleaks:allow` hide security findings. A new `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `# noqa` or `# type: ignore` can hide the very diagnostic the change was meant to fix.
- Product code that branches on `process.env.CI`, `NODE_ENV === 'test'`, `PYTEST_CURRENT_TEST` or `GITHUB_ACTIONS`, or that special-cases the exact inputs the tests use, behaves differently under test than in production.
- A mock added for the unit under test, or for the function beside it, makes its tests pass for any implementation.
- In CI files, flag `continue-on-error: true`, `|| true`, `set +e`, `if: false`, new `paths` or `paths-ignore` filters that stop the test job from running, a job removed or renamed so a required check no longer reports, and `[skip ci]` in commit messages.
- A pipe without `pipefail` reports the last command's exit status: `pytest | tee log.txt` succeeds when pytest fails.
- A snapshot file regenerated while its test file is unchanged needs a reason for every changed line.

## Reading a green run

- Pass a test lane on the runner's count of tests run, not on exit 0. Compare the count with the same lane on the base branch: fewer tests is a finding.
- Some runners exit 0 having run nothing: `--passWithNoTests` in Jest and Vitest, `go test -run <pattern>` matching nothing, Playwright `--pass-with-no-tests`. pytest exits with code 5 when it collects no tests, so check that a wrapper script does not map 5 to success.
- Read the skipped, xfailed and flaky counts, not only failed. A rise in skips is a failure that moved.
- Confirm the run belongs to the commit under review: the head SHA in the CI log must match. A green badge from an older push says nothing about the new one.
- `semgrep scan` exits 0 with findings unless `--error` is passed. The axe CLI exits 0 on violations unless `--exit` is passed.
- Before trusting a gate, run its CI command on a known violation and on a clean control. The violation must fail, the control must pass, and a crashed scanner must fail too.

## Checking another agent's claim

- "All tests pass" without a command, a count and a commit is not evidence. Rerun the command yourself on the same commit, or read the CI log for that SHA.
- Check that the reproduction it reports failing before actually ran on the base: a before run made after the fix was already in the tree is an after run.
- Read the diff for every pattern in "Gamed gates in a diff" before reading the summary, because the summary describes what the agent meant to do, not what it changed.
