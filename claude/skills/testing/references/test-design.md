# Test design

## Select meaningful behavior

When adding tests, identify a caller, its initial state, an action, and the promised result, and give priority to changed decisions and failures with material consequences, because a method-by-method inventory covers the code without saying what could break for a caller. Check that each case would tell a meaningful wrong outcome from the expected behavior.

<example>
For a new refund rule, write "an item returned after 31 days gets no refund" and "an item returned on day 30 gets a full refund", not one test per method of `RefundPolicy`.
</example>

When selecting edge cases, partition the contract into outcome classes, test where outcomes change with the boundary and the values immediately around it, and add combinations only when inputs interact, because a Cartesian product of unrelated dimensions multiplies cases without adding information. Skip empty, null, or negative inputs that lie outside the supported domain unless rejection is the contract, because the test would pin down behavior nobody promised. Check that each chosen case reaches its intended partition.

<example>
For free shipping from `50.00`, test `49.99`, `50.00`, and `50.01`, and skip negative totals because `Cart` cannot hold one.
</example>

When failure handling matters, drive the relevant dependency failure or partial operation and check the observable error and the promised absence of unwanted effects, because catching an exception does not prove that rollback, authorization, or idempotency worked. Check the resulting state through a real boundary when those guarantees depend on infrastructure.

<example>
Make the second insert in `import_orders()` raise, then query the database to confirm that no rows from the first insert remain.
</example>

## Make the oracle independent

When the contract specifies an exact result, derive the expected value independently from the contract or a worked example, because an assertion that calls the implementation to compute its own answer passes for any bug. Check a disputed result by hand or against a trusted independent oracle when practical, and investigate disagreement between two implementations as a finding instead of treating either one as correct.

<example>
Assert `monthly_payment(12000, 0.06, 12) == Decimal("1032.80")` from a published amortization table, not `== reference_payment(...)`, which shares the formula.
</example>

When asserting a state change, observe the state at the boundary promised to the caller and check both the required change and the state that should be preserved, because a helper-call assertion shows that code ran and not that the effect occurred. Use several assertions when they express one coherent guarantee.

<example>
After `PUT /users/7`, read `GET /users/7` and assert the new `email` and the unchanged `created_at`, instead of asserting that `repo.save` was called.
</example>

When numerical results allow error, choose an absolute or relative tolerance from the domain's error budget and keep exact comparison for exact contractual values such as monetary amounts, because loosening equality until the test passes lets real errors through. Check that the tolerance still rejects a materially wrong result.

<example>
A physics step uses `pytest.approx(9.81, rel=1e-3)`, while an invoice total is compared with `==` as `Decimal("19.99")`.
</example>

When a stable structured output is best checked as a snapshot, restrict the snapshot to the behavior under test, normalize only fields whose variation the contract declares irrelevant, and inspect each meaningful diff against the requested change before accepting it, because bulk snapshot updates and masked fields that are contractual, such as ordering, identifiers, or timestamps, stop the snapshot from detecting regressions.

<example>
A JSON snapshot of `GET /invoices/42` masks `generated_at` but keeps `line_items` in order, and `--snapshot-update` runs only after the diff has been read.
</example>

## Keep failures interpretable

When setup grows, keep behavior-defining values visible in the test and move only irrelevant construction detail into existing helpers, and separate setup, action, and verification with the project's idioms and whitespace, because a reader should see the decisive input and expected outcome without following hidden control flow. Avoid introducing a test DSL or a class hierarchy only to shorten the body, since it moves the logic out of sight.

<example>
A test builds the customer with `make_customer(country="DE")` so the country that drives the VAT rate stays in the body, while name, address, and email come from defaults.
</example>

When several cases share the same behavior and assertion shape, use the runner's parameterization with useful case identities and no mutable values shared across rows, because a clear case id shows which row failed and a shared list leaks changes between rows. Split rows that need different workflows or branching assertions into separate behavior-focused tests. Check test collection and rerun one failing row on its own.

<example>
`@pytest.mark.parametrize("code,rate", [("DE", 0.19), ("FR", 0.20)], ids=["germany", "france"])` lets `pytest -k france` rerun a single row.
</example>
