---
name: debugging
description: Diagnosing bugs, failing or flaky tests, crashes, hangs, wrong output and performance regressions. Use when something is reported broken, failing, slow or intermittent, when a fix did not work, when a test fails only in CI or only in the full suite, when an unfamiliar error message or stack trace appears, for races, leaks and segfaults, and when running git bisect, adding diagnostic logging or replacing sleeps in tests.
---

# Debugging

This skill covers finding the cause of a failure before changing code. It matches Git 2.56, hyperfine 2.0 and Vitest 5.1. Check with `git --version` and `hyperfine --version`. Where the installed release is newer, its own `--help` and release notes are right.

## Reproduce first

- Build a loop that goes red on this bug before forming any theory from reading code: one command, already run once, that drives the real code path and asserts the user's exact symptom. Make it deterministic (pin the clock, seed randomness, isolate the filesystem, stub the network) and fast enough to rerun after every change.
- When a human must act (click, sign in, use a device), give them one command that prompts step by step and prints what they observe as `KEY=VALUE` lines to paste back.
- When no loop works, say what you tried and ask for an environment that reproduces it, a redacted artifact (HAR file, log dump, core dump, timestamped recording) or permission for temporary instrumentation. Propose no fix until a loop exists.
- For an intermittent bug, raise the failure rate instead of chasing a clean repro: run the trigger 100 times, in parallel, under load, with timing windows narrowed. Calling it fixed takes about 3/p clean runs for 95 percent confidence, so 60 runs for a 5 percent failure rate.
- When minimizing, keep a cut only while the failure keeps the same signature (message and failing frame), not merely some failure.

## Unfamiliar error messages

- When a library, runtime, database, browser or external API prints an error you do not recognize, search the web for the exact message in quotes before changing code. Leave out your own paths, ids, hostnames and values, which no one else's report contains, and keep the error code and the fixed wording.
- Read the matching issue, changelog entry or docs page before acting on it. A reported upstream fix or a documented misuse is a better answer than a workaround in this code.

## Hypotheses and fixes

- Write 3 to 5 ranked hypotheses before testing any, each with a prediction of the form "if X is the cause, changing Y makes the failure disappear". The prediction must name something you have not looked at yet, or it cannot fail.
- Probe one variable at a time. Drive a debugger non-interactively (`gdb -batch -x cmds`) or evaluate one REPL expression, since the shell tools have no interactive input. Otherwise log at the boundaries that separate the hypotheses, tag every line with a unique marker such as `[DEBUG-a4f2]`, and remove the lines by grepping the marker at the end.
- In a chain of components (CI to build to deploy, API to service to database), log what enters and leaves each boundary in one run to find the failing layer before reading any layer's code.
- When two fixes that rest on the same premise fail the same check, write that premise as one sentence and test it directly with an observation that would come out differently if it were false. Write no third fix on that premise until it holds.
- After three fixes that each fail or surface a new problem elsewhere, stop fixing. Report the pattern and discuss the design with the user.
- Put the regression test at a seam that reproduces the bug as it occurs at the call site. When the fix has several parts, revert one and confirm the test fails, and after the fix rerun the original, unminimized loop.

## Bisect

- `git bisect run` reads exit 0 as good, 1 to 127 except 125 as bad, and 125 as skip. Any other code aborts the bisect, including 255 from `exit(-1)` and 128 plus the signal number from a crash. Wrap the test and map those exits.
- Keep the bisect script outside the repository, where checkouts cannot change it. Rebuild and reinstall dependencies at every step, since the lockfile moves with the commits, and exit 125 when the build fails.
- Use `--first-parent` when merged branches contain broken intermediate commits, and `git bisect start --term-old fast --term-new slow` for a performance bisect. Finish with `git bisect reset`, or pass `--reset-when-found` (Git 2.56 and later) to `start` or `run`.
- A test that fails only in the full suite has a polluter. Bisect the set of test files that run before it to find the one that leaks state.

## Performance and memory

- Measure before changing anything: time release builds of the good and the bad version on the same machine with warmups and repeated runs (`hyperfine --warmup 3 ./good ./bad`). Time one build against itself first, and if that already shows a difference, add runs. Run one benchmark at a time, since parallel agents, builds or benchmarks skew each other.
- A timing explains slowness only when it names what bounds it: CPU, a lock, disk, a connection pool, a round trip or the harness itself. Change one thing per measurement and rerun before believing a delta of a few percent.
- For a memory leak, take heap snapshots at baseline, after repeating one action 10 times, and after undoing it. Objects that survive the undo in multiples of the repeat count are the leak.

## Waiting in tests

- Wait on the condition, not on time: poll a fresh read of the state, with a timeout and a message naming what you waited for. Use a fixed delay only to test timed behavior (debounce, retry interval), after waiting for the trigger, with the length derived from the known interval.
- Raising a timeout to fix a flake hides the race and slows every run.
- Start listening before the action that fires the event, and read the state inside the poll, not from a value captured before it.
- Testing Library `waitFor` and Vitest `vi.waitFor` retry only while the callback throws, so `waitFor(() => count === 2)` resolves at once. Assert inside the callback, or use `vi.waitUntil`, which retries on a falsy return. Both time out after 1,000 ms by default.

## Gotchas

- The loop can go red on a nearby failure instead of the reported one. Compare the captured symptom with the report before going further.
- Uncommitted work in `git status` is the first suspect. When those files could reach the failure, run the loop in a `git worktree add --detach <dir> HEAD` checkout, which leaves the edits in place.
- A reproducible failure is not yet a bug in the library that raises it. Check its docs, types and changelog first: documented behavior means the caller is wrong.
- A failure that clears after a restart, reinstall or cache wipe proves recovery, not the cause. Keep the hypotheses open until one is confirmed.
- When you force a red by mutating code or a fixture, diff against a pristine copy to prove the mutation landed.
- A failure only in CI or on one machine: diff the environments before the code. Check runtime and tool versions, a clean lockfile install, `TZ` and locale, CPU count and worker parallelism, filesystem case sensitivity, and whether a TTY is attached.
- Missing output proves a code path never ran only after a line you know was emitted shows up in the same view. Test runners capture output (`pytest -s` turns capture off), setups silence loggers, and log queries drop lines through retention, sampling, filters or the time window.
- hyperfine 2.0 runs benchmarked commands without a shell by default: `*`, `~` and `$VAR` reach the program literally, and a bare `|`, `>` or `&&` is refused until you pass `-S` (shell) or `-N` (literal). Its `--export-json` schema also changed: `results[i].mean` is now `results[i].summary.time_wall_clock.mean`.
- Captured requests and logs hold auth headers and tokens. Quote only the lines that carry the signal, and build loops on environment variables instead of pasted secrets.

Related skills: concise:testing for seam choice and proving a fix, concise:orchestration for running independent hypothesis agents, concise:git for history commands, concise:codebase-analysis for finding every reader of the code a fix changes.
