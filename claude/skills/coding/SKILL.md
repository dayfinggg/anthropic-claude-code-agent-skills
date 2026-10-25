---
name: coding
description: Writes and changes code in any language, from one-line fixes to new modules, scripts, and code shown in answers. Use whenever a task produces or edits code. Not for prose-only edits or conceptual questions without code.
---

# Coding

These rules decide how code is shaped and checked in any language. The references hold the detailed checks for each branch.

Before choosing a structure, settle the accepted inputs, who owns the data, what success and failure return, and what happens on empty input, because these decide the signature and the error channel before any helper exists.

<example>
For `parse_price(text)`, decide first that `""` returns `None`, `"12,50"` returns `Decimal("12.50")`, and `"abc"` raises `ValueError`, and only then write the function.
</example>

Give each business rule one owner, and add a helper or shared abstraction only when it removes an obligation callers have today, because a speculative layer is one more thing every reader must trace and keep in sync.

<example>
Two report functions that round VAT the same way share one `round_vat()`, while a discount rule used by a single checkout path stays inline.
</example>

Keep calculation apart from file, network, and database effects where that lets the logic run in a test without the outside system, because pure logic can be checked with plain values.

<example>
`compute_invoice(lines)` returns the totals, and only `send_invoice()` talks to the mail server.
</example>

Treat language semantics and the project's enforced standards as requirements, and treat principles such as SOLID or DRY as tools for a pressure that exists now, because a principle applied without that pressure adds classes and layers nobody needs. When several designs comply, choose the one with fewer caller obligations and less shared mutable state.

<example>
A 40-line script that reads one CSV file stays a few functions, with no repository class or interface.
</example>

## References

Choose the references that apply before the first edit and read each one, because each holds the checks for its branch and the language section does not replace them. Leave the others unread so unrelated guidance stays out of context, and revisit the choice when the work changes.

- For every change, including scripts and code in answers, read [functions and contracts](references/functions-and-contracts.md) and the target language's section of [language idioms](references/languages.md).
- Before introducing or changing a class, record, generic helper, or shared abstraction, read [design decisions](references/design.md).
- Before code with mutable collections, file or stream I/O, exception handling, cancellation, or concurrency, read [state and failures](references/state-and-failures.md).
- Before restructuring existing behavior, read [local refactoring](references/refactoring.md).

<example>
A Python script that retries a failed download calls for functions and contracts, the Python section, and state and failures, but not design decisions.
</example>
