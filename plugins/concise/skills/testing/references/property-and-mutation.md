## Property-based testing

- Current libraries: Hypothesis 6.170 (Python), fast-check 4.10 (TypeScript, with `@fast-check/vitest` for `test.prop`), proptest 1.12 (Rust), rapid (Go), jqwik (Java). Use the one the repository already has.
- Assert the strongest property the code supports. From strongest: roundtrip `decode(encode(x)) == x`, oracle `fast(x) == reference(x)`, idempotence `f(f(x)) == f(x)`, invariants (stays sorted, total preserved, never negative), algebraic laws (commutative, associative, identity), cheap checks of expensive results (`is_sorted(sort(x))` plus same multiset). "Does not crash" is the weakest.
- For decoders and parsers, assert "returns a value or raises the documented error, and nothing else" over arbitrary bytes or strings. Catch only the documented exception.
- Build valid inputs in the generator (`st.integers(min_value=1)`, `st.builds`, `@st.composite`, fast-check `fc.record` and `.chain`) instead of discarding them with `assume()`, `fc.pre` or `.filter`. Heavy filtering runs few real cases and trips Hypothesis's `filter_too_much` health check.
- Pin known edge cases so they run every time: `@example(...)` in Hypothesis, the `examples` option of `fc.assert` in fast-check. Empty, single element, duplicates, zero, negative and the maximum value recur.
- Hypothesis defaults are `max_examples=100` and a 200 ms `deadline`. Set `deadline=None` for tests that do real work, or slow machines fail them.
- When the `CI` variable (or a known CI vendor variable) is set, Hypothesis switches to its `ci` profile: `derandomize=True`, `database=None`, `deadline=None`, `print_blob=True`. CI then tests the same inputs on every run and stores no failures. Explore with more examples locally or in a scheduled job (register an extended `ci` profile), and reproduce a CI failure with the printed `@reproduce_failure` decorator on the same Hypothesis version.
- Replay a fast-check failure by passing the reported `{ seed, path }` to `fc.assert`. `path` starts directly at the shrunk counterexample.
- `assert add(a, b) == a + b` restates the implementation and cannot fail. Use a law the function must obey instead.
- `f(x) == f(x)` is a real determinism property only when `f` may be impure: serializers over dicts or sets, hashing, iteration order, the clock.
- Classify a failure before fixing anything. The shrunk input either breaks a documented guarantee (code bug), violates a documented precondition (generator too broad), contradicts the docs or types (wrong property), or hits behavior nobody specified (ask the maintainer). Ground the decision in the spec, the types and the docstring, in that order.
- `a == b` must imply `hash(a) == hash(b)`. A failure of that law is a bug without further evidence.

## Mutation testing

- Current tools: StrykerJS 10.1 (JavaScript and TypeScript), mutmut 3.8 and cosmic-ray 8.9 (Python), cargo-mutants 27.1 (Rust), Infection 0.35 (PHP), PIT (Java).
- Run only on the change during development:
  - StrykerJS: `npx stryker run --incremental`, which reuses `reports/stryker-incremental.json`, or `--mutate` with globs for the changed files.
  - cargo-mutants: `git diff origin/main...HEAD > changes.diff`, then `cargo mutants --in-diff changes.diff`.
  - Infection: `infection --git-diff-lines --git-diff-base=origin/main`. A shallow CI clone needs the base fetched first.
  - mutmut 3: `mutmut run "my_module*"`.
- A survivor means no test noticed the change. Check that the mutated code is reachable, that its effect is observable, and that an assertion looks at that effect. Then write the test that kills it, or prove the mutant equivalent.
- A mutant is equivalent only if no input can tell it apart. `>` against `>=` is not equivalent unless the boundary value is unreachable by type or control flow. `x > 0` against `x != 0` is equivalent only for unsigned values.
- Timeouts are inconclusive, not killed.
- Rank survivors by what the code does: auth, validation, money and parsing first, logging last, whatever severity the tool assigns.
- Excluding a survivor from the config, or adding a test that only pins the mutated constant, hides the gap instead of closing it.

## Mutation testing gotchas

- Diff-scoped runs miss whole classes of change. A diff that touches only tests produces no mutants in cargo-mutants, and Stryker incremental mode does not notice changed dependencies, environment variables, snapshots or other non-test files. Run the full campaign before a release or on a schedule.
- Infection `--git-diff-lines` compares with `master` unless `--git-diff-base` is set.
- mutmut 3 mutates only code inside functions. `mutmut browse` is a TUI. `mutmut apply` writes a mutant into the source, so use it only on a clean, committed tree.
- Mutating tests, mocks, generated or vendored code inflates the run and the survivor list. Restrict the targets to production source first.
