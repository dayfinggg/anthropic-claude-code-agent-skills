# Proving a change works and checking a green run

## Before and after

- Write the reproduction as one command a reader can rerun, with fixed input, a fixed seed and output captured to a file. Run it on the code without the change and keep the failure, then run the same command unchanged on the change. An after run without a reproduced before failure proves nothing.
- Get the before state without touching the working tree, with `git worktree add --detach <scratch>/base <base-sha>` and the command run there, because `git stash` and `git checkout` in the working tree risk the user's uncommitted work.
- The before run must fail for the reason the change fixes, so read the failure message. An import error, a compile error, a missing fixture or a timeout is a broken reproduction, not a red test.
- If you edit the reproduction between the two runs, rerun both, because a before and an after from different scripts compare nothing.
- For a new feature there is no failure to reproduce, so capture the starting state instead, such as the 404, the missing field or the old output, with the same command you use afterwards.
- Add a control case, a nearby behavior that must not change, and run it before and after, so that deleting the feature or returning a constant cannot pass as a fix.
- For a refactor or a new check, plant a deliberate behavior change and confirm that the tests or the check fail on it, because a suite that stays green under a planted bug does not cover the code.
- For a performance claim, run before and after on the same machine with the same data, discard warm-up runs, and report the median and the spread of several runs, because one run each is noise.

## What a run proves

- Name the level you ran at, unit, integration, full local stack or deployed. A test that mocks the boundary where the bug lives passes whether or not the bug is fixed.
- Restart servers, workers, queues and watchers after switching code, and confirm with a version string, build hash or log line which build answered, because a long-running process keeps serving the old code and a cached bundle keeps serving the old frontend.
- Test what ships, such as the built package, container or binary, because a file missing from the package passes every source-tree test. `npm pack --dry-run` lists the files an npm package will contain, and a built wheel installed into a fresh virtual environment can be imported from outside the source tree.
- Run with the configuration production uses, because a feature flag, environment variable or settings file that differs makes the run prove something else. When a flag gates the change, check both values.
- For a background job, prove it ran with the job's log line and ID, the row or file it wrote, or the message it published, because an enqueued job is not a finished one.
- After a data change, read the data back with a separate query and count the rows the change should and should not touch.

## End to end in a running app

- Drive the change the way a user does, with clicks, typing, form submission and real HTTP requests. `page.evaluate()` and `electronApp.evaluate()` may inspect or stage state but do not count as proof.
- Before you call a page working, confirm its URL and title, real app content in the DOM, no framework error overlay (Next.js, Vite) and no unexplained console errors, which `page.consoleMessages()` and `page.pageErrors()` collect so the test can fail on unexpected entries.
- Assert on the request the UI sent and the response it got, with `page.waitForResponse()` around the action and a check of method, payload and status, because a UI that shows success while the request returned 500 is a common optimistic-update bug.
- Reload the page or open a new browser context and check that the change persisted, because an optimistic UI shows the new state before the server has stored it.
- Check the error path too, such as invalid input, a denied permission or an expired session, because the happy path alone does not prove a validation or authorization fix.
- Keep evidence a reader can check without rerunning, such as a Playwright trace, a screenshot of the final state or a `page.screencast` recording (Playwright 1.59 and later), the full `curl -sS -i` exchange for an API, and the exit code with stdout and stderr for a CLI.

## Gamed gates in a diff

- Read the whole change with `git diff $(git merge-base origin/main HEAD)` plus `git ls-files --others --exclude-standard`, because plain `git diff` misses staged work and new files.
- In tests, flag an added `.skip`, `.only`, `xit`, `@pytest.mark.skip`, `#[ignore]` or `t.Skip(`, deleted test files, assertions removed from tests that stayed, cases removed from a parametrized list, an exact count loosened to a bound (`toBe(3)` to `toBeGreaterThan(0)`), and expected values edited in the same change as the code so that they match the new output.
- A test file renamed so that the runner's glob no longer matches it, such as `user.test.ts` to `user.tests.ts`, or `test_user.py` to `user_tests.py`, which the default pytest patterns `test_*.py` and `*_test.py` both miss, drops out of the run without any skip marker.
- `@pytest.mark.xfail` without `strict=True` keeps the suite green whether the test fails or passes. Only strict xfail, or the `strict_xfail` ini option (named `xfail_strict` before pytest 9.0), fails on an unexpected pass.
- Retries and slack hide failures, such as `retries` in `playwright.config`, `jest.retryTimes()`, `pytest --reruns`, raised timeouts, wider tolerances, lowered coverage or mutation thresholds, and new coverage exclusions.
- Some suppressions switch off a gate rather than a style rule. `istanbul ignore` and `c8 ignore` drop code from coverage, `Stryker disable` hides a surviving mutant, and `nosemgrep` and `gitleaks:allow` hide security findings. A new `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `# noqa` or `# type: ignore` can hide the very diagnostic the change was meant to fix.
- Product code that branches on `process.env.CI`, `NODE_ENV === 'test'`, `PYTEST_CURRENT_TEST` or `GITHUB_ACTIONS`, or that special-cases the exact inputs the tests use, behaves differently under test than in production.
- In CI files, flag `continue-on-error: true`, `|| true`, `set +e`, `if: false`, new `paths` or `paths-ignore` filters that stop the test job from running, a job removed or renamed so that a required check no longer reports, and `[skip ci]` in commit messages.
- A pipe without `pipefail` reports the last command's status, so `pytest | tee log.txt` succeeds when pytest fails.

## Reading a green run

- Pass a test lane on the runner's count of tests run, not on exit 0, and compare the count with the same lane on the base branch, because fewer tests is a finding.
- Some runners exit 0 having run nothing, such as Jest and Vitest with `--passWithNoTests`, `go test -run <pattern>` matching nothing, and Playwright with `--pass-with-no-tests`. pytest exits with code 5 when it collects no tests, so check that a wrapper script does not map 5 to success.
- Read the skipped, xfailed and flaky counts as well as the failed one, because a rise in skips is a failure that moved.
- Confirm that the run belongs to the commit under review by the head SHA in the CI log, because a green badge from an older push says nothing about the new one.
- `semgrep scan` exits 0 with findings unless `--error` is passed, and the axe CLI exits 0 on violations unless `--exit` is passed.
- Before you trust a gate, run its CI command on a known violation and on a clean control. The violation must fail, the control must pass, and a crashed scanner must fail too.

## Checking another agent's claim

- A claim that all tests pass, without a command, a count and a commit, is not evidence. Rerun the command yourself on the same commit, or read the CI log for that SHA.
- Check that the reproduction it reports as failing before actually ran on the base, because a before run made after the fix was in the tree is an after run.
- Read the diff for every pattern under "Gamed gates in a diff" before you read the summary, because the summary describes what the agent meant to do, not what it changed.
