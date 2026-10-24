# Test design details

## What to test

- Every business rule and every branch with a different outcome.
- Edge values such as empty, zero, negative, maximum, missing, and malformed.
- Error paths, with the message or type the caller relies on.
- Negative tests for misuse and attacks.
  - Access denied to another user's object and to privileged functions.
  - Malicious input at each sink, such as HTML, file path, command, URL, and query.
  - Error responses free of stack traces and internals.
  - Rollback after a failure halfway.
  - CR and LF in logged values.
- Adapters, with a few integration tests against the real technology.
- User-facing behavior, through the running app or a browser, not only unit tests.
- End-to-end tests use no mocks.

## Limits

- Test stated requirements. Do not test cases that cannot happen.
- Coverage is not a quality measure. Do not chase a number.
- Skip generated code and framework code.

## Test doubles

- Examples of what to replace are network, clock, randomness, and third-party services.
- A real in-memory or local instance beats a mock.
- Agent-written tests over-mock, so check each mock against the rules in SKILL.md before keeping it.
- Prefer hand-written fakes and stubs at boundaries. A mocking framework is fine when the project uses one.
- Verify calls only at architectural boundaries.
- Double only types you own. Wrap a third-party API in an adapter, then test the adapter against the real service.
- A fake that grows logic gets its own tests.
- Generated tests that mirror current output lock in bugs.

## Flaky tests

- A flaky test is a defect. Never retry until green.
- Replace `sleep` with polling for a state change, or inject the clock.

## Review

- Run the project's static analysis and security scanner. AI-written code does not skip them.
- For large changes, let a separate agent review the tests, so the author does not grade its own work.
- Code-level rules live in the writing-clean-code skill.
