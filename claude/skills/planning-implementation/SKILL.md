---
name: planning-implementation
description: Plans a multi-file coding task, settles open decisions with the user, then implements and verifies it. Use to plan, design an approach, or implement a feature, refactor, or migration.
disable-model-invocation: true
argument-hint: "[task description]"
---

# Planning before implementation

The user's task follows this line. If it is empty, ask for the task first.

$ARGUMENTS

Read references/plan-details.md before writing the plan or reviewing a large diff.

## Size the work

If the diff fits in one sentence and touches one or two files, say no plan is needed and implement.

Plan when the work spans several files, the approach is unclear, the code is unfamiliar, or the change is costly to undo.

## Explore

Read the code before deciding anything. Use a subagent for broad searches. Name the patterns and files to copy.

## Decisions

- **Settled** by the code, the conventions, or the request. Follow that answer.
- **Routine** when a careful engineer would just decide it. Decide it and record it as an assumption.
- **Material** when the answers lead to different work, the choice is hard to reverse, or only the user knows the rule. Ask about these.

Security, data, public interfaces, and a new language or framework are always material.

## Questions

Ask with AskUserQuestion. Use up to four questions per call and two to four options each.

- Put the recommended option first and label it Recommended.
- Say what each option costs or risks.
- Hold a question that depends on another answer for the next round.
- Stop when the remaining points would not change the plan.
- If the user says to decide yourself, take the recommended answers as assumptions.

## Approval

Do not edit any file until the user approves the plan. Use plan mode when it is available. A session with bypass permissions does not enforce plan mode, so this rule is the only gate.

## Implementation

- For a bug or a behavior change, write the failing test first and confirm it fails. Then fix the cause.
- Run the relevant checks after each step, not only at the end.
- When the code contradicts the plan or a new material decision appears, pause, explain what changed, and ask.
- Make routine adjustments yourself and list them at the end.
- After two failed corrections on the same issue, stop. Re-plan with what you learned.

## Finish

Report done only when the verification passes. Show the command output as evidence.
