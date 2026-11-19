# Property-based and mutation testing

## Choosing a property

- This file matches Hypothesis 6.170 (Python), fast-check 4.10 (TypeScript, with `@fast-check/vitest` for `test.prop`), proptest 1.12 (Rust), rapid (Go) and jqwik (Java).
- Assert the strongest property the code supports, in this order from the strongest: round-trip `decode(encode(x)) == x`, oracle `fast(x) == reference(x)`, idempotence `f(f(x)) == f(x)`, invariants (stays sorted, total preserved, never negative), algebraic laws (commutative, associative, identity), and cheap checks of expensive results (`is_sorted(sort(x))` plus the same multiset), with not crashing last.
- For decoders and parsers, assert over arbitrary bytes or strings that the code returns a value or raises the documented error and nothing else, and catch only the documented exception.
- `assert add(a, b) == a + b` restates the implementation and cannot fail, so use a law the function must obey.
- `f(x) == f(x)` is a real determinism property only when `f` may be impure, as with serializers over dicts or sets, hashing, iteration order or the clock.
- A failure of the law that `a == b` implies `hash(a) == hash(b)` is a bug without further evidence.

## Generators and replay

- Build valid inputs in the generator (`st.integers(min_value=1)`, `st.builds`, `@st.composite`, fast-check `fc.record` and `.chain`) instead of discarding them with `assume()`, `fc.pre` or `.filter`, because heavy filtering runs few real cases and trips Hypothesis's `filter_too_much` health check.
- Pin known edge cases with `@example(...)` in Hypothesis or the `examples` option of `fc.assert`, where each example replaces one generated run. Empty, single element, duplicates, zero, negative and the maximum value recur.
- In fast-check 4, `fc.assert` returns a Promise only for an `fc.asyncProperty`. Await it there, or the test ends before the property runs.
- Replay a fast-check failure by passing the reported `{ seed, path }` to `fc.assert`, where `path` starts directly at the shrunk counterexample.

## Hypothesis settings

- Hypothesis defaults to `max_examples=100` and a `deadline` of 200 ms, so set `deadline=None` for tests that do real work, or slow machines fail them.
- When the `CI` variable or a known CI vendor variable is set, Hypothesis loads its built-in `ci` profile with `derandomize=True`, `database=None`, `deadline=None`, `print_blob=True` and the `too_slow` health check suppressed, so CI tests the same inputs on every run and stores no failures.
- Explore with more examples locally or in a scheduled job, where `settings.register_profile("ci", settings.get_profile("ci"), max_examples=1000)` keeps the rest of the `ci` profile.
- Reproduce a CI failure with the printed `@reproduce_failure` decorator on the same Hypothesis version.

## Classifying a property failure

Classify a failure before you fix anything. The shrunk input breaks a documented guarantee (code bug), violates a documented precondition (generator too broad), contradicts the docs or types (wrong property), or hits behavior nobody specified (ask the maintainer). Ground the decision in the spec, the types and the docstring, in that order.

## Mutation testing runs

This file matches StrykerJS 10.1 (JavaScript and TypeScript), mutmut 3.8 and cosmic-ray 8.9 (Python), cargo-mutants 27.1 (Rust), Infection 0.35 (PHP) and PIT 1.30 (Java). During development, run them only on the change.

| Tool | Run on the change | Notes |
| --- | --- | --- |
| StrykerJS | `npx stryker run --incremental`, or `--mutate` with globs for the changed files | Incremental mode reuses `reports/stryker-incremental.json` (`--incrementalFile` changes it), and `--force` reruns every mutant in scope |
| cargo-mutants | `git diff origin/main...HEAD > changes.diff`, then `cargo mutants --in-diff changes.diff` | |
| Infection | `infection --git-diff-lines --git-diff-base=origin/main` | A shallow CI clone needs the base first (`git fetch --depth=1 origin <base>`), and `--id=<mutant-id>` (repeatable since 0.35.11) reruns single mutants |
| mutmut | `mutmut run "my_module*"` or `"my_module.my_function*"` | |
| PIT | `mvn -DwithHistory test-compile org.pitest:pitest-maven:mutationCoverage` | `withHistory` reuses earlier results, and diff-scoped runs need the commercial arcmutate git plugin |

Restrict targets to production source, because mutating tests, mocks, generated or vendored code inflates the run and the survivor list.

## Reading survivors

- A survivor means no test noticed the change. Check that the mutated code is reachable, that its effect is observable and that an assertion looks at that effect, then write the test that kills it or prove the mutant equivalent.
- A mutant is equivalent only if no input can tell it apart. `>` against `>=` is not equivalent unless the boundary value is unreachable by type or control flow, and `x > 0` against `x != 0` is equivalent only for unsigned values.
- Timeouts are inconclusive, not killed. Infection counts timed-out mutants as killed unless `--with-timeouts` is passed, and `--max-timeouts=<n>` fails the run above a ceiling.
- Rank survivors by what the code does, with auth, validation, money and parsing first and logging last, whatever severity the tool assigns.
- Excluding a survivor from the config, a `// Stryker disable` comment or a test that only pins the mutated constant hides the gap instead of closing it.

## Mutation testing gotchas

- Diff-scoped runs miss whole classes of change. cargo-mutants matches the diff against code under test only, so a diff that changes or deletes only tests runs no mutants, and Stryker's incremental mode does not notice changed dependencies, environment variables, `.snap` files or other non-test files. Run the full campaign before a release or on a schedule.
- mutmut re-tests only mutants in functions whose source changed, and a changed non-Python file, such as a dependency, data or config file, only produces a warning by default. Set `on_dependency_change = "rerun"`, or delete the `mutants/` directory, for a clean run.
- mutmut mutates only functions that tests call, and `mutate_only_covered_lines = true` narrows that to covered lines.
- Infection `--git-diff-lines` compares with `master` unless `--git-diff-base` is set.
- `mutmut browse` is a TUI and blocks an agent shell. `mutmut apply <mutant>` writes the mutant into the source, so use it only on a clean, committed tree.
