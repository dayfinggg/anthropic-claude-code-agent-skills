---
name: backend-api
description: Current practice for HTTP API design and reliability, covering error bodies, idempotency keys, retries and unknown outcomes, incoming and outgoing webhooks, Stripe payments, queues, rate limits, pagination, versioning and deprecation. Use when designing or reviewing REST endpoints or an OpenAPI document, adding retries, timeouts or an Idempotency-Key header, building a webhook receiver or sender, integrating Stripe Checkout, PaymentIntents, subscriptions or Stripe webhooks, writing queue consumers or job workers, adding rate limiting or handling 429 responses, paginating a list endpoint, versioning or deprecating an API, or a quick question about which status code or header to use.
---

## Check first

- Read the existing contract before adding to it: the OpenAPI document (`openapi.yaml` or `openapi.json` and its `openapi` version), the error body shape, the pagination style, auth, and any idempotency table or middleware. Match them.
- Find every layer that already retries (SDK defaults, HTTP client options, queue redelivery, the caller's own retries) before adding one.
- For Stripe, read the SDK version in the lockfile, the API version that SDK pins, and each webhook endpoint's API version in the Dashboard.
- Current Stripe API version and release model: https://docs.stripe.com/api/versioning.md
- Stripe idempotency rules: https://docs.stripe.com/api/idempotent_requests.md
- Facts verified 2026-11.

## Defaults

- Error bodies follow RFC 9457 Problem Details, which obsoletes RFC 7807, served as `application/problem+json`: `type` as a URI, `title`, `status`, `detail`, `instance`, plus extension members such as an `errors` array for field validation.
- Use the QUERY method (RFC 10008, June 2026) for searches too large or too sensitive for the URL. It is safe, idempotent and cacheable, and `Accept-Query` advertises the accepted body types. Proxies, CDNs, frameworks and clients may not support it yet, so confirm the whole path and keep a POST fallback.
- OpenAPI 3.2 (3.2.0 in September 2025, 3.2.1 in September 2026) adds a `query` operation, `additionalOperations` for other methods, `itemSchema` for sequential media types such as `text/event-stream` and `application/jsonl`, and `$self`. Move a document to 3.2 only when its generators and validators support it.
- A write that clients may retry (payment, order, email, provisioning) accepts an `Idempotency-Key` header. The client creates one random key per intent (UUID v4), persists it, and sends the same key on every retry, including after a restart. The standard is still an IETF draft (draft-ietf-httpapi-idempotency-key-header-08, October 2026), with missing key mapped to 400, same key with a different payload to 422, and the original still running to 409.
- The server claims the key with one atomic insert under a unique constraint, not a SELECT then INSERT, storing a request fingerprint and an in-progress state, then stores the final status and body and replays them for later attempts. Publish how long keys live, and keep them longer than the longest redelivery path (client retries, dead-letter replay, provider retry windows): a 24-hour key table behind a 7-day dead-letter replay charges twice.
- Every remote call ends in success, failure or unknown. A timeout, a reset connection or a 5xx after the request left is unknown, because the effect may have happened. Retry with the same key and parameters, or read the resource to reconcile.
- A database transaction that fails with SQLSTATE 40001 (serialization failure) or 40P01 (deadlock) was rolled back. Rerun the whole transaction, including the reads that chose its values. A connection lost during `COMMIT` is unknown instead, so reconcile before rerunning a relative write such as `balance = balance - 100`.
- Record the intent in your own database before calling out (a transactional outbox), so a crash between the call and its response leaves a row to reconcile.
- Retry only idempotent methods and keyed POSTs, at one layer only, with exponential backoff, full jitter, a cap and a per-request budget. Retry 408, 429, 502, 503, 504 and connection errors, not other 4xx. `Retry-After` holds either seconds or an HTTP date.
- Return 429 with `Retry-After` when rate limiting. The IETF RateLimit draft (revision 11, still not an RFC) uses two structured fields instead of the de facto `X-RateLimit-*` headers and its own earlier `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset`. Keep the project's existing convention if it has one.

```http
RateLimit-Policy: "default";q=100;w=60
RateLimit: "default";r=50;t=30
```

- Page large or changing collections with an opaque cursor that encodes the sort key plus a unique tiebreaker (`created_at` and `id`), a `limit` with a server maximum, and `next_cursor` or `has_more`. Offset paging skips and repeats rows under concurrent writes. Leave total counts out unless required, since they often need a full count query.
- Announce deprecation with the RFC 9745 (March 2025) `Deprecation` header, whose value is a structured-field date in Unix seconds, a `Link` with `rel="deprecation"`, and the RFC 8594 `Sunset` header with an HTTP date. `Deprecation: true` and HTTP-date values come from early drafts and are wrong now.

```http
Deprecation: @1688169599
Link: </docs/deprecations/v1>; rel="deprecation"; type="text/html"
Sunset: Sat, 01 May 2027 00:00:00 GMT
```

- Sign outgoing webhooks the Standard Webhooks way: headers `webhook-id`, `webhook-timestamp` (Unix seconds) and `webhook-signature` (`v1,` plus base64 HMAC-SHA256 of `id.timestamp.body`), secrets prefixed `whsec_`, and several space-separated signatures during secret rotation. Retry over days with backoff and jitter, count only 2xx as success, do not follow redirects, disable the endpoint on 410, and time out after 15 to 30 seconds.
- Send webhooks to customer-supplied URLs through an egress proxy that blocks private and cloud-metadata addresses (Stripe's smokescreen is one). Otherwise each endpoint URL is an SSRF probe.
- Queue consumers ack after the side effect commits and stay idempotent, since delivery is at least once. Keep the visibility timeout or lease above the worst processing time, and dead-letter poison messages after a fixed number of attempts.
- Stripe's current API version is `2026-10-28.endive`. Monthly releases carry no breaking changes, and two named major releases a year do. Typed SDKs (Java, Go, .NET) and stripe-node 12+, stripe-python 6+, stripe-ruby 9+ and stripe-php 11+ pin the API version current at their release.
- Accept Stripe payments with Checkout Sessions, embedded or with the Payment Element. Omit `payment_method_types` so dynamic payment methods apply. Restrict with `excluded_payment_method_types`, or `allowed_payment_method_types` on a PaymentIntent. Terminal integrations still pass `card_present`.
- Fulfill Stripe orders from webhooks for `checkout.session.completed` and `checkout.session.async_payment_succeeded`, when `payment_status` is not `unpaid`. The success page may never load, and the fulfillment function must be safe to run several times concurrently for one session.
- Stripe event destinations deliver thin events (recommended, fetch the object with `fetchRelatedObject()`) or snapshot events. Thin events need their own endpoint.
- Use Stripe restricted keys (`rk_`) scoped to the calls a service makes, and create a client instance (`new Stripe(key)`, `StripeClient`) rather than the deprecated global key setting.

## Gotchas

- A duplicate that arrives while the first attempt still runs gets a 409, a bounded wait or a 202 with a status URL, never a second execution because the first "seems stuck".
- Stripe v1 stores a 500 under the idempotency key, so retrying with that key returns the same 500. Retrieve the object to learn the real outcome before using a new key. A 409 for a key still executing means wait and retry with the same key and parameters.
- Stripe saves an idempotent result only after execution starts. A request rejected for invalid parameters or rate limiting was not saved and can be fixed and retried. Keys can be pruned after 24 hours, and API v2 keys behave differently (30-day window).
- A webhook signature covers the raw bytes. A global JSON body parser, re-serializing the parsed body (`JSON.stringify(req.body)`), or trimming whitespace makes every verification fail. Read the raw body (Express `express.raw({ type: 'application/json' })` on that route, Next.js `await request.text()`) and parse after verifying.
- Stripe's libraries reject timestamps older than 5 minutes by default. A tolerance of 0 disables the replay check rather than tightening it.
- Webhook events arrive out of order and more than once. Deduplicate by event ID, fetch current state instead of trusting event order or `created` (whole seconds, so ties happen), and exempt the route from CSRF middleware.
- Stripe can emit two different Event objects for one change. Deduplicate on `data.object.id` with `event.type` as well as the event ID.
- A webhook endpoint created with an older API version sends payloads shaped for that version while the pinned SDK expects its own. Create the endpoint with the SDK's version and upgrade both together.
- Stripe retries failed webhook deliveries for up to three days in live mode, and a manual resend does not cancel them. While a signing secret rolls, the header carries several `v1` signatures for up to 7 days, so accept a match on any of them.
- Stripe Tax with `automatic_tax` returns zero tax for locations where the account has no registration, while the integration looks correct. Confirm registrations first.
- Stripe rate limits are 100 requests per second per account in live mode but 25 in a sandbox, plus 25 per endpoint and concurrency limits. Load tests against a sandbox hit 429 early.
- A response type can list a field that the query projection, the serializer or DTO, or the OpenAPI schema drops, and the type check still passes. When adding or renaming a field, assert on a real serialized response.
