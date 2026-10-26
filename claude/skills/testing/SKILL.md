---
name: testing
description: Designs tests and diagnoses defects in code, including regressions, flaky failures, and legacy behavior that needs pinning down. Use when writing, reviewing, or running tests, or when reproducing a bug in a codebase.
---

# Testing

These rules decide which checks to write, run, and trust when code changes or fails. The references hold the detailed procedures for each branch.

## Establish the target

Before writing or changing a test, identify the behavior, its contract, and the risk the change creates, inspect the existing tests, fixtures, commands, and locked tool versions, and choose a check that could fail for the actual defect, because a test that only executes the changed lines passes whether or not the behavior is right. Check that the test would fail if the change were reverted.

<example>
A change to `apply_coupon()` is checked by asserting the total for a 10 percent coupon on a `100.00` cart, not by asserting that the function returns a number.
</example>

When the work is a one-off, check the behavior directly or with the runner the project already has, because adding TDD, a new framework, or a coverage quota only to follow a guideline costs setup the task did not ask for.

<example>
A throwaway `fix-dates.ps1` script is checked by running it on a copy of `sample.csv` and comparing the output file, with no Pester suite added.
</example>

## Close the check

After a fix, run the original scenario as well as the focused test, look at the neighboring behavior the change can reach, and remove temporary probes, because a focused test can pass while the reported symptom remains and leftover probes change later behavior. Name the check that shows the fix works and any relevant check that did not run or was inconclusive. Check the diff for leftover `print` calls, sleeps, and skipped tests.

<example>
After fixing a 500 on `POST /orders`, replay the original `curl` request, run `tests/test_orders.py`, and report that the load-test script was not run.
</example>

After a small fix, rerun the checks the change can affect, the focused test, and the original scenario, and run the full suite only when the change touched shared code, configuration, or dependencies or the project requires it, because a full run after a local fix can take half an hour or more and adds no evidence about code the change cannot reach. Name the modules the change can reach before choosing the scope.

<example>
A one-line fix in `parse_price()` reruns `pytest tests/test_pricing.py` and the failing import script, while a bump of `requests` in `requirements.txt` triggers the full suite.
</example>

## References

Choose the references that apply before the dependent work and read each one, because each holds the checks for its branch. Leave the others unread so unrelated guidance stays out of context, and revisit the choice when the work changes.

- For a reported bug, unclear cause, or legacy behavior, read [diagnosis and regression](references/diagnosis.md).
- For behavior selection, risk cases, assertions, or snapshots, read [test design](references/test-design.md).
- For test scope, integrations, contracts, mocks, or fakes, read [boundaries and doubles](references/boundaries-and-doubles.md).
- For tables, generated inputs, metamorphic relations, or operation sequences, read [properties and models](references/properties-and-models.md).
- For fixtures, time, concurrency, or intermittent failures, read [isolation and flakiness](references/isolation-and-flakiness.md).
- For browser behavior or a measured performance concern, read the relevant section of [UI and performance](references/ui-and-performance.md).
- For requested coverage work or weak assertions, read [coverage and mutation](references/coverage-and-mutation.md).

<example>
A `test_inventory_sync` that fails only under `pytest -n 4` calls for diagnosis and regression plus isolation and flakiness, but not properties and models or coverage and mutation.
</example>
