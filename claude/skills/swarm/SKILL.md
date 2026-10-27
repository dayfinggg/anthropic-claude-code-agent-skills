---
name: swarm
description: "Fan out N parallel workers over independent slices or racing attempts and return one consolidated report. Use when a check, verification or exploration must cover many independent slices at once, such as every package, endpoint, file or browser, or when racing several attempts beats one."
---

# Swarm

## Start

Open the session's task list with one short step per phase, in the user's language, before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
3. Pick the worker `model` and `effort` from the `swarm workers` row of the Models table in the **poteto-mode** skill. For `inherit`, omit `model` so the workers run on the session's model. If the Agent tool rejects a value, use the nearest value it accepts and say so. For a model race, name each arm's model up front. Pick each subagent's effort for the job, per the Subagents section of the **poteto-mode** skill.
4. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, order). The worker records both in its result.

## Phase B: Fan out

Spawn all N workers with the Agent tool in one message with `subagent_type: "general-purpose"`, `run_in_background: true`, and the step 3 model and effort, `model` left unset for `inherit`. Give a worker that writes files or checks out code `isolation: "worktree"`, and name in its brief the branch or commit it checks out first. A worker that only reads gets `subagent_type: "Explore"` and "do not edit files" in its brief.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Read the terminal results. Drop a result that does not record the SHAs and method its brief names, and respawn that worker once. After a second miss, record a gap. A gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

## Phase D: Report

Return one consolidated answer by the session's output style, with the overall verdict first. A table of results by worker or slice fits here, because it compares items across attributes. After it, describe each proven issue in a sentence, then the gaps or dropouts, and the race rule when one was used, in prose.
