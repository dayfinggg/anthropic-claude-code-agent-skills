---
name: architecture
description: Decides structure across components, including project layout, module boundaries, dependency direction, architectural style, and evolution of published contracts. Use for structural choices, not for sequencing work or edits inside one implementation.
---

# Architecture

These rules decide how components relate, where responsibilities live, and how published contracts change. The references hold the checks for each branch.

Before choosing structure, inspect project guidance, representative execution paths, imports, data ownership, entry points, consumers, and existing checks, and keep compatible naming and layout conventions while challenging demonstrated coupling, unsafe assumptions, and unnecessary indirection, because a convention explains why code looks as it does but does not show that it is sound. Check the alleged problem in actual callers or change history before proposing a change.

<example>
Before proposing to split `utils/`, run `git log --stat -- utils/` and grep the imports of it, which shows whether the coupling is real or the folder only looks untidy.
</example>

When a structural choice matters, compare keeping the current design with the feasible alternatives, and name the requirement, the affected consumers, the principal cost, and the evidence that could overturn the recommendation, using measurements, representative change scenarios, or estimates labeled as such, because an invented score looks like evidence and hides the data that is missing.

<example>
For a request to move notifications out of the monolith, option one is the current design, the requirement is independent release of the mail code, and a replay of one week of real sends is the evidence that could overturn the split.
</example>

Choose styles and constraints such as layers, mandatory interfaces, services, or a directory tree only when each one earns a benefit in the current situation, because a constraint adopted for its label taxes every later change without a matching gain. Check that each constraint names the benefit it provides today.

<example>
A single-process internal tool with three tables stays one package of plain modules, with no ports-and-adapters layers and no separate services.
</example>

For implemented changes, run the boundary and consumer checks that apply, and for advice, describe the check without saying it ran, because the reader acts on whatever result is reported.

<example>
After moving `render_v1`, run the build and the importers' tests and report the output, while a design answer says "run the importers' tests after the move".
</example>

Answer a structural question in the reply, and create decision records, diagrams, or new documents only on request, because an unrequested file is one more thing the user must review and keep current.

<example>
Asked where a shared pagination fix belongs, reply with the recommendation and the check to run, not a new `docs/adr/0012-pagination.md`.
</example>

## References

Choose the references that apply before the dependent decision and read each one, because each holds the checks for its branch. Leave the others unread so unrelated guidance stays out of context, and revisit the choice when the question changes.

- For component boundaries, cohesion, coupling, cycles, or responsibility ownership, read [Boundaries](references/boundaries.md).
- For a new project, directory reorganization, package granularity, or component names, read [Project structure](references/structure.md).
- For dependency direction, composition roots, dependency selection, or extension points, read [Dependencies and composition](references/dependencies.md).
- For architectural styles, modular monoliths, deployment boundaries, or quality tradeoffs, read [Styles and deployment](references/styles.md).
- For published contracts, compatibility, replacement, or migration completion, read [Evolution](references/evolution.md).

<example>
Extracting a mailer into its own service calls for Styles and deployment and for Boundaries, because it shares a transaction with orders, but not for Project structure.
</example>
