# Design decisions

## Keep knowledge authoritative

Give a business rule that appears in several production paths one authoritative owner and derive the other representations from it, because copies of the same rule drift apart when one of them changes. Check that changing the rule takes one intentional edit. DRY concerns knowledge, not matching text.

<example>
The VAT rate lives in one `TaxPolicy`, and both the invoice template and the API read it instead of each hardcoding `0.2`.
</example>

Keep similar code separate when it represents policies that change independently, and do not merge test expectations into the production calculation to remove repetition, because merging couples changes that should stay apart and makes the test check the code against itself.

<example>
Shipping cost for retail and for wholesale stays in two functions, even though both multiply weight by a rate today.
</example>

Reconsider a shared helper that has grown caller-specific flags and exclusive branches, and inline the relevant behavior back into its callers once the shared policy is gone, because a wrong abstraction costs more than the duplication it removed. Check that each caller keeps its behavior afterwards.

<example>
`format_date(d, for_email=False, for_pdf=False, legacy=False)` with three exclusive branches is split back into the callers that use each branch.
</example>

## Balance KISS and YAGNI

Choose between direct code and a general mechanism by comparing branches, dependencies, and facts callers must remember, and pick the lower total burden even when it has more lines, because terseness and abstraction counts do not measure simplicity.

<example>
Three explicit branches for three file types beat a handler registry that every reader must trace to find out which code runs.
</example>

Add an extension point only for a present consumer or for complexity it removes now, because unused flexibility is carried and tested by every later change. Restructuring that makes the current change safer is not speculation.

<example>
No `ExporterFactory` for a single CSV export, while extracting the existing export logic so it can be tested before the change is fine.
</example>

Consider a slightly more general operation when it replaces several specialized ones, even with a single implementation, because one well-shaped interface can be simpler than many narrow ones. Check that it serves today's callers directly and adds no speculative options.

<example>
`insert(text, position)` replaces `insert_at_start`, `insert_at_end`, and `insert_before_cursor` in a text buffer.
</example>

## Use SOLID where its pressure exists

Separate policies that change for different reasons when they currently interfere, and keep together operations that enforce the same invariant, because the goal is that changing one concern leaves the other untouched. One responsibility does not mean one method.

<example>
Changing a report's HTML layout should not require editing the function that computes the totals it displays.
</example>

Isolate a variation only when it already forces scattered edits, and keep a closed, readable branch when its cases are fixed, because a plugin system for three stable cases adds indirection without saving any edit.

<example>
A `match` over four fixed payment states stays, while a fifth payment provider that needs edits in six files earns a provider interface.
</example>

Make every implementation of a contract accept the same inputs and keep the same results, invariants, side effects, and error meanings, and use a separate capability when an implementation cannot, because callers rely on the contract and not on the concrete class.

<example>
A read-only storage backend does not implement `save()` by throwing, and the code offers a separate `ReadableStorage` interface instead.
</example>

Narrow an interface when a consumer depends on operations it never uses, and keep a cohesive interface whole when splitting only adds navigation, because unused operations still force rebuilds, mocks, and coupling.

<example>
A report job that only reads invoices depends on `InvoiceReader`, not on the full `InvoiceRepository` with update and delete.
</example>

Pass in a capability when business policy would otherwise construct volatile infrastructure such as a mail server or HTTP client, and call stable libraries directly, because the policy can then run in a test without the real service, while a wrapper around a stable call hides nothing.

<example>
`send_reminders(users, mailer)` receives the mailer, while `json.loads` is called directly without a wrapper.
</example>

## Choose objects and composition deliberately

Use a class when it protects relationships between pieces of state or a resource lifecycle across calls, and use functions and plain values otherwise, because a class that enforces nothing only adds ceremony.

<example>
A `DatabaseConnection` class that opens and closes the connection earns its place, while a stateless `PriceCalculator` is a function.
</example>

Prefer composition or delegation over inheritance used only to share code, and keep inheritance that a framework requires or that forms a real substitutable hierarchy, because implementation inheritance couples every subclass to the parent's internals.

<example>
A `CachedFetcher` wraps a `Fetcher` instead of subclassing it, while a Django view still subclasses `View` because the framework requires it.
</example>
