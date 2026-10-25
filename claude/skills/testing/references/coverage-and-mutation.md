# Coverage and mutation

## Use coverage to locate questions

When requested coverage work or a risk gap justifies measurement, run the project's existing coverage command and configuration, and confirm that the intended tests ran and the relevant source was instrumented, because a percentage produced by an empty selection, wrong paths, or unrelated broad tests says nothing about the change. Compare the uncovered lines or branches with the behavior the change must protect.

<example>
`pytest --cov=billing` reports no data because the package is installed as `app.billing`, so the path is corrected to `--cov=app.billing` before any number is read.
</example>

When an uncovered branch matters, derive an input and expected outcome from its public contract and add the smallest behavior test that reaches the branch and checks its consequence, because tests of private helpers, trivial accessors, or generated code raise the number without protecting behavior. Check that the assertion would fail if the branch returned the wrong result, not only that the line executed.

<example>
The uncovered `if amount > limit` branch in `withdraw()` gets one test with `amount=limit + 1` that expects `InsufficientFunds` and an unchanged balance.
</example>

When the repository already enforces a coverage gate, keep its threshold and exclusions unless the request authorizes changing them, and report the measured value next to any material behavioral gap, because lowering a threshold or widening exclusions to pass hides the gap the gate exists to show. Treat full coverage as a measurement and not as proof of correctness. Check both the gate result and the behavior.

<example>
CI requires 85 percent and the run shows 86 percent, and the report still notes that the refund timeout path has no assertion.
</example>

## Check assertion sensitivity when warranted

When tests execute important logic but seem insensitive to wrong outcomes, run targeted mutation testing with existing tooling, starting from a passing, stable baseline and a bounded set of relevant files, because a whole-repository campaign or a newly installed framework costs far more than the question needs. Read the actual mutant outcomes and the tests that detect them.

<example>
In a project that already uses `mutmut`, run it on `app/pricing.py` after `pytest` is green, not on all of `app/`.
</example>

When a meaningful mutant survives, decide whether the cause is missing input coverage, a weak oracle, or behavior that cannot be observed, and add a contract-based case that detects the faulty behavior, because an assertion that inspects the mutation or an implementation detail kills that mutant and nothing else. Check that the new case fails against the mutant and passes against the correct implementation.

<example>
A surviving mutant that changes `>=` to `>` in `is_adult(age)` is killed by a case with `age=18` that expects `True`.
</example>

When reviewing mutation results, separate killed, survived, uncovered, timeout, invalid, and ignored outcomes, check for runner and infrastructure failures before reading timeouts as detections, and leave compile and runtime errors out of the behavioral evidence, because those outcomes can raise the score without any test noticing a behavior change. Confirm the tool's metric definition before comparing scores across runs, since tools count timeouts and ignored mutants differently.

<example>
A score that rose from 71 to 80 percent is recounted after 12 of the newly killed mutants turn out to be syntax errors.
</example>

When a survivor is equivalent under the supported contract, record that reasoning in the task context and leave the production code and exclusions as they are, because distorting code or weakening exclusions to reach a perfect score trades real quality for a number. Recheck the contract where equivalence is uncertain and report the remaining limit, because a mutation score describes sampled faults and not every real defect.

<example>
Changing `while i < n` to `while i != n` in a loop that increments `i` by one from `0` is equivalent, so the note says so and the loop stays unchanged.
</example>
