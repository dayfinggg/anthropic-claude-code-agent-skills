## Proving a change

- Run one script on the code without the change and capture the failure, then rerun the same script unchanged on the change. An after run without a reproduced before failure proves nothing. For a feature, capture the starting state instead.
- Restart servers, workers and watchers after switching code, and confirm which build ran with a version string, build hash or log line. Long-running processes keep serving the old code.
- For a refactor or a new check, plant a deliberate behavior change and confirm the check fails on it.
- Add a control case: a nearby behavior that must not change, so that deleting the feature does not pass as a fix.
- Test what ships: the built package, container or binary. A file missing from the package passes every source-tree test.
- Name the level you ran at: unit, integration, full local stack or deployed. A test that mocks the boundary where the bug lives passes whether or not the bug is fixed.
- In a browser, drive the change with real input. `page.evaluate()` and `electronApp.evaluate()` may inspect or stage state but do not count as proof. Before calling a page working, confirm its URL and title, real app content in the DOM, no framework error overlay (Next.js, Vite) and no unexplained console errors.

## Gate integrity

- Read the whole change: `git diff $(git merge-base origin/main HEAD)` plus `git ls-files --others --exclude-standard`. Plain `git diff` misses staged work and new files.
- In tests, CI and config, flag: added `.skip`, `.only`, `xit`, `@pytest.mark.skip`, `#[ignore]` or `t.Skip(`, deleted test files, assertions removed from tests that stayed, an exact count loosened to a bound (`toBe(3)` to `toBeGreaterThan(0)`), raised timeouts, retries or tolerances, lowered thresholds, a snapshot regenerated while its test file is unchanged, `continue-on-error: true`, `|| true` and `[skip ci]`.
- Some suppressions switch off a gate, not a style rule: `istanbul ignore` and `c8 ignore` drop code from coverage, `Stryker disable` hides a surviving mutant, `nosemgrep` and `gitleaks:allow` hide security findings. A new `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `# noqa` or `# type: ignore` can hide the very diagnostic the change was meant to fix.
- Product code that branches on `process.env.CI`, `NODE_ENV === 'test'`, `PYTEST_CURRENT_TEST` or `GITHUB_ACTIONS` behaves differently under test than in production.
- Pass a test lane on the runner's count of tests run, not on exit 0. `--passWithNoTests`, and `go test -run <pattern>` matching nothing, exit 0 having run no test.
- `semgrep scan` exits 0 with findings unless `--error` is passed. The axe CLI exits 0 on violations unless `--exit` is passed.
- Before trusting a gate, run its CI command on a known violation and on a clean control. The violation must fail, the control must pass, and a crashed scanner must fail too.
