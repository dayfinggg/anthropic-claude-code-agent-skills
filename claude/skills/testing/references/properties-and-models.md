# Properties and models

## Select a useful technique

When a few known examples describe the required change, start with explicit or parameterized tests and use generated inputs when a defensible rule spans a broad domain, because examples are cheaper to read and generated inputs pay off only where a rule holds across many values. Add a property-testing library only when the project needs it and not to raise case counts. Check that the proposed property would reject a plausible faulty implementation and can be written with the available infrastructure.

<example>
Three parameterized rows cover the tax brackets of `compute_tax(income)`, while "sorting twice equals sorting once" over random lists uses the project's existing Hypothesis setup.
</example>

| When | Action | Refuse | Check |
|---|---|---|---|
| Outcome partitions have known answers | Use named table rows | Branching assertions and duplicated setup variants | Each row is collected and independently runnable |
| A transformation preserves a domain guarantee | Generate valid inputs and assert that invariant | Checking only types when stronger guarantees matter | A realistic corruption would violate the assertion |
| A reversible representation has a defined equivalence | Check roundtrip under that equivalence | Exact equality for lossy or normalized representations | Known independent examples still agree |
| An exact oracle is expensive but input relations are known | Use a metamorphic relation | Assuming a transformation preserves behavior without evidence | Both original and transformed inputs satisfy the contract |
| Results depend on earlier operations | Generate sequences with invariants or a small model | A second copy of the production algorithm | State and invariants agree after applicable transitions |

## Generate the actual domain

When designing generators, encode bounds, structure, and dependent fields directly in the strategy, and keep the empty, duplicate, extreme, and invalid classes whose behavior the contract defines, because a generator that filters away almost every case, or a test that returns early before asserting, passes while checking nothing. Read the generation statistics and health warnings, so a passing run is known to contain meaningful executions.

<example>
Instead of `st.integers().filter(lambda x: x % 7 == 0)`, build `st.integers().map(lambda n: n * 7)`, and add an explicit empty-list case.
</example>

When a property fails, inspect the shrunk case and the documented preconditions before changing the implementation, and classify the cause as a wrong property, an invalid generator, an ambiguous contract, or a genuine product defect, because redefining the domain to exclude an inconvenient valid counterexample hides a real bug. Replay the case and verify the claimed violation independently.

<example>
A failing `slugify` property shrinks to `"  "`, and the contract says whitespace-only titles are valid, so the code is fixed and the generator stays as it is.
</example>

## Use relations without overstating them

When using metamorphic testing, specify the input transformation and the required relation between outputs, and bound the relation to the conditions where it is justified, because permutation, scaling, or idempotence claims that the domain does not promise produce false failures. Add known-answer examples too, since two equally wrong outputs can satisfy a relation.

<example>
Shuffling the lines of an order leaves `total(order)` unchanged, doubling every quantity is not asserted to double `shipping_fee(order)` because shipping is tiered, and one fixed order with a total of `42.50` anchors the result.
</example>

When comparing with a reference implementation, establish why it is a suitable oracle for the selected domain and keep its algorithm independent of the code under test where feasible, because a copy of the same algorithm repeats the same bug, and an old implementation is wrong wherever the requested change intends different behavior. Check the differences against the contract and record intended changes explicitly.

<example>
The new `parse_duration` is compared with the old parser on 500 stored inputs, and the 4 differences for `"1h30"` are listed as intended because the spec now accepts that form.
</example>

## Model sequences, not internal code

When operation ordering matters, define the commands and the public guarantees, and add a small model only where it helps predict outcomes, with each command's preconditions, effects, observable results, and the invariants after every applicable step. Keep identifiers produced by earlier operations available to later commands, because sequences that cannot refer to earlier results never reach the interesting states. Keep invalid calls in the sequence when their required rejection is under test, because a precondition that filters them out removes that check. Verify both accepted and rejected transitions where the contract distinguishes them.

<example>
A cart model defines `add(sku, qty)`, `remove(sku)`, and `checkout()`, compares `len(items)` with the model count after each step, and keeps calling `remove("missing")` to assert that it raises `KeyError`.
</example>

When a generated sequence finds a failure, preserve its initial state, commands, and the library-specific replay information, and reset the real system and any model between sequences but not between dependent commands, because shared mutable state across generated cases makes a failure depend on earlier cases, and a mid-sequence reset breaks the dependencies the sequence relies on. Give the model its own logic, since a model that calls the implementation to predict itself cannot disagree with it. Confirm that the minimal sequence fails from a fresh state.

<example>
A failing run saves `[create("a"), rename("a", "b"), delete("a")]` with its seed, and `reset_database()` runs once before each sequence and never between steps.
</example>

When keeping a discovered regression, save an explicit input or operation sequence in the maintained suite and keep the seeds and replay paths for diagnosis, because a local example database or an opaque, version-bound replay blob disappears on another machine or stops working after an upgrade. Check that the regression still runs with the local cache deleted.

<example>
The failing `parse_range("5-")` input becomes an `@example("5-")` decorator and a named test, and the check passes after removing `.hypothesis/`.
</example>
