---
name: autonomous-run
description: Carrying a long task to its end while nobody is there to answer. Use when work is handed over with words like "work until it's done", "no questions" or "I'll check later", for a scheduled, looped or headless run, and when such a run resumes after compaction. Not for a task the user follows and answers in the chat, however long it is and however many servers, sites or repositories it touches.
---

# Autonomous run

The user is not watching and cannot answer during the task. A question such as "Shall I continue?" stops the work until they come back, and a turn that ends with a summary of what comes next leaves that next step undone. This skill covers what to decide alone, what to keep on disk so the run survives compaction, and when stopping is right.

## Before the first change

- Write the finish line as a check you can run, such as "the stand check passes on all 22 hosts" or "the 45 journal entries no longer recur". Work until it holds, and do not loosen it to finish.
- Collect the written rules that bind the run: the task text, `CLAUDE.md`, `AGENTS.md` and the project's deploy and safety docs. Note each action they reserve for the user, and whether the user's message lifts that. "Do everything, no questions" approves the steps the request covers.
- List what the run can touch that other people use: shared or production databases (also through a pre-production host that shares them), live sites and servers, queues, caches, other people's branches and working copies.
- When the run continues earlier work, check its claims against `git log`, `git status`, the diff and the live state before building on them. A summary or a report from another session is a claim, not proof.

## Deciding alone

- Decide the open points yourself in favor of finishing the request, and write each decision down. Reversible work needs no question: edits in your branch or scratch copy, local builds and tests, reads, and temporary files you remove later.
- A step that is hard to undo and that the request covers gets prepared in full first: the exact command or SQL, a restore point for the current state, and the check that proves it worked. Then run it and run the check.
- Wait for the user in two cases only. The step is destructive or lies outside the request, and nothing in the task approved it. Or something is deliberately closed to you, such as a credential that was withheld or a file marked not to be touched. In both cases finish everything else, leave the step prepared, and report it as the open item with what it needs.
- When the user allowed questions and a question tool exists, put all the context into the question, because nobody reads the chat until they open the run, and keep working on everything the answer does not block.

## Staying on course

- Work in units that each end in a check: one change, its check, then the next change. A failure then points to one change.
- Keep only changes the evidence supports. Revert a change that did not move the check, including guards, retries and fallbacks added because they might help.
- Keep a progress file in the scratchpad, or in a git-ignored file when the run spans sessions: the task's parts as a counted checklist, the current state and the next step. Update it after each finished unit.
- Keep a decision log beside it, one line per decision: time, what, why, evidence (a commit, a command with its exit code, `file:line`) and result. Append only, and record a wrong call as a new line that supersedes the old one.
- Leave a restore point after each unit that passed its check: a commit on your own branch when the rules allow commits, otherwise a patch or a copy of the changed files in the scratchpad.
- Send bulk material such as large logs, data dumps and wide searches to a subagent and take back the lines that matter with their location. Read the rules and the code you change yourself.

## Ending the run

- Stay in the run until the finish line holds or only a real blocker remains. A slow job is a reason to wait for its completion notice, and a plateau is a reason to change the approach. Neither is a reason to end the turn, because nobody restarts a run that stopped.
- A status note goes in the same message as the next tool call. A message without a tool call ends the turn.
- Before you end the turn, read the progress file. If items are open and nothing blocks them, continue with them.
- The final message holds the finish line and its state, the check that proves it, the decisions you made for the user, the open item if there is one with what it needs, and the path of the decision log. Keep the log file after the run ends.

## Gotchas

- An approval covers the action it names. A "yes" for a deploy does not cover a database change or the next deploy.
- After compaction the progress file, the decision log and `git log` are the record. Read them before the next step.
- A check that passed before your last edit does not cover that edit.
- Two fixes that fail the same check usually share a wrong premise. Test the premise before a third fix.
- A run that stops quietly at item 11 of 15 announces no next step. The counted checklist is what shows it.

Related skills: concise:orchestration for running parts of the task through other agents, concise:planning for splitting a task that is too large to start, concise:debugging for a failure the error alone does not explain.
