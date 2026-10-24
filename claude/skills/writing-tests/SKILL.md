---
name: writing-tests
description: Writes and reviews automated tests and proves them with real test output. Use for unit test, TDD, mock, fake, flaky test, coverage, regression test, or fixing a bug in a tested project.
---

# Writing tests

The project's framework, layout, naming, and run command come first.

## Workflow

1. Find the test command and run one existing test file before changing anything.
2. For a bug, write a failing test that reproduces it. Watch it fail for the right reason, then fix the code.
3. For new logic, write the smallest failing test, then the simplest code that passes it.
4. Answer each new test with general logic. Never add an `if` for that exact input.
5. For existing code, prove the test can fail. Use the project's mutation tool, or break one production line and see the test fail.
6. Run single tests while working and the full suite before finishing.
7. Report the exact command and its output. Never claim success without it.

## Expected values

- Take expected values from the requirement, the spec, or the user.
- Never copy them from running the current code.
- If the requirement is unclear, ask. Do not guess the oracle.

## Shape of a test

- One Act per test, named after the situation and the result, as in `rejects_order_without_items`.
- No loops or branches that choose expected values. Use the framework's parametrization for case tables.
- Call the one public entry point a caller uses. Assert on what the caller can see.
- Build setup with named helpers or builders. Avoid shared setup hooks and shared mutable state.
- A failure message must show the input and the actual result.

## Test doubles

- Replace only what is slow, nondeterministic, or outside the process.
- Keep real dependencies in place when that is feasible.
- Do not mock the code the test is meant to check.

## Integrity

- Fix a failing test by fixing the code. Never edit, weaken, skip, or delete it to get green.
- If a test looks wrong, stop and report the reason.
- Production code holds no test-only branches and no hard-coded expected values.
- List every edited existing test, and why, in the final report.

## References

- references/test-design-details.md covers what to test, security negatives, double rules, flaky tests, and review. Read it when planning cases or using mocks.
- references/framework-notes.md covers pytest, Jest, Vitest, Go, Rust, and C#. Read it when the project uses one of them.
