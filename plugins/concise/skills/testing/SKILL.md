---
name: testing
description: Test design that catches real bugs, proof that a change works end to end, and checks for a green run that was gamed, plus property-based, differential and mutation testing, Playwright, verify skills, commit gates and review rules. Use when writing, reviewing or strengthening tests, choosing what kind of test to write or what to mock, proving a fix with before and after evidence, reviewing a diff that touches tests or CI gates, writing a verify skill, a commit gate, a REVIEW.md rule or a reliability checklist, judging how well a check or reviewer catches bugs, or working with Hypothesis, fast-check, StrykerJS, mutmut, cargo-mutants, Infection, PIT or Playwright specs. Finding why a test fails or flakes belongs to debugging.
---

# Testing

This skill matches Playwright 1.65, Hypothesis 6.170, fast-check 4.10, StrykerJS 10.1, mutmut 3.8, cargo-mutants 27.1, Infection 0.35 and PIT 1.30. Read the installed versions from the lockfile, or run `npx playwright --version`. Where the installed release is newer, its own `--help` and release notes are right about flags and defaults.

## References

- Read [references/verification.md](references/verification.md) before you say a change works or collect before and after evidence, and before you accept a green run or a diff that touches tests, CI or quality gates, yours or another agent's.
- Read [references/property-and-mutation.md](references/property-and-mutation.md) before you write or review property-based tests, when a property test fails, and before you set up, scope or read a mutation testing run.
- Read [references/playwright.md](references/playwright.md) before you write, run, debug or fix Playwright tests, or check a change in a real browser.
- Read [references/building-checks.md](references/building-checks.md) before you write or change a verify skill, a hook, a CI or commit gate, a `REVIEW.md` rule or a reliability checklist, before you turn a repeated miss into a rule, and when you judge how well a check or a reviewer catches bugs.

## Check first

- Find the test command CI runs in the workflow files, package scripts, `pyproject.toml` or `Makefile`, and run that, scoped to the files you touch, in a mode that exits, such as `vitest run` rather than bare `vitest`, which watches when it misdetects the terminal.
- Before you propose a property or mutation testing tool, find the ones in use with `rg -l "from hypothesis|fast-check|proptest|pgregory.net/rapid|net.jqwik|@stryker-mutator|mutmut|cargo-mutants|infection/infection|pitest"` and the files `playwright.config.*`, `stryker.config.*`, `infection.json5` and `.cargo/mutants.toml`. Adding such a tool to a project without one is the user's decision.

## Choosing the test

- When a change a user can see gets tests, the end-to-end test of the user's flow comes first, such as adding an item to the cart and reaching the confirmation page. It is hard to fool and has a clear done state, and its trace names the step that broke, while a unit test can pass with the feature broken. When the project keeps a feature map that lists user-facing features with paths, selectors and expected results, drive the flows it lists and grade the run against it.
- When the change gets tests, include property tests for code you wrote, because generated inputs do not share the blind spots of your own examples. Round-trips, invariants, idempotency and equivalence with a slow, plainly correct version are the usual properties.
- For a migration or rewrite meant to keep behavior, write a differential test with the old system as the oracle. Run old and new on the same generated inputs or a sample of production traffic, normalize differences that do not matter (whitespace, key order, timestamps, generated IDs), and keep a list of the differences the user approved, because every other difference is a bug or a breaking change.
- Where the project has a mutation testing tool, measure test strength with it on the changed code rather than with line coverage, which a test without assertions also raises.

## Test design

- When the user or the project's rules ask for tests on legacy code that has none, pin its current behavior before you change it, with characterization tests that assert what the code returns now, odd results included, and pass on the unchanged code. Change a pinned behavior only in a separate step the user agreed to, because callers may rely on it.
- Before you write a test, name the production change that should make it fail. When only an intentional decision can fail it, such as a constant, exact wording or private structure, it is a change detector, so test the behavior that depends on the decision instead.
- Get red by running the new test against the code with the change reverted, not by editing the assertion. A missing-symbol compile error is not red, so stub the API with a no-op or a wrong result first. Drop any new assertion that passes both with and without the change.
- Write expected values as literals or hand-checked fixtures, because an expectation computed by the code under test, its helpers or a copy of its logic passes whatever the code does.
- Assert what a caller can observe, such as return values, state read back through the public interface, HTTP responses, emitted events and written files, rather than calls to internal collaborators.

## Test doubles and real dependencies

- Use test doubles only at boundaries you do not own, such as third-party HTTP APIs, payment and email providers, the clock, randomness and the OS, and keep your own modules and your database real.
- Build a double's fixtures from a recorded real response with secrets and personal data scrubbed, or validate them against the provider's published schema in a test, so that drift fails a test instead of production.
- Intercept HTTP at the transport, with a local stub server or the HTTP client's mock transport, rather than mocking your own client wrapper, so that serialization, headers, retries and error mapping stay under test.
- Inject time, randomness, IDs and environment as parameters or providers, use the runner's fake clock for timers, and run date and number formatting tests at least once under a non-UTC timezone and a non-English locale.
- Run integration tests on the production database engine and major version in a container rather than on SQLite or an in-memory fake, because constraints, collations, JSON operators, locking and isolation levels differ. Isolate tests with a rolled-back transaction or a schema per worker, and give deferred constraints, commit triggers and after-commit hooks a test that really commits.
- Prove crash and rollback behavior at the real boundary, because an injected exception is not a killed process and a mocked transaction call is not a database rollback.

## Gotchas

- An async assertion, an `fc.assert` of an async property or a Playwright `expect` without `await` lets the test finish before the check runs. Await every one, and lint with `no-floating-promises`.
- An assertion inside a callback, a `.then` or an `if (value)` that never runs passes silently. Assert the precondition directly, or guard with `expect.assertions(n)` or `expect.hasAssertions()`.
- An absence check passes when it runs too early, such as `.should('not.exist')` before the element rendered, a spy checked before the handler ran, or a log searched for a panic before the process got that far. First await a later event that must follow, then assert the absence, or assert the expected output instead.
- A `try` whose `catch` swallows the assertion error passes whatever happens, so use the runner's rejection or exception assertion.
- `toThrow()` and `pytest.raises(Exception)` accept any error, including one from a typo or a `TypeError`. Pass the error type and a message or `match=` pattern.
- An assertion that a mock was called proves only that the mock exists. Assert the outcome, and keep a call assertion only where the call is the contract, such as one payment request with this amount.
- Mocking the module under test, or the function beside it, makes the test pass for any implementation, so mock only the boundaries you do not own.
- A partial mock object with only the fields the test reads hides failures where production code reads another field. Python's `MagicMock` fails the other way, because every attribute exists, `bool()` is true and `int()` is 1, so an unset config flag reads as on. Use `create_autospec` or set every attribute the code reads.
- Put methods that only tests call, such as reset, destroy or setters for private state, in test utilities rather than on production classes.
- Snapshot updates (`-u`, `--update-snapshots`) accept whatever the code now outputs. Read every changed snapshot and justify it, or replace a large snapshot with targeted assertions.

Related skills: concise:debugging for failing and flaky tests, waits and failures that only happen in CI, concise:python for pytest, concise:typescript-javascript for Vitest and node:test, concise:php for PHPUnit, concise:frontend-ui for accessibility checks, concise:code-review for reviewing a change as a whole.
