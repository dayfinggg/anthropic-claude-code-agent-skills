# Functions and contracts

## Make names useful at the call site

When a reader could confuse two concepts at a call site, put the domain meaning, unit, order, or lifecycle into the name or type, and reuse the project's existing term instead of a new synonym, because callers read the call and not the implementation. Check a real call without opening the function.

<example>
`timeout_ms` instead of `timeout`, and `published_at` where the codebase already says "published", not a new `released_at`.
</example>

Keep a short conventional name in a tiny scope where the language has that idiom, and expand it when several similar values coexist or the value crosses a boundary, because a long name in a three-line loop adds reading without adding meaning.

<example>
`for i, row in enumerate(rows)` stays as it is, while a function that receives both a user and an order identifier calls neither of them `id`.
</example>

Do not let a function whose name promises a query change state that callers can see, and make an intended state change visible in the name, because a hidden write behind `get_` breaks callers that call it twice or in a loop. Returning a useful result from a command is fine. Check caller-visible state before and after a nominal query, including aliased inputs.

<example>
`get_cart_total()` does not save the cart, and the function that does save it is named `recalculate_and_save_cart()`.
</example>

## Control complexity without fragmenting the algorithm

Extract a block into a function when it is one cohesive decision with a useful name that callers can treat as a unit, and keep it inline when splitting would pass shared locals around or hide a required call order, because a helper the reader must open anyway adds a jump without hiding anything. A line count alone never justifies extraction.

<example>
`is_eligible_for_refund(order)` is worth extracting, while splitting a 30-line parser into `step1()`, `step2()`, and `step3()` that pass the same five locals is not.
</example>

Use guard clauses when nesting hides independent rejection cases, and keep one structured branch when cleanup, paired cases, or ordering read more clearly that way, because the goal is that every exit visibly keeps its obligations. Name an intermediate value only when the name explains a decision.

<example>
`if user is None: return None` at the top replaces three levels of nesting, while a `try/finally` that closes a file keeps its single exit.
</example>

Pass related parameters as one value when they form a real domain concept, keep separate parameters when they are merely adjacent, and use named arguments or a distinct type where positional arguments are easy to swap, because swapped arguments of the same type run silently with wrong results. Judge by real call sites, not by a parameter count.

<example>
`create_report(DateRange(start, end))` when ranges travel together through the code, and `resize(width=800, height=600)` because both arguments are integers.
</example>

Split a boolean parameter that selects unrelated workflows into separate operations, and keep a boolean for a genuine two-valued property, because a caller of `save(order, submit=True)` must know the internal branches to know what it asked for.

<example>
`submit_order(order)` and `save_draft(order)` replace `save(order, submit=True)`, while `set_visible(True)` stays.
</example>

## Make contracts enforceable

Before implementing a new or changed operation, settle its accepted values, ownership, and success and failure guarantees, then express them through types, executable checks, or tests, because an unstated contract gets a different meaning at every call site. Check boundary values and every promised result state. No contract framework is needed for this.

<example>
For `withdraw(amount)`, state that `amount` must be positive and that a failure leaves the balance unchanged, then test `0`, a negative amount, and an amount larger than the balance.
</example>

When related fields must agree for an object to be valid, establish that invariant when the object is created and keep it across every exposed change, because an object that can exist in an invalid state forces every reader to check it again. Plain data is enough when the fields really vary independently.

<example>
The `DateRange` constructor rejects `end < start` and `extend()` keeps that guarantee, while a settings record with unrelated fields stays a plain dataclass.
</example>

Rely on a guarantee that a trusted type or boundary already establishes instead of repeating defensive checks everywhere, and establish it at the real boundary when it is missing, because scattered checks hide where validation actually happens. An assertion that can be disabled never replaces validation of external input.

<example>
Request JSON is validated once in the handler, so `OrderService` receives an `Order` and does not test for missing fields again, and Python's `assert` is never the check on user input.
</example>
