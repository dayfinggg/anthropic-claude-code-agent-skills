# Delivery planning

## Contents

- Choose increments that prove something
- Order the work by real prerequisites
- Make increment exits observable
- Keep the actual plan tool current
- Replan without expanding the assignment

## Choose increments that prove something

For user-facing work, choose the smallest coherent behavior that reaches through the necessary layers and can be exercised, and prefer an early increment that proves the core uncertain interaction with only the supporting work needed to reach it, because a finished horizontal layer proves nothing until the other layers exist. Check that someone can exercise the increment from the entry point to the visible result.

<example>
For a notification feature, the first increment sends one email from a button click through `POST /notify` to the mail relay, and the full set of notification tables waits.
</example>

For infrastructure or library work, use the consumer-visible result as the increment, tie a preparatory step that shows no value alone to the outcome it enables, and keep setup, tests, and necessary documentation with the increment that needs them, because a separate setup increment cannot be checked on its own. Split only when the resulting outcomes have meaningful separate checks.

<example>
A new retry helper ships together with its first caller in `sync_orders()` and its unit tests, not as a standalone "add helper" increment.
</example>

When an increment is too large to judge as done, separate independently finishable behaviors, and keep coupled changes together when separating them would leave an invalid intermediate state, because generic increments such as frontend, backend, or cleanup hide which behavior works and a half-applied coupled change breaks the system between increments.

<example>
"Backend" becomes "create a webhook subscription" and "retry failed deliveries", while renaming a column and updating the one query that reads it stay in a single increment.
</example>

## Order the work by real prerequisites

For each increment, name the result it produces, the affected areas, its prerequisites, and its completion check, deriving paths and commands from the inspected project and leaving implementation bodies and invented interfaces out of the plan, because a template filled with guessed names fails the first time the plan meets the code.

<example>
Increment 2 lists `src/billing/invoice.py` and `pytest tests/billing -k proration`, both confirmed by search, and does not sketch the proration function.
</example>

Distinguish a required predecessor from a preferred order, connect each dependency to the concrete result the next step consumes, and include external approvals, fixtures, service availability, and deployment capabilities only where the work needs them, because an invented dependency serializes work that could proceed and a missing one stalls the plan later.

<example>
Increment 3 requires the `invoices.tax_code` column that increment 2 creates, while the order of the two email templates is only a preference.
</example>

If dependencies form a cycle, identify the shared change that makes an intermediate state invalid and group it into one checkable increment or plan a compatible transition, and plan concurrent work only when its outputs and shared state allow it, because work labeled independent that edits the same state collides when it runs together.

<example>
The API handler and the client both need the new `status` enum, so they land in one increment, or the handler first accepts both the old and the new values.
</example>

For changes across many consumers or repositories, check whether each proposed batch can pass its own checks, because a final all-at-once patch rarely repairs batches that were already broken when they landed.

<example>
Updating forty callers of `fetch_user()` in four batches is accepted only if the build and tests pass after each batch while both signatures are supported.
</example>

## Make increment exits observable

Describe each increment by the state that will be true when it ends, including acceptance coverage, integration evidence, and any prerequisite it establishes for later work, because a list of edited files or completed substeps does not show that anything works.

<example>
"Orders can be exported by date range, `test_export_range` passes, and the endpoint is reachable from the staging UI" replaces "edited `export.py` and `urls.py`".
</example>

Keep upcoming actions concrete and distant work at outcome level while its dependencies remain uncertain, and when an estimate is requested, separate observed comparable work from new investigation and state the assumptions and unresolved dependencies behind it, because invented precision gets treated as a commitment.

<example>
"Two to four days, based on the last two export endpoints, with the legacy auth check as an unknown that could add more" is given instead of "14.5 hours".
</example>

## Keep the actual plan tool current

When the session provides a plan or task tool and tracking is useful, reuse the existing plan instead of creating parallel records, and use the tool's own schema, because two lists drift apart and the user ends up reading the wrong one.

<example>
If the session already shows a plan containing "Add export endpoint", update that entry and do not open a second checklist in `PLAN.md`.
</example>

Leave a skipped or superseded increment unmarked as done, because a completed label is read as verified and clearing the list this way hides real gaps.

<example>
When an index replaces the planned "Add cache layer" increment, that entry is removed from the plan or stays open with "superseded by the index" attached, and is not marked complete.
</example>

For a plan-only request, treat the planning deliverable as the completed work and leave the proposed implementation unmarked as performed, and when no tracking tool is available, keep the sequence in context and skip the plan file, because an unrequested file in the repository is a change the user must review and remove.

<example>
After "plan the Postgres move" the final answer holds the sequence, every implementation increment is still pending, and no `plan.md` appears in the repository.
</example>

## Replan without expanding the assignment

When a check or discovery invalidates the sequence, name the changed fact and the outcomes it affects, classify new work as necessary for existing acceptance, an optional improvement, or a new requirement, update only the necessary steps, and surface a scope-changing decision before adding the other work, because silent additions turn a bounded assignment into a larger one the user never agreed to.

<example>
Discovering that `report_totals` reads a cached view adds the cache refresh as necessary work, while rewriting the view's SQL for speed is raised to the user as a separate choice.
</example>

Preserve valid completion evidence, reopen only the increments whose result the new fact invalidates, and recheck the affected dependencies and acceptance coverage before continuing with the next ready increment, because redoing untouched increments wastes work and trusting stale ones hides a regression.

<example>
A changed column type reopens the migration and backfill increments, while the finished "CSV header" increment keeps its passing test.
</example>

Before finishing, reconcile the actual results with the plan tool and the required outcomes, leave no required work unfinished behind completed labels, and stop when the requested outcomes and their checks pass instead of when adjacent improvements run out, because the final state is what the user relies on and extra work widens the review.

<example>
At the end "Partner webhook" is still shown as blocked in the plan and in the report, and the unrelated `legacy_export.py` cleanup was never started.
</example>
