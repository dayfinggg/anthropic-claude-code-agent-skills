---
name: testing
description: Test design that catches real bugs, proof that a change works, and quality gates that cannot be gamed, plus property-based testing, mutation testing and Playwright end-to-end tests. Use when writing, reviewing, fixing or deleting tests, choosing what to mock or fake, building fixtures or test data, when tests pass but bugs ship, when asked to prove a fix works or show before and after evidence, when checking whether a green run or another agent's change skipped tests, suppressed checks or loosened thresholds, for snapshot tests, Hypothesis, fast-check, proptest or other property tests, shrunk counterexamples, mutation testing with StrykerJS, mutmut, cargo-mutants, Infection or PIT, surviving mutants, checking a change in a real browser with Playwright, Playwright specs, playwright.config, locators, flaky or slow end-to-end tests, storageState login, traces, or questions like "is this test useful" and "how do I test this".
---

## Read first

Do these steps now, in order, before anything else and whatever the task. The files hold the traps this skill depends on, the pages tell you whether its versions are still current, and a skipped file or page is the usual cause of a wrong result.

1. Read `references/verification.md` in full with the Read tool (Proving a change, Gate integrity).
2. Read `references/property-and-mutation.md` in full with the Read tool (Property-based testing, Mutation testing, Mutation testing gotchas).
3. Read `references/playwright.md` in full with the Read tool (Playwright defaults, Debugging from an agent, Playwright gotchas).
4. Fetch https://registry.npmjs.org/@playwright/test/latest (Current Playwright release) with `curl -sL` or WebFetch and compare it with the facts below. Where the page shows a newer version than this skill names, follow the page.
5. Fetch https://github.com/HypothesisWorks/hypothesis/tags.atom (Current Hypothesis release) with `curl -sL` or WebFetch and compare it with the facts below. Where the page shows a newer version than this skill names, follow the page.
6. Fetch https://registry.npmjs.org/@stryker-mutator/core/latest (Current StrykerJS release) with `curl -sL` or WebFetch and compare it with the facts below. Where the page shows a newer version than this skill names, follow the page.

## Check first

- Find the test command CI actually runs (workflow files, package scripts, `pyproject.toml`, `Makefile`) and run that, scoped to the files you touch. Use a mode that exits: `vitest run`, not bare `vitest`, which watches when it misdetects the terminal.
- Find the tools already in use before proposing one: `rg -l "from hypothesis|fast-check|proptest|pgregory.net/rapid|net.jqwik|@stryker-mutator|mutmut|cargo-mutants|infection/infection|pitest"`, plus `playwright.config.*`, `stryker.config.*`, `infection.json5`, `.cargo/mutants.toml` and the lockfile versions. Adding a property or mutation testing tool to a project without one is the user's decision.
- Facts verified 2026-11.

## Defaults

- Before writing a test, name the production change that should make it fail. If only an intentional decision can fail it (a constant, exact wording, private structure), it is a change detector. Test the behavior that depends on the decision instead.
- Get red by running the new test against the code with the change reverted, not by editing the assertion. A missing-symbol compile error is not red: stub the API with a no-op or a wrong result first. Drop any new assertion that passes both with and without the change.
- Expected values are literals or hand-checked fixtures. An expectation computed by the code under test, its helpers or a copy of its logic passes whatever the code does.
- Assert what a caller can observe: return values, state read back through the public interface, HTTP responses, emitted events, files written. Do not assert calls to internal collaborators.
- Use test doubles only at boundaries you do not own: third-party HTTP APIs, payment and email providers, the clock, randomness, the OS. Keep your own modules and your database real.
- Doubles mirror the real thing completely. Build fixtures from a recorded real response, scrubbed of secrets and personal data, or validate them against the provider's published schema in a test, so drift fails a test instead of production.
- Intercept HTTP at the transport (a local stub server or the HTTP client's mock transport) rather than mocking your own client wrapper, so serialization, headers, retries and error mapping stay under test.
- Inject time, randomness, IDs and environment as parameters or providers, and use the runner's fake clock for timers. Run date and number formatting tests under a non-UTC timezone and a non-English locale at least once.
- Integration tests use the production database engine and major version in a container, not SQLite or an in-memory fake, because constraints, collations, JSON operators, locking and isolation levels differ. Isolate tests with a rolled-back transaction or a schema per worker. A test that always rolls back never commits, so deferred constraints, commit triggers and after-commit hooks need a test with a real commit.
- Prove crash and rollback behavior at the real boundary. An injected exception is not a killed process, and a mocked transaction call is not a database rollback.
- Each test creates its own data. A test that relies on another test running first fails alone and under parallel or shuffled runs.
- Add property-based tests where the code has an algebraic shape: encode and decode, parse and render, a slow reference implementation, normalization, sorting, state invariants.
- Measure test strength with mutation testing on the changed code, not with line coverage, which a test without assertions also raises.
- For flaky tests find the cause with concise:debugging. Runner specifics live in concise:python (pytest), concise:typescript-javascript (Vitest, node:test) and concise:php.

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
- Float equality, dict and set iteration order, wall-clock time and unseeded randomness make tests flaky. Use tolerances, sort before comparing, inject the clock, and fix and print the seed. Waiting rules are in concise:debugging.
