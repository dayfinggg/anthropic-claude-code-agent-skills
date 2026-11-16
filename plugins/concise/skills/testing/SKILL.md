---
name: testing
description: Test design that catches real bugs, proof that a change works end to end, and spotting a green run that was gamed, plus end-to-end, property-based, differential and mutation testing, Playwright, and checks such as verify skills, commit gates and review rules. Use when writing, reviewing or fixing tests, choosing what kind of test to write or what to mock, proving a fix with before and after evidence, reviewing a diff that touches tests or CI gates, writing a verify skill, a commit gate, a REVIEW.md rule or a reliability checklist, judging how well a check or reviewer catches bugs, or working with Hypothesis, fast-check, StrykerJS, mutmut, cargo-mutants, Infection, PIT or Playwright specs.
---

# Testing

This skill covers test design, proof that a change works, and the property, mutation and browser testing tools. It matches Playwright 1.65, Hypothesis 6.170, fast-check 4.10, StrykerJS 10.1, mutmut 3.8, cargo-mutants 27.1, Infection 0.35 and PIT 1.30. Read the installed versions from the lockfile, or run `npx playwright --version`. Where the installed release is newer, its own `--help` and release notes are right about flags and defaults.

## References

Each file below holds what this page only names. Read it in full with the Read tool before the first step its condition describes, also when that step comes late in a long task or after a compaction.

- [references/verification.md](references/verification.md): read before saying a change works, when asked for before and after evidence, and before accepting a green run or a diff that touches tests, CI or quality gates, yours or another agent's.
- [references/property-and-mutation.md](references/property-and-mutation.md): read before writing or reviewing property-based tests, when a property test fails, and before setting up, scoping or reading a mutation testing run.
- [references/playwright.md](references/playwright.md): read before writing, running, debugging or fixing Playwright tests, or checking a change in a real browser.
- [references/building-checks.md](references/building-checks.md): read before writing or changing a verify skill, a hook or CI gate, a commit gate, a `REVIEW.md` rule or a reliability checklist, before turning a repeated miss into a rule, and when judging how well a check or a reviewer catches bugs.

## Check first

- Find the test command CI actually runs (workflow files, package scripts, `pyproject.toml`, `Makefile`) and run that, scoped to the files you touch. Use a mode that exits: `vitest run`, not bare `vitest`, which watches when it misdetects the terminal.
- Find the tools already in use before proposing one: `rg -l "from hypothesis|fast-check|proptest|pgregory.net/rapid|net.jqwik|@stryker-mutator|mutmut|cargo-mutants|infection/infection|pitest"`, plus `playwright.config.*`, `stryker.config.*`, `infection.json5` and `.cargo/mutants.toml`. Adding a property or mutation testing tool to a project without one is the user's decision.

## Choosing the test

- An end-to-end test of a real user flow (add an item to the cart, check out, reach the confirmation page) is the one to write first. It is hard to fool, has a clear done state, and its trace and screenshot name the step that broke, while a unit test can pass with the feature broken. When the project keeps a feature map (features from the user's side with paths, shortcuts, selectors and expected results), drive the flows it lists and grade the run against it.
- Add property tests for code you wrote yourself. Your example cases share the blind spots of your code, while generated inputs do not. Look for round-trip (decode of encode returns the input), invariants (a balance never goes negative), idempotency (running a migration, normalization or retry twice equals once) and equivalence (optimized code matches a slow, plainly correct version). They also hold a rewrite to the real behavior where the spec has drifted from production.
- For a migration or rewrite meant to keep behavior, write a differential test with the old system as the oracle: run old and new on the same generated inputs or a sample of production traffic, normalize differences that do not matter (whitespace, key order, timestamps, generated IDs), and keep a list of the differences the user approved. Every other difference is a bug or a breaking change.
- A flaky suite teaches the agent to rerun instead of fix, and a slow one gets run less often. Fix flakes at the cause, run the fast tests after every edit, and run the heavy end-to-end suite before the commit.

## Test design

- Before you change legacy code that has no tests, pin its current behavior: characterization tests that assert what the code returns now, odd results included, green on the unchanged code and saved before the change. A pinned behavior changes only in a separate step the user agreed to, because callers may rely on it.
- Before writing a test, name the production change that should make it fail. If only an intentional decision can fail it (a constant, exact wording, private structure), it is a change detector. Test the behavior that depends on the decision instead.
- Get red by running the new test against the code with the change reverted, not by editing the assertion. A missing-symbol compile error is not red: stub the API with a no-op or a wrong result first. Drop any new assertion that passes both with and without the change.
- Expected values are literals or hand-checked fixtures. An expectation computed by the code under test, its helpers or a copy of its logic passes whatever the code does.
- Assert what a caller can observe: return values, state read back through the public interface, HTTP responses, emitted events, files written. Do not assert calls to internal collaborators.
- Each test creates its own data. A test that relies on another test running first fails alone and under parallel or shuffled runs.

## Test doubles and real dependencies

- Use test doubles only at boundaries you do not own: third-party HTTP APIs, payment and email providers, the clock, randomness, the OS. Keep your own modules and your database real.
- Build fixtures for a double from a recorded real response, scrubbed of secrets and personal data, or validate them against the provider's published schema in a test, so drift fails a test instead of production.
- Intercept HTTP at the transport (a local stub server or the HTTP client's mock transport) rather than mocking your own client wrapper, so serialization, headers, retries and error mapping stay under test.
- Inject time, randomness, IDs and environment as parameters or providers, and use the runner's fake clock for timers. Run date and number formatting tests under a non-UTC timezone and a non-English locale at least once.
- Integration tests use the production database engine and major version in a container, not SQLite or an in-memory fake, because constraints, collations, JSON operators, locking and isolation levels differ. Isolate tests with a rolled-back transaction or a schema per worker.
- A test that always rolls back never commits, so deferred constraints, commit triggers and after-commit hooks need a test with a real commit.
- Prove crash and rollback behavior at the real boundary. An injected exception is not a killed process, and a mocked transaction call is not a database rollback.

## Test strength

- Measure test strength with mutation testing on the changed code, not with line coverage, which a test without assertions also raises.

## Gotchas

- An async assertion, `fc.assert` of an async property or a Playwright `expect` without `await` lets the test finish before the check runs. Await every one, and lint with `no-floating-promises`.
- An assertion inside a callback, a `.then` or an `if (value)` that never runs passes silently. Assert the precondition directly, or guard with `expect.assertions(n)` or `expect.hasAssertions()`.
- Absence checks pass when they run too early: `.should('not.exist')` before the element rendered, a spy checked before the handler ran, output searched for no "panic" or "uncaught exception". First await a later event that must follow, then assert the absence, or assert the expected output instead.
- A `try` whose `catch` swallows the assertion error passes whatever happens. Use the runner's rejection or exception assertion instead.
- `toThrow()` and `pytest.raises(Exception)` accept any error, including a typo or a `TypeError`. Pass the error type and a message or `match=` pattern.
- Asserting that a mock was called proves only that the mock exists. Assert the outcome, and keep a call assertion only when the call is the contract, such as one payment request with this amount.
- A partial mock object with only the fields the test reads hides failures where production code reads another field. Python's `MagicMock` fails the other way: every attribute exists, `bool()` is true and `int()` is 1, so an unset config flag reads as on. Use `create_autospec` or set every attribute the code reads.
- Mocking the module under test, or the function beside it, makes the test pass for any implementation.
- Methods that only tests call (reset, destroy, setters for private state) do not belong on production classes. Put them in test utilities.
- Snapshot updates (`-u`, `--update-snapshots`) accept whatever the code now outputs. Read every changed snapshot and justify it, or replace a large snapshot with targeted assertions.
- Float equality, dict and set iteration order, wall-clock time and unseeded randomness make tests flaky. Use tolerances, sort before comparing, inject the clock, and fix and print the seed.

Related skills: concise:debugging for flaky tests, waits and failures that only happen in CI, concise:python for pytest, concise:typescript-javascript for Vitest and node:test, concise:php for PHPUnit, concise:frontend-ui for accessibility checks, concise:code-review for reviewing a change as a whole.
