# Running a plan through implementers and reviewers

## Before each implementation dispatch

- Record the base commit with `git rev-parse HEAD` and run the tests there. Known failures at the base go into the brief.
- Write the review range to one file the reviewer reads once, with `git log --oneline <base>..HEAD`, `git diff --stat <base>..HEAD` and `git diff -U10 <base>..HEAD`.

## Reviewer brief

- Give the reviewer the task text, the implementer's report file, the diff file and the spec's binding constraints copied verbatim.
- Tell it that the rationales in the report are claims, which do not lower a finding's severity.
- Review method and severity thresholds are in concise:code-review.

## Ledger

Keep one ledger file per plan, in the session scratchpad or, when the run may continue in another session, in a git-ignored folder in the repository. Its first line names the plan. Append each line in the same tool call as the commit or decision it records:

```text
# ledger: plan docs/plans/2026-11-12-auth.md
Task 3: complete (codex exec, commits a1b2c3d..e4f5a6b, tests: pnpm vitest run src/auth -> 42/42)
Task 4: fix round 2/5 (1 addressed, 1 open: token not rotated)
Task 4: Ruling: kept the sync API | why: spec section 2 requires it | cost if wrong: one adapter later
Task 4: minor (deferred): duplicate date helper in report.ts
```

After compaction, trust the ledger and `git log` over memory, and re-dispatch no task that already has commits.

## Fix rounds

- Run at most 5 rounds per task, each a fix plus a re-review scoped to the fix diff.
- Rounds 1 to 3 resume the same implementer (`SendMessage`, or the CLI's resume command), which keeps its context. Rounds 4 and 5 go to a fresh implementer on a stronger model, with the report file as its memory.
- At the cap, rule on each open finding and record the ruling in the ledger. Minor findings go to the ledger, not into the loop.
- Final whole-branch review findings go to one fixer with the complete list, then to one scoped re-review, with no second fix wave.

## Closing

End with every ledger ruling and its cost if wrong, plus the deferred minors, because that list is the only place the user sees the decisions made for them.
