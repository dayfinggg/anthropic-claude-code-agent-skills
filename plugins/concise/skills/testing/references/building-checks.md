# Building and tuning checks

## Contents

- Verify skills
- What makes a check trustworthy
- Diff-triggered checklists
- Rolling out a gate
- Measuring a check or a reviewer
- Turning misses into rules

## Verify skills

- A verify skill is the project's smoke test harness: how to build, start and drive the app and what to look at, written as steps another agent can follow from a clean environment. Put it in `.claude/skills/verify/SKILL.md` as close to the code it checks as you can (the package of a monorepo), and add one per area where the steps differ (`verify-web`, `verify-api`).
- When a session starts with a project or personal skill named `verify` or `simplify`, Claude Code's commit instructions tell Claude to run it right before each commit, except for docs-only and tests-only commits (v2.1.286 and later, with `includeGitInstructions` on). Plugin skills, the bundled `/verify` and skills marked `disable-model-invocation: true` do not count.
- Claude Code's bundled `/verify` writes the recipe it worked out to `.claude/skills/verify/SKILL.md`, and `/run-skill-generator` records launch steps as `.claude/skills/run-<name>/`. Follow a recorded recipe instead of rediscovering it.
- Make it fast and reliable before relying on it: run it several times in a row and from a clean checkout, and fix every step that fails or waits on a fixed sleep. Edit it only when it steered a run wrong, so it does not change in every session.
- Keep secrets out of it. Name the environment variable or the secret store entry that holds a credential.

## What makes a check trustworthy

- The people who own the code write its checks and refine them until they flag what the owner would flag.
- A failing check says why it fired: the rule, what in this change tripped it and how to fix it, so the person it pulls in does not have to work it out from the diff.
- A change must not be able to edit the check that judges it. Keep gating rules where the change cannot reach them: Code Review reads `REVIEW.md` from the base branch and never from the pull request, and a protected branch keeps a pull request from loosening required checks. A pull request that edits its own gate is reviewed against the base version.
- A result counts for the commit it ran on. A review or check that passed on an older commit says nothing about the current head.
- Run cheap checks before expensive ones: tests, build and linter locally before a push or a pull request, then CI, then review. A Stop hook that runs the tests when Claude finishes, or `/goal` with a passing suite as the condition, enforces this in a session.

## Diff-triggered checklists

- Write each item of a reliability checklist as a trigger that can be read from a diff, the check to run, and the incidents or pull requests behind it. For example: when session storage or message types change, check that a new field loads safely from older transcripts that lack it.
- Read the diff, match the triggers and run only the items that match, usually a handful, and name them in the result. Nobody has to remember past outages.

## Rolling out a gate

- Give a new gate three modes: off, observe and enforce. Start in observe, which only records what it would have blocked, and review those records for false positives before switching to enforce.
- In enforce mode let a commit carry an explanation in its message of why it was not verified, and let the next commit through after two blocks in one session, so an agent never gets stuck on a gate's mistake.
- Stamp every commit with how it was verified, including `none`, so unverified commits can be queried: `git log --format='%h %(trailers:key=Verified,valueonly,separator=%x2C )'`.

## Measuring a check or a reviewer

- Track what it missed and what it cost: merged changes that were later reverted, changes a maintainer rejected before merge, and a size-matched set of changes that stayed clean as the control.
- For a formal evaluation, build cases from past incidents and reverts: recreate the repository as it was at review time, and write a one-sentence answer key naming the bug. Credit only findings that describe that bug. Add merged changes that stayed stable as controls against over-flagging, and keep the tuning set apart from the fixed test set.
- Measure recall at each stage separately (raw findings, after verification, final report), so you can see a stage that drops bugs an earlier one found. One end-to-end score hides that.
- Grade importance as well as validity: Important (must fix before merge), Nit, or Pre-existing (a bug the change did not introduce, which the author is not held to).
- Raise recall only until the next gain would fit the evaluation rather than catch real bugs.

## Turning misses into rules

- A pattern becomes a candidate rule when it occurred in at least two changes and can be recognized from a diff. Take candidates from human review comments, reverts and incidents.
- Try to disprove each candidate before proposing it: look for past diffs it would have flagged wrongly and for cases it misses. A person approves the rule in a pull request.
- Replay several bug finders on the pull request of a known incident. When at least two find the bug, it is detectable. When they miss it on a small diff, that gap is worth a rule in `REVIEW.md`.
- One reviewer tuned over rounds beats a second or third reviewer stacked on top. Improve the primary reviewer's rules, and point each round at the findings of earlier rounds and past failures instead of rechecking everything.
- Prune on a routine. Test suites, verification steps and rule files only grow unless someone removes the rules that no longer fire, duplicate another or cost more than they catch.
