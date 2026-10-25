# Diagnosis and regression

## Establish the failure predicate

When investigating a report, capture the input, initial state, relevant versions, and the caller-visible symptom, and locate the intended result in a requirement, contract, or independently justified example, because without a stated expected result any difference looks like the bug. Count startup errors, an empty test selection, and unrelated exceptions as not reproducing the defect. Check that the trigger reaches the failing path and tells correct behavior from the symptom.

<example>
For "export drops the last row", record the exact `input.csv`, the commit under test, and the expected `120` rows, and confirm the run prints `119` and not a `FileNotFoundError`.
</example>

When evidence comes from CI or another environment, compare configuration and inputs before changing the implementation, preserve the relevant traces, and redact secrets before sharing them, because an environment difference often explains a failure that no code change fixes. Run the real path and not a mock simulation of it, because a simulation can pass where the real prerequisite fails. If the real prerequisite is unavailable, name it and leave the diagnosis unconfirmed.

<example>
A test that passes locally and fails in CI is compared on Python version, `TZ`, and database image first, and the CI log is shared with the `Authorization` header removed.
</example>

## Reduce without changing the defect

When a reproduction contains unrelated data or steps, remove one portion at a time and rerun the same failure predicate, keeping a reduction only if the same failure remains, because a malformed setup or a different exception looks like a smaller case but is another problem. Retain the caller interactions, concurrency, and dependencies the failure needs, check the final case against the original symptom, and remember that a locally minimal case is not necessarily the smallest one.

<example>
Cutting a 5,000-row `orders.json` down to 3 rows keeps the `KeyError: 'currency'` on the same line, while a cut that raises `JSONDecodeError` is discarded.
</example>

## Separate competing explanations

When several causes fit, rank the plausible explanations, state what observation would contradict each, and pick the cheapest probe whose outcomes tell them apart, inspecting a boundary value, debugger state, or targeted trace before adding broad logging, because a probe whose results leave every explanation equally plausible costs a run and teaches nothing.

<example>
For a stale-price bug, one `print(cache.get("sku-1"))` before the lookup separates "the cache returns the old value" from "the database holds the old value", which debug logging for the whole service would not.
</example>

After each probe, compare the observation with the prediction made before it, update the explanation, and change one causal variable at a time where feasible, because two simultaneous changes leave no way to tell which one mattered. Treat a patch that only makes the symptom disappear as unfinished until it explains why the previous behavior violated its contract. Check the causal chain and the intended result before calling the cause established.

<example>
Setting `retries=0` and a shorter timeout together makes the failure vanish, so the two are changed separately and show that the timeout was the cause.
</example>

## Use the regression-first gate

When a regression test is written before the fix, make its assertion cover the intended correction through the caller path that reproduces the bug, because a shallow unit test passes while a defect that needs a transaction, several callers, or asynchronous completion remains. Confirm that the test fails for the contract and not because of a broken harness, and after the fix replay the focused test and the original scenario together with their relevant neighboring cases.

<example>
A double-charge bug that appears when two requests hit `POST /payments` with the same key gets a test that sends both requests concurrently and asserts one charge, not a unit test that calls `charge()` once.
</example>

If an existing expectation conflicts with the requested behavior, settle its contract before changing that test, and take the corrected expectation from the requirement, because copying the actual output into the expected value turns the test green without checking anything. Check that the new expectation would be the same had the implementation never been written.

<example>
A failing `assert total == 90` changes to `95` only after the pricing spec confirms the new shipping fee, not because the code now returns `95`.
</example>

## Characterize legacy behavior

When refactoring poorly understood code, capture and inspect representative existing outcomes before restructuring, including outputs, errors, ordering, and effects within the requested scope, and label these checks as characterization, because they record what the code does and not what it should do. Review each recorded outcome instead of approving it blindly, and keep a confirmed defect out of the intended contract. Check that every later difference is either a requested change or a regression.

<example>
Before splitting `legacy_invoice.py`, record the output of `build_invoice()` for 12 real order files in `characterization/`, and pin the odd rounding of `0.005` as current behavior with a note that it looks like a bug.
</example>

When a dependency prevents exercising legacy logic, first look for an existing replacement or observation point, identify its enabling point such as construction, an argument, or a build-time selection, and use the narrowest behavior-preserving seam that reaches the code, because a broad redesign or a test-only production branch changes the code the test is meant to protect. Check that normal construction still selects the real dependency and that the test runs the same logic.

<example>
A `Report` class that calls `datetime.now()` gets an optional `clock` constructor argument that defaults to the system clock, and the test passes a fixed one.
</example>
