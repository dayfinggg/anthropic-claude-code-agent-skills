# Property-based and mutation testing

## Contents

- Choosing a property
- Generators and replay
- Hypothesis settings
- Classifying a property failure
- Mutation testing runs
- Reading survivors
- Mutation testing gotchas

## Choosing a property

- Libraries this file matches: Hypothesis 6.170 (Python), fast-check 4.10 (TypeScript, with `@fast-check/vitest` for `test.prop`), proptest 1.12 (Rust), rapid (Go), jqwik (Java). Use the one the repository already has.
- Assert the strongest property the code supports. From strongest: roundtrip `decode(encode(x)) == x`, oracle `fast(x) == reference(x)`, idempotence `f(f(x)) == f(x)`, invariants (stays sorted, total preserved, never negative), algebraic laws (commutative, associative, identity), cheap checks of expensive results (`is_sorted(sort(x))` plus same multiset). "Does not crash" is the weakest.
- For decoders and parsers, assert "returns a value or raises the documented error, and nothing else" over arbitrary bytes or strings. Catch only the documented exception.
- `assert add(a, b) == a + b` restates the implementation and cannot fail. Use a law the function must obey instead.
- `f(x) == f(x)` is a real determinism property only when `f` may be impure: serializers over dicts or sets, hashing, iteration order, the clock.
- `a == b` must imply `hash(a) == hash(b)`. A failure of that law is a bug without further evidence.

## Generators and replay

- Build valid inputs in the generator (`st.integers(min_value=1)`, `st.builds`, `@st.composite`, fast-check `fc.record` and `.chain`) instead of discarding them with `assume()`, `fc.pre` or `.filter`. Heavy filtering runs few real cases and trips Hypothesis's `filter_too_much` health check.
- Pin known edge cases so they run every time: `@example(...)` in Hypothesis, the `examples` option of `fc.assert` in fast-check. In fast-check each example replaces one generated run, so the total number of runs stays the same. Empty, single element, duplicates, zero, negative and the maximum value recur.
- In fast-check 4, `fc.assert` returns a Promise only for an `fc.asyncProperty`. Await it there, or the test ends before the property runs.
- Replay a fast-check failure by passing the reported `{ seed, path }` to `fc.assert`. `path` starts directly at the shrunk counterexample.

## Hypothesis settings

- Defaults: `max_examples=100` and `deadline` of 200 ms. Set `deadline=None` for tests that do real work, or slow machines fail them.
- When the `CI` variable (or a known CI vendor variable) is set, Hypothesis loads its built-in `ci` profile: `derandomize=True`, `database=None`, `deadline=None`, `print_blob=True`, and the `too_slow` health check suppressed. CI then tests the same inputs on every run and stores no failures.
- Explore with more examples locally or in a scheduled job: `settings.register_profile("ci", settings.get_profile("ci"), max_examples=1000)` keeps the rest of the `ci` profile.
- Reproduce a CI failure with the printed `@reproduce_failure` decorator, on the same Hypothesis version.

## Classifying a property failure

- Classify a failure before fixing anything. The shrunk input either breaks a documented guarantee (code bug), violates a documented precondition (generator too broad), contradicts the docs or types (wrong property), or hits behavior nobody specified (ask the maintainer). Ground the decision in the spec, the types and the docstring, in that order.

## Mutation testing runs

- Tools this file matches: StrykerJS 10.1 (JavaScript and TypeScript), mutmut 3.8 and cosmic-ray 8.9 (Python), cargo-mutants 27.1 (Rust), Infection 0.35 (PHP), PIT 1.30 (Java).
- Run only on the change during development:
  - StrykerJS: `npx stryker run --incremental`, which reuses `reports/stryker-incremental.json` (`--incrementalFile` changes it), or `--mutate` with globs for the changed files. `--force` reruns every mutant in scope.
  - cargo-mutants: `git diff origin/main...HEAD > changes.diff`, then `cargo mutants --in-diff changes.diff`.
  - Infection: `infection --git-diff-lines --git-diff-base=origin/main`. A shallow CI clone needs the base fetched first (`git fetch --depth=1 origin <base>`). `--id=<mutant-id>` (repeatable since 0.35.11) reruns single mutants.
  - mutmut: `mutmut run "my_module*"` or `"my_module.my_function*"`.
  - PIT: `mvn -DwithHistory test-compile org.pitest:pitest-maven:mutationCoverage` reuses earlier results. Diff-scoped runs need the commercial arcmutate git plugin.
- Restrict targets to production source. Mutating tests, mocks, generated or vendored code inflates the run and the survivor list.

## Reading survivors

- A survivor means no test noticed the change. Check that the mutated code is reachable, that its effect is observable, and that an assertion looks at that effect. Then write the test that kills it, or prove the mutant equivalent.
- A mutant is equivalent only if no input can tell it apart. `>` against `>=` is not equivalent unless the boundary value is unreachable by type or control flow. `x > 0` against `x != 0` is equivalent only for unsigned values.
- Timeouts are inconclusive, not killed. Infection counts timed-out mutants as killed unless `--with-timeouts` is passed, and `--max-timeouts=<n>` fails the run above a ceiling.
- Rank survivors by what the code does: auth, validation, money and parsing first, logging last, whatever severity the tool assigns.
- Excluding a survivor from the config, a `// Stryker disable` comment, or a test that only pins the mutated constant hides the gap instead of closing it.

## Mutation testing gotchas

- Diff-scoped runs miss whole classes of change. cargo-mutants matches the diff against code under test only, so a diff that changes or deletes only tests runs no mutants. Stryker incremental mode does not notice changed dependencies, environment variables, `.snap` files or other non-test files. Run the full campaign before a release or on a schedule.
- mutmut re-tests only mutants in functions whose source changed. A changed non-Python file (a dependency, a data or config file) only produces a warning by default. Set `on_dependency_change = "rerun"`, or delete the `mutants/` directory, for a clean run.
- mutmut mutates only functions that tests call. Set `mutate_only_covered_lines = true` for line-level coverage filtering.
- Infection `--git-diff-lines` compares with `master` unless `--git-diff-base` is set.
- `mutmut browse` is a TUI and blocks an agent shell. `mutmut apply <mutant>` writes the mutant into the source, so use it only on a clean, committed tree.
