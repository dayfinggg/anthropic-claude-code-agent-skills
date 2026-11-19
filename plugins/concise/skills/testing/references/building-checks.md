# Building and tuning checks

## Verify skills

- A verify skill is the project's smoke-test harness, written as steps another agent can follow from a clean environment to build, start and drive the app and to see what to look at. Put it in `.claude/skills/verify/SKILL.md` as close to the code it checks as you can, such as the package of a monorepo, and add one per area where the steps differ, such as `verify-web` and `verify-api`.
- When a session starts with a project or personal skill named `verify` or `simplify`, Claude Code's commit instructions (v2.1.286 and later, with `includeGitInstructions` on) tell Claude to run it right before each commit, except for docs-only and tests-only commits. Plugin skills, the bundled `/verify` and `/simplify`, and skills marked `disable-model-invocation: true` do not count.
- Claude Code's bundled `/verify` writes the recipe it worked out to `.claude/skills/verify/SKILL.md`, and `/run-skill-generator` records launch steps as `.claude/skills/run-<name>/`, so follow a recorded recipe instead of rediscovering it.
- Before you rely on a verify skill, run it several times in a row and from a clean checkout, and fix every step that fails or waits on a fixed sleep. Edit it only when it steered a run wrong, so that it does not change in every session.

## Designing a check

- A failing check says why it fired, with the rule, what in this change tripped it and how to fix it, so that the person it pulls in does not have to work it out from the diff.
- Keep a check where the change it judges cannot edit it. Code Review reads `REVIEW.md` from the base or default branch and never from the pull request, and a protected branch keeps a pull request from loosening required checks, so review a pull request that edits its own gate against the base version.
- Run cheap checks before expensive ones, such as tests, build and linter before a push, then CI, then review. A Stop hook that runs the tests when Claude finishes, or `/goal` with a passing suite as the condition, enforces this in a session.
- Write each item of a reliability checklist as a trigger that a diff can show, the check to run, and the incidents or pull requests behind it, such as checking that a new field loads safely from older transcripts that lack it whenever session storage or message types change. Match the triggers against the diff, run only the items that match, and name them in the result.

## Rolling out a gate

- Give a new gate three modes, off, observe and enforce. Start in observe, which only records what it would have blocked, and review those records for false positives before you switch to enforce.
- In enforce mode, let a commit carry in its message an explanation of why it was not verified, and let the next commit through after two blocks in one session, so that a gate's mistake cannot stall an agent.
- Stamp every commit with how it was verified, `none` included, so that `git log --format='%h %(trailers:key=Verified,valueonly,separator=%x2C )'` finds the unverified ones.

## Measuring a check or a reviewer

- Track what it missed and what it cost, with merged changes that were later reverted, changes a maintainer rejected before merge, and a size-matched set of changes that stayed clean as the control.
- For a formal evaluation, build cases from past incidents and reverts. Recreate the repository as it was at review time, write a one-sentence answer key that names the bug, and credit only findings that describe that bug. Add merged changes that stayed stable as controls against over-flagging, and keep the tuning set apart from the fixed test set.
- Measure recall at each stage separately (raw findings, after verification, final report), because one end-to-end score hides a stage that drops bugs an earlier one found.
- Grade importance as well as validity, as Important (must be fixed before merge), Nit, or Pre-existing (a bug the change did not introduce, which the author is not held to).
- Stop raising recall once the next gain would fit the evaluation rather than catch real bugs.

## Turning misses into rules

- A pattern becomes a candidate rule when it occurred in at least two changes and a diff can show it. Take candidates from human review comments, reverts and incidents.
- Try to disprove each candidate before you propose it, by looking for past diffs it would have flagged wrongly and for cases it misses, and let a person approve the rule in a pull request.
- Replay several bug finders on the pull request of a known incident. When at least two find the bug, it is detectable, and when they miss it on a small diff, that gap is worth a rule in `REVIEW.md`.
- One reviewer tuned over rounds beats a second or third reviewer stacked on top, so improve the primary reviewer's rules and point each round at the findings of earlier rounds and past failures instead of rechecking everything.
- Prune on a routine, because test suites, verification steps and rule files only grow unless someone removes the rules that no longer fire, that duplicate another or that cost more than they catch.
