---
name: autonomous-run
description: Carrying a long task to its end while nobody is there to answer. Use when work is handed over with words like "work until it's done", "no questions" or "I'll check later", for a scheduled, looped (/loop) or headless (claude -p) run, and when such a run resumes after compaction. Not for a task the user follows and answers in the chat, however long it is and however many servers, sites or repositories it touches.
---

# Autonomous run

The user is not watching and cannot answer during the task, so a question or a closing list of next steps stops the work until they come back. This skill covers what to decide alone, what to keep on disk so the run survives compaction, and when stopping is right.

## Check first

- Write the finish line as a check you can run, such as "the stand check passes on all 22 hosts" or "the 45 journal entries no longer recur". Work until it holds, and do not loosen it to finish.
- Note each action that the task text, `CLAUDE.md`, `AGENTS.md` and the project's deploy and safety docs reserve for the user. Words such as "do everything, no questions" approve the steps the request covers and nothing beyond them.
- List what the run can touch that other people use, such as shared or production databases (also through a pre-production host that shares them), live sites and servers, queues, caches, and other people's branches and working copies.
- When the run continues earlier work, check the claims of its summary or report against `git log`, `git status`, the diff and the live state before you build on them.

## Deciding alone

- Decide open points yourself in favor of finishing the request, and log each decision.
- Prepare a hard-to-undo step that the request covers in full, with the exact command or SQL, a restore point and the check that proves it worked, then run it and the check.
- A step that is destructive or outside the request and that nothing in the task approved, or one that something closed to you on purpose, stays prepared and becomes the open item of the report, with what it needs.
- Where the user allowed questions and a question tool exists, put all the context into the question, because nobody reads the chat until they open the run, and keep working on what the answer does not block.
- When three rounds of fixes fail on one item, record it as an open item with the failing output, what the rounds changed and the approach you would try next, and carry on with the other items.

## Staying on course

- Work in units that each end in a check, so a failure points to one change. Revert a change that did not move the check, including guards, retries and fallbacks added because they might help.
- Keep a progress file in the scratchpad, or in a git-ignored file when the run spans sessions, with the task's parts as a counted checklist, the current state and the next step. Update it after each finished unit.
- Keep a decision log beside it, one line per decision with the time, what, why, the evidence (a commit, a command with its exit code, `file:line`) and the result. Append only, and record a wrong call as a new line that supersedes the old one.
- After each unit that passed its check, leave a restore point, which is a commit on your own branch when the rules allow commits and otherwise a patch or a copy of the changed files in the scratchpad.

## Ending the run

- Stay in the run until the finish line holds or only an open item of the kinds above remains, because nobody restarts a run that stopped. A slow job means waiting for its completion notice, and a plateau means changing the approach.
- Before you end the turn, read the progress file and continue with any open item that nothing blocks.
- The final message holds the finish line and its state, the check that proves it, the decisions you made for the user, the open item with what it needs if there is one, and the path of the decision log, which stays after the run.

## Gotchas

- After compaction the summary reads like the current state, but the progress file, the decision log and `git log` are the record. Read them before the next step.
- A run that stops quietly at item 11 of 15 can end with a message that sounds complete. Only the counted checklist shows the gap, so check it before the final message.

Related skills: concise:orchestration for running parts of the task through other agents, concise:planning for splitting a task that is too large to start, concise:debugging for a failure the error alone does not explain.
