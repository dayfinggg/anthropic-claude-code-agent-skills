---
name: planning
description: Plans substantial or unclear development work by investigating the system, defining acceptance criteria, and sequencing verified increments. Use for implementation plans, cross-component changes, and staged migrations. Skip routine local edits.
---

# Planning

These rules turn substantial or unclear development work into a sequence of increments that each end in evidence. The references hold the detailed checks for each branch.

Size the planning to the uncertainty, dependencies, and reversal cost of the work, and let the request's verb set what is permitted. A straightforward edit is made directly, a plan-only request permits read-only investigation and not implementation, and an implementation request needs no extra approval merely because planning is useful, because planning a one-line change costs more than the change, edits under a plan-only request remove the review the user asked for, and a sign-off round on work the user already requested only delays it.

<example>
Fixing a typo in a log message in `client.py` is simply done. "Plan the move to Postgres" ends with read-only investigation and a written plan, and "implement the move to Postgres" starts the first increment without waiting for plan approval.
</example>

When the user supplies a written spec, ticket, or task list, turn each item into its own acceptance check that keeps the item's original wording, and close with a report that accounts for every item by its number or original wording, as done with where it was done or as not done with the reason, because the user verifies the result against the spec item by item and a paraphrase or an "all done" summary sends them back to ask what is missing. Check that every spec item is accounted for exactly once.

<example>
Ticket item "3. Export respects the selected date range" stays a check under that wording and is accounted for as done in `export/query.py`, while "5. Email the file to the requester" is accounted for as not done because the relay credentials are missing.
</example>

1. Establish the intended result and the behavior that must stay unchanged by reading the code, tests, and configuration the request touches, and ask the user only about a product choice the evidence cannot settle, because a question the repository could answer wastes the user's turn and an unchecked assumption becomes the base of every later step.

   <example>
   For "add CSV export to the orders page", find that `orders/views.py` paginates at 50 rows, so the export must read past the page, and record that the HTML table stays unchanged.
   </example>

2. Compare approaches only when the choice changes cost, risk, or scope, and keep work that rests on an unproven assumption conditional, because weighing options that differ in style delays the plan and an increment built on an untested dependency fails late.

   <example>
   The `debounce` that the project's utility library already exports versus a hand-written timer needs no comparison, while "sync through the vendor webhook" stays conditional until the vendor docs or a test-mode call confirm the payload shape.
   </example>

3. Divide the result into increments that each name an outcome, affected areas, prerequisites, and completion evidence, leave optional improvements out of the sequence, and detail near-term actions while keeping later work coarse, because an increment without evidence cannot be marked done and detail written for distant steps is rewritten when early results arrive.

   <example>
   "Add `GET /export` returning the first 100 rows, verified by `pytest tests/test_export.py`" is an increment, and "build the backend" is not.
   </example>

4. Assign a check to every acceptance criterion before implementation, name the recovery condition before each irreversible step, and read the whole sequence for requirement coverage, compatibility, integration, and steps that need the user's go-ahead, because a check written after the code tends to confirm what the code does and a gap found in the plan costs far less than one found mid-migration.

   <example>
   The criterion "archived orders appear in the export" gets `test_archived_rows` before the code exists, and applying `0042_add_index.sql` to production is listed as a step that waits for the user's agreement and names `DROP INDEX` as its recovery, since preparing the file does not authorize running it.
   </example>

5. During implementation, keep the plan or task tool the session provides current, marking an increment in progress before acting and complete only after its checks pass, because a completed label is read as verified and misleads the user and the next increment when it is not.

   <example>
   After `pytest tests/test_export.py` passes, mark "Export endpoint" complete and start "Download button", and leave "Webhook registration" in progress with "partner sandbox key missing" attached.
   </example>

## References

Choose the references that apply before the dependent work starts and read each one, because each holds the checks for its branch and the steps above do not replace them. Leave the others unread so unrelated guidance stays out of context, and revisit the choice when the plan changes.

- When intent, acceptance criteria, or the affected system is unclear, read [discovery](references/discovery.md).
- When feasibility or a consequential assumption is unproven, or several approaches are viable, read [risk and alternatives](references/risk-and-alternatives.md).
- For interacting components, dependent increments, or progress tracking and replanning during implementation, read [delivery planning](references/delivery.md).
- When contracts, stored data, deployment, or live side effects change, read [migration and validation](references/migration-and-validation.md).

<example>
A plan to move sessions from cookies to Redis changes stored data and a live rollout, so read discovery first, then delivery planning and migration and validation before sequencing, and skip risk and alternatives because Redis is already chosen.
</example>
