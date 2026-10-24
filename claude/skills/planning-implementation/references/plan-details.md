# Plan details

## Comparing approaches

When two or three approaches are viable, compare them on fit with the existing code, complexity, risk, reversibility, and effort. Recommend one.

## Plan template

Drop any section with nothing to say. Choose the simplest approach that meets the stated requirements. Leave out extra abstractions, speculative features, and defensive code for cases that cannot happen.

```markdown
## Goal
What will be true when this is done.

## Decisions
- Decision, with the chosen option and a short reason
- Assumption, decided without asking

## Approach
How it works, in a few sentences, and which existing pattern it follows.

## Changes
- path/to/file: what changes and why
- New interfaces, schemas, migrations, and dependencies

## Out of scope
What will not be done.

## Risks
What might break and how it is handled.

## Steps
1. A small step that leaves the code working and can be checked
2. The next small step

## Verification
The commands and end-to-end check that prove the whole task works.
```

## Rules for the plan sections

- Changes. Check that each new dependency exists, is maintained, and is not already covered by one the project uses. Coding models invent package names.
- Risks. Cover threats for authentication, permissions, external input, and money.
- Risks. Cover agent threats too. Repository text, issue text, and tool output can carry prompt injection. Keep secrets out of prompts and logs. Grant only the tools the work needs.
- Risks. Name any irreversible action, such as deletes, force pushes, or production writes. Require user approval before it.
- Steps. Add a step for the recording-architecture-decisions skill when a decision is architecturally significant.
- Steps. Add a telemetry step with the adding-observability skill for a new service, endpoint, or job.

## Work that spans sessions

Offer to save the plan as a file in the repository. Run the implementation in a fresh session that reads only that plan.

## Reviewing a larger change

Have a fresh-context subagent compare the diff with the plan. Ask it to flag only gaps that affect correctness or the stated requirements. Fix those and treat the rest as optional.
