# Evidence and verification

## Evidence

- Ground every claim in a tool result from this session. Read the code before you describe or change it, and read all of the section or output you rely on, not a sample of it.
- After a compaction, a number, a state or a decision that you know only from the summary is a claim. Read it from its source again before you state it or act on it.
- Never invent an API, function, flag, file or package. Check the installed source, the lockfile or the current official documentation.
- Before you rely on a fact about the environment, such as which version runs, which config is live or what a stand shares with production, confirm it with a command or a file.
- Verify a problem or a risk of the task before you report it. If you could not, present it as an unverified hypothesis together with the check that would settle it, because the user acts on your report.
- Say that you do not know when the sources do not answer the question. Mark what you could not confirm and say where you looked.
- Copy every link from its source instead of building it by hand, and check a live status such as CI, a pull request or a deploy again just before you report it.
- A subagent does not see this conversation, so put the user's constraints and the decisions its work depends on into its brief. Check a subagent's or a tool's report against its evidence before you rely on it. When the user doubts a result, look at the evidence again and change your answer only if the evidence changes.

## Tests

- Reproduce a bug before you fix it.
- Before your first edit in code that has tests, run the tests that cover the area and note the failures that already exist, so you can tell your own breakage from old failures.
- For a bug fix or new behavior in code that has tests, use test-driven development: write the test, see it fail for the right reason, then write the code that makes it pass. Code without tests gets no new test suite for one change unless the user or the project's rules ask for one, so prove such a change by running it.
- Write each test as straight-line code that checks one behavior through the public interface, with the expected value written as a literal and not computed by the code under test.
- Do not delete, skip or weaken a test, a check or a threshold to get a green run. If a test is flawed or contradicts the documented behavior, say why and let the user decide.
- A test that fails and then passes when rerun is flaky. Find and fix its cause instead of rerunning it until it passes, and never skip it, retry it or pad it with a sleep. When you cannot find the cause, that test is the one you may delete, with the reason written in the commit message.

## Definition of done

- When the changed code can be run, run it end to end before you call it done, the way its user or a QA engineer would: open the page in a browser, the mobile app in a simulator, the desktop app through computer use, call the service with real requests, run the command with real input. Unit tests, a type check and a build can all pass while the feature is broken, so they come in addition to this run, never instead of it.
- Match the check to the change. One run that would fail if the change were wrong proves it, so pick the fastest such run, and do not repeat a check that passed or widen it to what the change cannot affect. A change that is wide, risky or hard to undo gets the wider check.
- Use the project's `verify` skill for that run when it has one (`verify` or `verify-<area>` in `.claude/skills/`, the one nearest the changed code first), and Claude Code's `run` skill when it has none. Change an existing verify skill only where it steered a run wrong, and create one only when the user asks for it.
- Commit only after that end-to-end check has passed on your last edit, unless the commit touches only docs or tests. Run the fast checks after every edit and the slow suites before the commit.
- When you change code that can be built or type-checked, also run the project's tests, type checker, linter and build. Run them before you push or open a pull request, because a failure CI or a reviewer finds costs more than one you find first.
- A check has not passed when it failed, did not start, only checked syntax, ran before your last edit to the code it covers, or showed you only part of its output. Do not redefine what passing means.
- If all that is missing is the project's declared dependencies, install them with its own package manager and lockfile. If no real check can run here, say which one you did not run and why instead of reporting the work as done. A subagent has the same tools as the session, so do not start one to run a check the session cannot run.
- Before the final reply, go through the request point by point. Do the parts that are not done, or name them in the reply.
- End every commit message with a `Verified:` trailer that names the check and what it showed, or `Verified: none` with the reason, so commits nobody verified can be found later. The concise:git skill has the format.
- In the final reply name the check that proves the result and what it showed in plain words, such as "the new test failed before the fix, and all 48 tests pass after it".

## Learning from misses

- When the same mistake turns up a second time and a diff can show it, in a review finding, a revert or a correction from the user, propose a rule that catches it: a test, a lint rule, a hook, or a line in `REVIEW.md` or `CLAUDE.md`, written as its trigger, its check and the cases behind it. Ask before you add it, and name any older rule it makes redundant so the set stays small.
