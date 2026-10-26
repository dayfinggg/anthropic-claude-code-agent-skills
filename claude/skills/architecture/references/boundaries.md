# Boundaries

## Concepts before containers

When choosing a component boundary, group the concepts whose rules need to be understood together, state what the component owns and what outsiders may ask it to do, and test the cut against a real use case, because a boundary whose behavior still needs neighboring implementations to explain it only puts a facade over the same coupling. Check that one use case can be explained from the component's own contract.

<example>
An `invoicing` component owns tax lines and rounding and exposes `issue_invoice(order_id)`. If explaining a rounding rule still means reading `catalog/pricing.py`, move the rule or merge the pieces instead of adding an `InvoicingFacade`.
</example>

When the same term means different things in different workflows, keep the meanings distinct and translate at their contact point instead of forcing a universal model, because a shared identifier does not imply shared behavior or ownership, and one merged model makes every workflow carry the rules of the others. Check that a concrete example from each workflow survives the translation without losing meaning.

<example>
`Customer` in billing carries tax identity and payment terms, while `Customer` in support carries tickets and contact channels, so a mapping on `customer_id` joins them and no shared class holds both.
</example>

## Cohesion and change locality

When routine changes cross many components, inspect representative changes and their reasons, separate semantic co-change from renames, formatting, generated files, and bulk upgrades, and move responsibilities together when one business task repeatedly needs coordinated edits, because the real cost of a boundary is the unrelated context each change has to load. Check the proposed structure against that task and against an independent neighboring change, since both should need less unrelated context and not merely fewer imports.

<example>
If 14 of the last 20 commits touching `shipping/` also edit `tax/zones.py` for the same rule, move the zone rules into `shipping`, and confirm that adding a carrier now touches one directory.
</example>

When code is grouped only because it touches the same table or object, check whether its operations serve unrelated workflows, keep one authoritative data owner without requiring every operation to live inside it, and walk through the workflows separately, because a component named after a table grows into a dumping ground for every feature that reads the table. Check that internal data access stays controlled while task-specific changes stay local.

<example>
A `users` module that holds login, billing address edits, and marketing preferences is split by workflow, while every write to the `users` table still goes through the interface of the `accounts` owner.
</example>

## Consistency and ownership

When a proposed split crosses a business invariant, identify what must become true atomically and what may lag, and keep the required consistency boundary or obtain a changed requirement before splitting, because a split that turns an atomic rule into an eventually consistent one produces oversold stock, double charges, or orphaned records under concurrency. Take transaction boundaries from the stated rule and not from object navigation, UI screens, or entity relationships. Check concurrent and partial-completion scenarios against the invariant.

<example>
Splitting `inventory` from `checkout` is acceptable only if stock reservation stays atomic, for example through one conditional update, and a test that sends two concurrent requests for the last unit of `sku-1042` exposes a double sale when it does not.
</example>

When assigning ownership, distinguish conceptual modules, transactional aggregates, packages, and deployment units, identify the owner of the rule, its mutable state, and its supported interface, and avoid creating services or teams only to make these boundaries identical, because they answer different questions and forcing them to match adds operating cost without clarifying who is responsible. Check that an actual change has a clear maintainer and a clear compatibility owner.

<example>
`orders` and `inventory` stay two modules in one package and one database, `inventory` owns the stock aggregate, and no third service is created just so that module, aggregate, and deployment unit line up.
</example>

## Dependency cycles and shared code

When a cycle or dense graph prevents independent reasoning, trace the actual responsibilities along its edges, then move a misplaced operation, group inseparable concepts, or reverse a dependency through a meaningful callback or contract, because adding public interfaces without simplifying the graph keeps the original problem behind extra indirection. Check both the import graph and the runtime collaboration afterward.

<example>
`orders` imports `customers` to read the loyalty tier, and `customers` imports `orders` to compute it. Moving `loyalty_tier()` into `orders`, which owns the totals, leaves one dependency direction, where a new `ICustomerService` would leave the cycle in place.
</example>

When extracting a shared component, confirm that the consumers share the same rule and not just similar code, check who may change it and which consumers must coordinate, and keep the cases separate or undo the extraction when callers need unrelated mode flags or policies, because a wrong shared abstraction couples consumers that change for different reasons. Check that an independent change in one consumer no longer forces irrelevant changes in the others.

<example>
`export_rows(rows, for_billing=True, strip_pii=False, legacy_dates=False)` serves two teams with different rules, so each team gets its own exporter and only the CSV writer stays shared.
</example>
