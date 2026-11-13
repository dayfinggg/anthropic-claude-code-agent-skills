---
name: debugging
description: Diagnosing bugs, failing or flaky tests, crashes, hangs, wrong output and performance regressions. Use when an error log, exception log, monitoring alert or ticket reports a problem to fix, when something is reported broken, failing, throwing, slow or intermittent, when a fix did not work, when a test fails only in CI, on one machine or in the full suite, when the user pastes a stack trace or mentions a race, deadlock, memory leak or segfault, says "debug this", "why is this happening", "it worked yesterday" or "find what broke it", before changing code whose failure the error alone does not explain, and when adding diagnostic logging, running git bisect or replacing sleeps and timeouts in tests.
---

## Read first

Do these steps now, in order, before anything else and whatever the task. The files hold the traps this skill depends on, the pages tell you whether its versions are still current, and a skipped file or page is the usual cause of a wrong result.

1. Fetch https://raw.githubusercontent.com/git/git/maint/GIT-VERSION-GEN (Current Git release (`DEF_VER`)) with `curl -sL` or WebFetch and compare it with the facts below. Where the page shows a newer version than this skill names, follow the page.

## Check first

- Find the fastest command that runs one test or one scenario: `package.json` scripts, `pyproject.toml`, `Makefile` or `justfile`, and the CI workflow that fails.
- Collect what changed since the last known-good state: `git log`, the lockfile diff, runtime and tool versions, config and environment.
- Run `git --version` before a bisect. `--reset-when-found` needs Git 2.56 (released 2026-09).
- Facts verified 2026-11.

## Defaults

- First build a feedback loop that goes red on this bug: one command, already run once, that drives the real code path and asserts the user's exact symptom. It is deterministic (pin the clock, seed randomness, isolate the filesystem, stub the network), takes seconds and runs without a human. Form no theory from reading code until it exists.
- Pick the loop in this order: a failing test at the seam that reaches the bug, an HTTP script against a dev server, a CLI run on a fixture diffed against a known-good snapshot, a headless browser script, a replay of a captured request or event log, a throwaway harness around one function, a property or fuzz loop, a bisect harness, a differential run of old against new version or config.
- When a human must act (click, sign in, use a device), give them one command that prompts step by step and prints what they observe as `KEY=VALUE` lines to paste back.
- When none of these loops works, say what you tried and ask for access to an environment that reproduces it, a redacted artifact (HAR file, log dump, core dump, timestamped recording), or permission for temporary instrumentation. Propose no fix until a loop exists.
- For an intermittent bug, raise the reproduction rate instead of chasing a clean repro: run the trigger 100 times, in parallel, under load, with timing windows narrowed. A 50 percent failure is debuggable, a 1 percent failure is not yet. Calling it fixed takes about 3/p clean runs for 95 percent confidence, so 60 for a 5 percent failure rate.
- Minimize: cut inputs, callers, config, data and steps one at a time and rerun after each cut. Keep a cut only while the failure keeps the same signature (message and failing frame), not merely some failure. Stop when removing any remaining element turns the loop green.
- Write 3 to 5 ranked hypotheses before testing any, each with a prediction: "if X is the cause, changing Y makes the failure disappear". The prediction must name something you have not looked at yet. One that only restates the hypothesis cannot fail. Show the ranking to the user if present, without waiting for an answer.
- Probe one variable at a time, each probe tied to one prediction. Prefer a debugger driven non-interactively (a batch command script such as `gdb -batch -x cmds`) or a one-off REPL expression, since the shell tools have no interactive input. Otherwise log at the boundaries that separate the hypotheses, prefix every line with a unique tag such as `[DEBUG-a4f2]`, and grep the tag out at the end.
- In a chain of components (CI to build to deploy, or API to service to database), log what enters and leaves each boundary in one run to find the failing layer before reading any layer's code.
- When the cause stays unclear and the evidence is wide, have independent agents form hypotheses from disjoint evidence (logs, code, data) and others try to refute them. For dispatch, see concise:orchestration.
- Put the regression test at a seam that reproduces the bug as it occurs at the call site (for seam choice, see concise:testing). When only a shallower seam exists, report that as a finding instead of a test that gives false confidence.
- When the fix has several parts, revert one and confirm the regression test fails. After the fix, rerun the original, unminimized loop.
- After three fixes that each fail or surface a new problem somewhere else, stop fixing. Report the pattern and discuss the design with the user.
- For a performance regression, measure before changing anything: time release builds of the known-good and the bad version on the same machine with warmups and repeated runs (`hyperfine --warmup 3 ./good ./bad`). Start by timing one build against itself: if no change already looks like a win, add runs. Run one benchmark at a time, since parallel agents, builds or benchmarks skew each other. Then bisect with a script that exits 1 above a threshold.
- A timing explains slowness or supports a fix only when it names what bounds it: CPU, a lock, disk, a connection pool, a round trip or the harness itself. Change one thing per measurement, re-measure the final state, and rerun before believing a delta of a few percent.
- For a memory leak, take heap snapshots at baseline, after repeating the same action 10 times, and after undoing it. Objects that survive the undo in multiples of the repeat count are the leak.
- Wait on the condition, not on time: poll a fresh read of the state, with a timeout and a message naming what you waited for. Use a fixed delay only to test timed behavior (debounce, retry interval), after waiting for the trigger, with the length derived from the known interval.

## Gotchas

- The loop goes red on a nearby failure instead of the reported one. Compare the captured symptom with the report before going further.
- Uncommitted work in `git status` is the first suspect, not background. When those files could reach the failure, run the loop in a `git worktree add --detach <dir> HEAD` checkout before tracing committed code, which leaves the edits in place.
- A reproducible failure is not yet a bug in the library or API that raises it. Check its docs, types and changelog first: documented behavior means the caller is wrong.
- A failure that clears after a restart, reinstall or cache wipe proves recovery, not the cause. Keep the hypotheses open until one is confirmed.
- When you force a red by mutating code or a fixture, diff against a pristine copy to prove the mutation landed.
- `git bisect run` reads exit 0 as good, 1 to 127 except 125 as bad, and 125 as skip. Any other code aborts the bisect, including 255 from `exit(-1)` and 128 plus the signal number from a crash. Wrap the test and map those exits.
- Keep the bisect script outside the repository, where checkouts cannot change it. Rebuild and reinstall dependencies at every step, since the lockfile moves with the commits, and exit 125 when the build fails.
- Use `--first-parent` when merged branches contain broken intermediate commits, and `git bisect start --term-old fast --term-new slow` for a performance bisect. Finish with `git bisect reset`, or pass `--reset-when-found` on Git 2.56 or later.
- Testing Library `waitFor` and Vitest `vi.waitFor` retry only while the callback throws, so `waitFor(() => count === 2)` resolves at once. Assert inside the callback, or use `vi.waitUntil`, which retries on a falsy return. Both time out after 1,000 ms by default.
- A wait set up after the action that fires the event can miss it. Start listening first, and read the state inside the poll, not from a value captured before it.
- Raising a timeout to fix a flake hides the race and slows every run.
- A test that fails only in the full suite has a polluter. Bisect the set of test files that run before it to find the one that leaks state.
- A failure only in CI or on one machine: diff the environments before the code. Check runtime and tool versions, a clean lockfile install, `TZ` and locale, CPU count and worker parallelism, filesystem case sensitivity, and whether a TTY is attached.
- Missing output proves a code path never ran only after a line you know was emitted shows up in the same view. Test runners capture output (`pytest -s` turns capture off), setups silence loggers, and log queries drop lines through retention, sampling, filters or the time window.
- hyperfine 2.0 (2026-10) runs benchmarked commands without a shell by default: `*`, `~` and `$VAR` reach the program literally, and a bare `|`, `>` or `&&` is refused until you pass `-S` (shell) or `-N` (literal).
- Redact secrets in every command and output you show. Build loops on environment variables, and quote only the lines that carry the signal from captured requests, which hold auth headers.
- State the confirmed hypothesis in the report and in the commit or PR message.
