# Playwright end-to-end tests

This file matches Playwright 1.65, which is tested on Node.js 22, 24 and 26 and no longer on Node.js 20. Check the installed version with `npx playwright --version`.

## Writing tests

- Assert with web-first assertions that retry: `await expect(locator).toBeVisible()`, `toHaveText`, `toHaveValue`, `toHaveURL`, and `toMatchAriaSnapshot` for structure. Use `expect.poll` for values outside the DOM.
- Locate by role, label or test id. `locator.visible()` (1.63) replaces the `:visible` pseudo-class, and `locator.within(parent)` (1.64) scopes a locator you already have to another one.
- Log in once in a setup project that saves `storageState` under `playwright/.auth/`, which must be in `.gitignore` because the file holds live session cookies.
- Use `page.route` for third-party services and for error states that are hard to produce. Routing your own backend turns the end-to-end test into a test of the mock.
- Tests that share an outside resource declare a lock (1.63): `test('name', { lock: 'user-settings' }, ...)`, or `lock: '-exclusive-'` (1.65) to run alone. This keeps the rest of the suite parallel, unlike serial mode or `workers: 1`.

## Running from an agent shell

- Set `PLAYWRIGHT_HTML_OPEN=never`. The default `on-failure` serves the HTML report after a failing local run and the command does not exit until stopped.
- Narrow runs with `--only-changed=origin/main` (changed test files plus test files that import changed files) and `--last-failed`. Without a ref, `--only-changed` uses uncommitted changes.
- Use `--shuffle` (1.64) to find tests that depend on order. Pass the printed seed (`--shuffle <seed>`) to reproduce an order.
- In CI set `failOnFlakyTests: true` (or `--fail-on-flaky-tests`) so retries do not hide flakes, and `retryStrategy: 'isolated'` (1.62) to rerun failures one by one at the end.
- Keep traces with `trace: 'retain-on-failure-and-retries'` (1.59) to compare a passing and a failing attempt of a flaky test.
- The `failures` reporter (1.65) prints only failures and successful retries, which keeps agent output short: `--reporter=failures`.

## Debugging from an agent

- `npx playwright test <file>:<line> --debug=cli` (1.59+) pauses the test at the start and prints a session name. Run it in the background, attach with `playwright-cli attach <session>`, step with `playwright-cli --session=<session> step-over`, and stop the background run when done. `--debug` implies `--timeout=0 --max-failures=1 --headed --workers=1`.
- Every `playwright-cli` action prints the matching Playwright code, which can be pasted into the test. Assertions must be added by hand.
- Read traces without a GUI (1.59+): `npx playwright trace open <trace.zip>`, `npx playwright trace actions --grep="expect"`, `npx playwright trace action <n>`, `npx playwright trace snapshot <n> --name after`.

## Gotchas

- `expect(await locator.isVisible()).toBe(true)` checks once and does not wait. Use `await expect(locator).toBeVisible()`.
- `waitForTimeout` and `waitForLoadState('networkidle')` make tests slow and flaky. Playwright marks `networkidle` as discouraged for testing. Wait on a web-first assertion instead.
- `toHaveText` on a locator found by that same text passes whenever the element exists. Locate by role, label or test id when asserting text.
- In the default and serial modes all tests of a file run together in order, so a lock declared on any of them is held for the whole file. Use parallel mode (`fullyParallel` or `test.describe.configure({ mode: 'parallel' })`) where a lock should cover one test.
- 1.65: TypeScript class fields follow `useDefineForClassFields`, so a page object field initialized from a constructor parameter property throws `Cannot read properties of undefined`. Move the initialization into the constructor.
- 1.65: actions wait until the element is not `inert`, and a sharded run with no matching tests fails unless `--pass-with-no-tests` is set.
- 1.65: proxy credentials from `launch({ proxy })` are no longer sent to websites. Use `httpCredentials` on the context for site authentication.
- 1.64: `--update-snapshots=missing` now passes the run, while the default mode still writes missing snapshots and fails. Device descriptors now set `screen`, and elements inside hidden iframes count as hidden.
- 1.57 removed `page.accessibility`. Use an axe integration for accessibility checks.
