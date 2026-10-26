# State and failures

## Own mutable and derived state

Keep an invariant over related mutable data under one owner that exposes meaningful transitions instead of the raw representation, because every unrestricted writer can break the invariant. Check all writers, including callbacks and aliases, and remember that copying an outer container still shares the nested values.

<example>
`cart.add_item(item)` updates the items and the total together, and `cart.items` is never handed out as the live list a caller could append to.
</example>

Compute a value that can be derived from authoritative state instead of storing a second mutable copy, and when measured cost or snapshot semantics justify storing it, make its invalidation or snapshot time explicit, because a stored copy becomes a second source of truth that drifts.

<example>
`order.total` is computed from the order lines, or stored as `total_at_checkout` when keeping that snapshot is the requirement.
</example>

Before a multi-step update that can fail, decide which state a failure may leave behind, and use a transaction or a compute-then-publish step when the contract is all or nothing, because a half-applied update reported as success corrupts data silently.

<example>
A batch rename computes and validates every new name first and applies them only when all of them passed.
</example>

## Release resources without losing ownership

Give each acquired resource one owner and one release path, preferably the language's scoped cleanup, and never release a borrowed resource or keep it past its owner, because duplicated cleanup branches always miss one path. Check success, early return, failure, and cancellation.

<example>
`with open(path) as f:` in Python, `using var conn = ...` in C#, and a function that receives an already open file does not close it.
</example>

When cleanup itself can fail, keep the primary error and attach the cleanup error to it through the runtime's suppressed-error, note, or aggregation mechanism, because replacing the original error hides the real cause.

<example>
In Python 3.11 and later, a failing `close()` after a failed write is caught and added to the write error with `add_note()`, and the write error is the one the caller sees. Older versions log the close error.
</example>

## Keep failures meaningful

Use the language's normal error channel, handle an error only where you can recover, clean up, or translate it for the caller, and propagate it otherwise, because a catch without a job hides failures. Expected failures do not justify a panic or a process exit.

<example>
A repository function lets `IntegrityError` propagate to the service, which turns it into `DuplicateEmail` for the API.
</example>

Represent absence and failure differently when callers must react differently, and keep empty collections and zero as ordinary results where the contract defines them, because conflating them makes callers retry an empty result or show "no results" during an outage.

<example>
`search()` returns `[]` when nothing matches and raises `SearchUnavailable` when the index is down.
</example>

Catch only the failure a recovery can address, around the smallest operation that raises it, and let programming errors and cancellation through, because a broad catch turns bugs into fallback values. A fallback is valid only when its result meets the caller's existing contract.

<example>
`except requests.Timeout:` around the HTTP call returns cached data, while a `KeyError` caused by a typo still surfaces.
</example>

## Keep concurrent decisions atomic

When work can interleave, protect the whole read-check-update sequence and not just the individual writes, preferring confinement or immutable sharing where it removes coordination, because two individually safe writes can still race. Check two contenders against the same state.

<example>
Reserving the last ticket runs `UPDATE events SET seats_left = seats_left - 1 WHERE id = ? AND seats_left > 0` and checks the affected row count, instead of reading `seats_left` and writing it back.
</example>

When one decision spans several resources, find the transaction or compensation boundary instead of trusting separate locks, and release locks on errors and cancellation, because a failure between two resources leaves them inconsistent.

<example>
Charging a card and creating an order first records a pending order, then marks it paid or cancels it depending on the charge result.
</example>

Give every background or asynchronous task an owner for its lifetime and its failure, with a defined finish, cancellation, and observer of its result, because a fire-and-forget task leaks resources and loses errors when the caller leaves early.

<example>
An upload started from a request is awaited or handed to a supervisor that logs its failure, instead of a bare `asyncio.create_task()` that nothing keeps.
</example>
