# API contracts and boundaries

Apply a protocol's own standard to that protocol, and treat Google and Azure API conventions as guidance for the contract in front of you instead of requirements for every API, because a convention written for one platform can contradict a contract the project's clients already depend on.

<example>
A Spring Boot store whose `/api/v1` routes already return `{"error": {"code": "out_of_stock"}}` keeps that envelope and does not adopt another vendor's field names for one new route.
</example>

## Separate transport from the operation

When HTTP handlers and workers perform the same business operation, keep the shared rules in the existing application operation, which can be a plain function with no new service class or deployment unit, and let adapters parse transport data, establish trusted context, and map outcomes, because a rule that takes an HTTP response object cannot run from a job and ends up copied. Add the separation where it prevents duplicated rules or framework coupling, not to satisfy a layer count, because extra mappings cost code and can obscure a trivial endpoint. Check by sending the same invalid business transition through the endpoint and the job, and confirm both reject it without an HTTP runtime inside the shared operation.

<example>
The Go handler `POST /subscriptions/{id}/cancel` and the nightly job `expire_lapsed_subscriptions` both call `cancelSubscription(ctx, id)`, and only the handler builds the HTTP response.
</example>

## Preserve authorization across boundaries

When a request names an object, authorize that principal's action on that object, and keep tenant and actor binding through adapters, idempotency records, status lookup, and queued work, because authentication, an object ID, or a continuation token does not by itself grant access. Use `security` for the actual policy and credential design. Check another tenant's object, cursor, operation ID, and duplicate key.

<example>
The Next.js route `GET /api/reports/[id]` loads with `where id = $1 and tenant_id = $2` taken from the session, so a valid report ID from tenant B returns not found for tenant A.
</example>

For delayed jobs, decide whether authority is accepted at submission or reevaluated at execution, and carry only a bounded, trusted execution contract in the message instead of arbitrary privileges, because reevaluation supports revocation but can invalidate work already accepted, while a message with free-form privileges lets whoever can enqueue act with them. Check the chosen revocation behavior between submission and execution.

<example>
A queued `export_orders` job stores `{userId, tenantId, format}` and rechecks the export permission when it runs, so a user removed after pressing Export gets status `permission_revoked` and no file.
</example>

## Evolve behavior as well as schemas

When consumers already exist, compare old and new requests, responses, defaults, nullability, errors, and value formats, and preserve the old behavior or follow the project's explicit migration policy for every difference, because adding a required input or changing a default breaks an unchanged client, and removing or renaming a field is not an additive change. Check an unchanged client against the new server, and in mixed deployments the new client against the old server, including omitted fields, unknown output values, and an old error-handling path.

<example>
Installed Android app builds call `POST /api/subscribe` without `plan`, so the server treats a missing `plan` as `"free"` instead of returning `422` once the field becomes expected.
</example>

Check added fields and enum values against consumers, especially generated clients and exhaustive switches, and coordinate producer and consumer rollout when compatibility is not bidirectional. Keep old behavior only where its maintenance cost is justified and skip a new version for harmless additions, because a version also costs migration and parallel operation.

<example>
Adding `"refunded"` to an order status breaks a C# switch expression on `order.Status` that has no `_` arm, since it throws `SwitchExpressionException`, while an optional `note` field needs no `/v2`.
</example>

## Paginate without inventing a snapshot

When collections can grow beyond practical response limits, define bounded pages before callers rely on complete responses, keep tokens opaque, query-bound, and separate from authorization, and detect completion with the protocol's continuation indicator instead of page length, because adding pagination later changes behavior for every existing caller and a short page can still have a valid continuation. Check a short or empty page with a valid continuation, expired tokens, changed filters, and the maximum page size at the boundary.

<example>
`GET /api/orders?limit=50` returns an opaque `next_cursor`, and the client loops until `next_cursor` is `null` instead of until a page has fewer than 50 rows.
</example>

Choose ordering and consistency from the product requirement, give stable pages a deterministic order with a tie-breaker, and coordinate a snapshot boundary or durable export with `database` when an export must be exact, because a cursor does not freeze changing data, long snapshots consume resources, and live browsing may accept omissions or duplicates only when they are explicitly understood. Check insertions and deletions between pages and equal sort values.

<example>
An audit log list orders by `(created_at, id)` so two entries in the same second keep a stable position, while the nightly invoice CSV runs against a fixed `as_of` boundary.
</example>

## Make failures actionable without changing their meaning

When callers recover programmatically, return stable machine-readable error identifiers that separate invalid requests, conflicting state, temporary unavailability, and uncertain completion, and keep the human message out of retry decisions, because a client that parses text breaks when someone rewords it. Check an old client's recovery branch and failures before and after a mutation commits.

<example>
A shipping-rates gateway returns `{"code": "upstream_timeout", "retryable": true}` when a carrier lookup exceeds its deadline and `{"code": "invalid_postcode", "retryable": false}` for a rejected address, so the checkout retries only the first.
</example>

Keep the project's established error format and add codes inside it, consider Problem Details (RFC 9457) only for a new HTTP format without a suitable existing one, and keep implementation internals out of public errors, because replacing a working format for uniformity breaks existing clients and a leaked internal becomes part of the contract. Add a finer code only when a caller can act on it differently, because every code expands the compatibility obligation.

<example>
A Laravel booking API keeps its `{"error": {...}}` body and adds `"code": "slot_taken"` instead of moving to `application/problem+json`, and a database exception text is logged while the response says `internal_error`.
</example>

## Distinguish acceptance from completion

When work cannot reasonably finish within the request's lifetime, use the existing asynchronous-operation pattern and expose operation identity, terminal result or error, status retention, and cancellation semantics, because HTTP `202` acknowledges acceptance and not successful completion, and a connection that drops would otherwise be the only record of the work. Prefer synchronous completion when it meets latency and resource requirements, because durable operation tracking costs storage and cleanup.

<example>
A bulk invoice PDF render that takes minutes behind a 30-second proxy limit returns `202` with `Location: /api/jobs/9f2c` and the client polls for `done` or `failed`, while a lookup that answers in 200 ms stays synchronous.
</example>

Make a repeated submission return the existing operation instead of creating another business operation, because a client that lost the acceptance response will submit again. Check a lost acceptance response, duplicate submission, status expiry, worker failure, and cancellation racing completion.

<example>
A SaaS user clicks Generate on `POST /reports` twice after a lost response, and both calls return job `9f2c` because the submission identity is account, report type, and day.
</example>
