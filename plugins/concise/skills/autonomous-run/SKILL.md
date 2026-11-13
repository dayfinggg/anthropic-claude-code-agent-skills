---
name: autonomous-run
description: Carrying a long task from start to finish without the user watching, such as work handed off with "do it all", "work until it's done", "I'll check later" or "don't wait for me", a scheduled, looped or headless run, one job across several servers, sites or repositories, or picking up the unfinished work of another session, agent, branch or pull request. Use when the run must decide alone which actions it takes and which wait for the user, when it needs a record the user can check afterwards, when it is tempted to end the turn while work or a job is still open, and when a run started this way resumes after compaction. A short task the user follows in the chat does not need it.
---

## Check first

- Collect the written rules for this run: the task text, `CLAUDE.md`, `AGENTS.md` and the project's safety, deploy or environment docs. Note each action they reserve for the user, with the file that says so.
- List what the run can touch that other people use: shared or production databases (also through a pre-production host that shares them), live sites and servers, queues, caches, other people's branches and working copies.
- When the run continues earlier work, check its claims against `git log`, `git status`, the diff and the live state before building on them. A summary or a report from another session is a claim, not proof.

## Defaults

- Before the first change, write the exit condition as a check you can run, such as "the stand check passes on all 22 hosts" or "the 45 journal entries no longer recur". Work until it holds, and do not loosen it to finish.
- Decide reversible work yourself and log the decision: edits in your branch or scratch copy, local builds and tests, reads, and temporary files you remove later. A question about these stops the run for nothing.
- Pause before each action the rules for shared systems and irreversible actions reserve for the user, and before each one the written rules reserve. Prepare it fully first: the exact command or SQL, the snapshot that restores the current state, and the check that proves it worked. A request to fix or finish the task does not cover these actions.
- Ask with AskUserQuestion and put all the context in the question, because a question in an ordinary message stays unseen until someone opens the run. Keep working on everything the answer does not block. When no question tool exists, as in a headless or scheduled run, leave the action undone, finish the rest, and open the final report with the question.
- Work in units that each end in a check: one change, then its check, then the next change. A failure then points to one change.
- Keep only changes the evidence supports. Revert a change that did not move the check, including guards, retries and fallbacks added because they "might help".
- Keep a decision log in the scratchpad, or in a git-ignored file when the run spans sessions. One line per decision: time, what, why, evidence (a commit, a command with its exit code, `file:line`) and result. Log forks, finished units with their check, reverts, pauses and blockers, not every step. Append only, and record a wrong call as a new line that supersedes it.
- Send bulk material to a subagent: large logs, data dumps and wide searches come back as the lines that matter with their location. Read the rules and the code you change yourself.
- Stay in the run until the exit condition holds or only a real blocker remains. A slow job is a reason to wait on its completion notice, and a plateau is a reason to change the approach. Neither is a reason to end the turn, because nobody restarts a run that stopped.
- The final report gives the exit condition and its state, each check as its command and exit code, what landed, what was reverted, every decision the run made for the user, and each paused action with what it needs.

## Gotchas

- Approval covers the one action it names. A "yes" for a deploy does not cover a database change or the next deploy.
- After compaction the decision log and `git log` are the record. Read the log's last lines before the next step.
- A check that passed before your last edit does not cover that edit.
- Two fixes that fail the same check usually share a wrong premise. Test the premise, as concise:debugging describes, before a third fix.
