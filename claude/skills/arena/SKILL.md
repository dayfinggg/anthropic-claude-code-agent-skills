---
name: arena
description: "Run several parallel attempts at the same task, pick the strongest as a base and graft the best parts of the others into it. Use when a non-trivial design, implementation or text has several plausible shapes and one attempt would likely lock in the wrong one, such as an error handling strategy, an abstraction layer or a public API."
---

# Arena

Open the session's task list with one short step per phase (Frame, Fan out, Cross-judge, Pick, Graft, Verify), in the user's language, before launching anything.

## Phase A: Frame

Every candidate gets the same prompt, so the prompt is the contract.

1. State the artifact each candidate is producing.
2. Derive the rubric, 3-6 concrete gradeable criteria for what success looks like on *this* task. It is the picker's tool in Phase D. Candidates only see the task.
3. Pick the runners from the `arena runners` row of the Models table in the **poteto-mode** skill, one runner per entry, each with that entry's `model` and `effort`. An `inherit` entry means omitting `model` so that seat runs on the session's model. If the Agent tool rejects an entry, use the nearest value it accepts and say so. Spawn more runners when the arena covers multiple design directions. Use the same model N times when the work is generation-bound rather than judgment-sensitive. Pick each subagent's effort for the job, per the Subagents section of the **poteto-mode** skill.
4. Give each candidate its own output location (`isolation: "worktree"` where possible, otherwise `arena-<slug>/candidate-<n>/` in the session's scratchpad), per the **separate-before-serializing-shared-state** principle skill.

## Phase B: Fan out

Spawn all N subagents with the Agent tool in one message with `subagent_type: "general-purpose"` and `run_in_background: true`, each with the task, the path to the shared grounding, its own output path, and instructions to produce the artifact and a short rationale naming the alternatives it considered and what it rejected.

If a candidate produces no output, proceed with N-1 and note the dropout.

## Phase C: Cross-judge

After all Phase B candidates complete, choose one entry from the `arena cross-judge pool` row of the Models table in the **poteto-mode** skill. Prefer an entry whose model differs from the session's model when the pool allows. Spawn one judge subagent on that entry with `subagent_type: "Explore"` and "do not edit files" in its brief. It sees the rubric and the candidates by path label, scores each criterion, and recommends a base with rationale. It runs in parallel with your reading in Phase D. Don't spawn it while candidates are still writing.

## Phase D: Pick a base

Read every candidate end to end before picking. Score each against the rubric criterion by criterion, not on holistic feel, and compare with the cross-judge. Agreement on the base confirms the pick. Disagreement means one of you is biased or the rubric was ambiguous. Read both rationales before deciding.

Pick the base a future maintainer can extend most easily without breaking invariants. When two feel tied, prefer the cleaner boundary or smaller API.

## Phase E: Graft

Walk each losing candidate once more for what is worth porting into the base, usually one or two things per candidate, not most of it. Fold each graft in by hand, so the result stays coherent under one mental model. Don't paste mechanically.

If the candidates converge on one shape, that is strong agreement. Note it and ship the consensus shape. No graft is needed. If they wildly diverge, Phase A was under-specified. Reframe and re-run rather than averaging the divergence.

## Phase F: Verify

Verify the synthesized artifact like any other output. If verification finds a problem the arena missed, either Phase A was wrong (re-frame and re-run) or a candidate caught it and you missed the graft (go back to Phase E). Don't paper over it.

## Outputs

One synthesized artifact. The answer to the user follows the session's output style and opens with the result. Its synthesis note, in prose, names the base and why, the cross-judge's verdict, each graft with its source candidate, what was rejected and why, any convergence or dropouts, and the verification result.
