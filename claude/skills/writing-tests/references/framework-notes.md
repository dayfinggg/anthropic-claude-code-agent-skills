# Framework notes

Use the project's existing style first. These notes cover traps that change test results.

## pytest

- Use `@pytest.mark.parametrize` for case tables. The traceback shows each input and output.

## Jest and Vitest

- Clearing, resetting, and restoring mocks are three different operations.
- `vi.clearAllMocks` clears call history only.
- `vi.resetAllMocks` clears history and resets each implementation.
- `vi.restoreAllMocks` restores spied originals.
- Pick the one that matches the leak, and set it once in config or in an `afterEach`.
- Check the installed major version before naming a config default.

## Go

- `t.Errorf` is not an assertion. The test keeps running after it.
- Use `t.Fatalf` when later steps depend on the result.
- Use `t.Run` subtests with descriptive names inside a table loop.
- Compare errors with `errors.Is` or `errors.As`, not with direct equality.

## Rust

- Give `#[should_panic]` an `expected` message. Without it, the test passes on any panic.
- Use it only when the panic is part of the contract.

## C#

- Name tests `Method_Scenario_ExpectedResult`.
