# State, forms, and asynchronous work

## Define what each value means

Separate persisted records, editable drafts, selected identity, route state, and request status, identify each stored value's owner and reset condition, and calculate filtered lists, totals, and validity from current inputs, because a second copy kept in step by an Effect or watcher falls out of step with its source. An intentionally detached draft is different from redundant state.

<example>
`visibleOrders` is computed from `orders` and `filter` during render, while `draftNote` is a deliberate copy edited until Save.
</example>

When booleans permit contradictory states, use one explicit status and derive the flags, and store a selected record's identity and not a second mutable record while the canonical collection owns it, because `isLoading` and `isError` both true is a state the UI cannot explain. A small set of local transitions needs no state-machine library.

<example>
`status` with the values `idle`, `loading`, `error`, and `saved` replaces four booleans, and `selectedId` replaces a copied `selectedUser`.
</example>

Preserve valid zero, false, and empty values and do not treat every falsy value as missing, because a truthiness check turns a legitimate `0` into an absent value.

<example>
A cart line with quantity `0` renders `0` and keeps its row, and `value ?? defaultValue` replaces `value || defaultValue`.
</example>

Use stable record identity in repeated editable UI, reset a draft when its subject changes only if that matches the product's behavior, and keep the component type stable, because regenerated keys or an accidental type change discard focus, selection, and unfinished work.

<example>
Rows use `key={invoice.id}` and not `key={Math.random()}`, so typing in a row's note keeps focus after a refetch.
</example>

## Model states by user meaning

Tell initial loading, refreshing, no records, no matching results, denied access, failed loading, and failed saving apart, because each needs a different explanation and action, and show a failed response as a failure and not as an empty collection. Initial loading has no usable result yet and refreshing may retain existing data. Claim success only when the operation succeeded and not when a local handler ran.

<example>
A `500` from `/api/orders` shows "Orders could not be loaded" with a Retry button and not "No orders yet".
</example>

Keep previous content during a same-scope refresh when it helps and make the relationship between the previous result and the pending query clear, drop another scope's sensitive content on an identity or permission change, and place feedback at the affected action or region, because a full-page spinner for one row operation hides working content and leftover content from another account leaks data.

<example>
Changing the sort keeps the current rows dimmed with an inline "Updating" label, switching tenant clears the table at once, and deleting a row shows the spinner on that row only.
</example>

Make retry preserve the useful inputs and the intended selection, offer only a next step that can work, confirm completion only after the required operation succeeds, and tie loading indicators to a pending operation and not a fixed delay, because a retry that resets the form or a fake "Saved" teaches users to distrust the interface.

<example>
After a failed `PUT /api/profile`, Retry resubmits the same draft, and "Profile saved" appears after the `200` response and not after a `setTimeout`.
</example>

## Keep form editing separate from submission

Use the project's established form mechanism and native submission where suitable, keep editable strings until parsing is appropriate, and avoid normalizing a field on every keystroke, because normalizing moves the caret and blocks valid intermediate input such as `1.` or `-`.

<example>
A price field holds the string `"12,"` while typing and parses to `12` on blur or submit, instead of rewriting the value as the comma is typed.
</example>

Show format guidance before entry when it is needed, validate when feedback becomes useful, usually after interaction or submission, keep field errors distinct from form-wide network failures, clear an obsolete field error when its value changes, and keep server validation, because errors on a half-typed value are noise and client validation can be bypassed.

<example>
An email field shows its error on blur, a `500` from the server appears in a form-level alert and not under the email field, and the server still rejects a malformed address.
</example>

Preserve native labels, autocomplete, paste, and password-manager behavior, make non-submit buttons explicit inside forms, and leave Enter alone while an input method is composing text, because a button defaults to submit and Enter during composition confirms a character and not the form. Check composition in the supported browser and not through one keyboard event alone.

<example>
The "Add row" button is `type="button"`, and the Enter handler checks `event.isComposing` before submitting a Japanese search query.
</example>

When submitting, capture the intended draft, prevent duplicate execution of that mutation, preserve the draft on failure, and keep unrelated fields and actions enabled, because a double click would create two records and a delayed validation or save response must not describe or overwrite a newer field value.

<example>
Clicking "Pay" twice sends one `POST /api/orders` because the handler ignores the second click while the first is pending, and a save response arriving after the user edited the title does not reset the field.
</example>

## Make obsolete work unable to commit

Reuse existing loaders, query caches, or request services, define request identity from all relevant inputs including account or tenant scope, cancel an obsolete read where supported, and guard success, error, and finalization, because a slow earlier response that arrives last overwrites the current result and an old request's cleanup can clear a newer request's pending state.

<example>
Typing `ab` and then `abc` sends two searches, the late `ab` response is dropped through its `AbortController` and a request id, and its `finally` block does not turn off the spinner for `abc`.
</example>

Treat debouncing as request-frequency control and not as response ordering, do not rely on component cleanup alone for input changes, check the HTTP status before assuming success, and decode and validate the expected response once at the data boundary, because `fetch` resolves on HTTP errors and a generic response type is not runtime validation.

<example>
`const res = await fetch(url)` is followed by `if (!res.ok) throw new Error(res.statusText)` and a `parseOrders(json)` call in `api/orders.ts`, and not by checks inside each row component.
</example>

Treat intentional cancellation as cancellation and not as a failure toast, do not assume that aborting a client request reverses a server mutation, retry a non-idempotent mutation automatically only when the API contract makes repetition safe, and give an optimistic update a rollback or reconciliation path that accounts for edits made while it was pending, because after a dropped connection the server outcome is unknown and a repeated `POST` can create a duplicate.

<example>
An aborted search shows no toast, a timed-out `POST /api/payments` asks the user to check the order list instead of resending, and a failed optimistic "like" returns to its previous count.
</example>

## Adapt to the installed framework

In React, derive render data during rendering, put user actions in their event path, use Effects only to synchronize external systems with correct dependencies and cleanup, and fix a stale closure and not the dependency check, because an Effect that mirrors state adds a render and hides the data flow. Use the existing framework loader when one is available.

<example>
`fullName` is computed in render from `first` and `last`, and an `exhaustive-deps` warning on a subscription Effect is fixed by moving the handler inside the Effect and not silenced.
</example>

In Vue, keep computed getters free of side effects, use watchers for effects, and register cleanup for stale work, because a computed with side effects runs at times the code does not control. `onWatcherCleanup` exists only in newer Vue versions and must be registered synchronously before an `await`, so check the installed version and otherwise use the cleanup callback the watcher already receives. Preserve composable reactivity and dispose resources with the owning scope.

<example>
A search watcher registers `onCleanup(() => controller.abort())` before its first `await`, using the callback argument because `package.json` pins a Vue version without `onWatcherCleanup`.
</example>

In Angular, use computed signals for derivation when the application already uses signals, let existing `HttpClient` pipelines cancel stale reads through unsubscription and `switchMap`, and keep the established data mechanism instead of adding a new signal or observable layer, because parallel mechanisms split the data flow.

<example>
A search box keeps its `valueChanges.pipe(debounceTime(300), switchMap(...))`, and a `computed()` total is added only in a component that already uses signals.
</example>

## Check transitions, not only steady states

Exercise rapid query changes with reversed response order, make an obsolete request fail after the current one succeeds, navigate away during a read, retry after failure, and for a form submit with a local error, then with a server rejection, then successfully, double-activating and editing while a save is pending, because races and resets show only in transitions. Confirm that the correct result, pending indicator, draft, error, and focus survive each transition.

<example>
Delay the `q=ab` response by 3 seconds past `q=abc` in the network panel and confirm the list still shows the `abc` results, then click "Save" twice with the note edited in between.
</example>
