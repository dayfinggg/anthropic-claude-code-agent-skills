---
name: backend-api
description: Load before designing or changing an HTTP API or an OpenAPI document, adding retries, timeouts, idempotency keys, pagination or rate limits, writing queue workers, building a webhook sender or receiver, integrating Stripe Checkout or Stripe webhooks, and when choosing a status code, an RFC 9457 error body or a header. Access control belongs to web-security, transactions and migrations to database.
---

# HTTP APIs and reliability

This skill covers the contract and failure handling of HTTP APIs and the jobs behind them. It matches RFC 9457 (problem details), RFC 10008 (QUERY), RFC 9745 and RFC 8594 (deprecation and sunset), OpenAPI 3.2.1, draft-ietf-httpapi-idempotency-key-header-08, draft-ietf-httpapi-ratelimit-headers-11, Standard Webhooks 1.0.0 and Stripe API `2026-10-28.endive`. Both IETF documents were still Internet-Drafts on 2026-11-19, and where a newer revision or a provider's own API reference says otherwise, that document is right.

## References

- Read [references/webhooks.md](references/webhooks.md) before building a webhook sender or receiver, signature verification, or delivery retries for customer URLs.
- Read [references/stripe.md](references/stripe.md) before integrating Stripe Checkout, PaymentIntents, subscriptions, Stripe webhooks or event destinations, Stripe idempotency or rate limits, or upgrading a Stripe SDK or API version.

## Check first

- Read the existing contract before adding to it and match it: the OpenAPI document (`openapi.yaml` or `openapi.json` and its `openapi` version), the error body shape, the pagination style, auth, and any idempotency table or middleware.
- Find every layer that already retries (SDK defaults, HTTP client options, queue redelivery, the caller's own retries) before adding one, because retries multiply, so three SDK retries inside three job retries make nine calls per message.

## Contract

- Error bodies follow RFC 9457, which obsoletes RFC 7807, as `application/problem+json` with `type` as a URI and field validation errors in an extension member such as `errors`.
- Use the QUERY method (RFC 10008, June 2026) for searches too large or too sensitive for the URL. It is safe, idempotent and cacheable, and `Accept-Query` advertises the accepted body types. Proxies, CDNs, frameworks and clients may not support it, so confirm the whole path and keep a POST fallback.
- OpenAPI 3.2 (3.2.0 in September 2025, 3.2.1 in September 2026) adds a `query` operation, `additionalOperations` for other methods, `itemSchema` for sequential media types such as `text/event-stream` and `application/jsonl`, and `$self`. Move a document to 3.2 only when its generators and validators support it.
- Page large or changing collections with an opaque cursor that encodes the sort key plus a unique tiebreaker (`created_at` and `id`), a `limit` with a server maximum, and `next_cursor` or `has_more`. Offset paging skips and repeats rows under concurrent writes, and total counts often need a full count query, so leave them out unless required.
- Announce deprecation with the RFC 9745 `Deprecation` header, a structured-field date in Unix seconds, a `Link` with `rel="deprecation"`, and the RFC 8594 `Sunset` header with an HTTP date. `Deprecation: true` and HTTP-date values come from early drafts and are wrong now.

```http
Deprecation: @1688169599
Link: </docs/deprecations/v1>; rel="deprecation"; type="text/html"
Sunset: Sat, 01 May 2027 00:00:00 GMT
```

## Idempotency keys

- A write that clients may retry (payment, order, email, provisioning) accepts an `Idempotency-Key` header. The client creates one random key per intent (UUID v4), persists it, and sends the same key on every retry, including after a restart.
- The draft defines the value as a structured-field String, so it is sent quoted: `Idempotency-Key: "8e03978e-40d5-43e8-bc93-6894a57f9324"`.
- Under the draft, a missing key on an operation that requires one gets 400, the same key with a different payload 422, and the same key while the first request still runs 409, each with a problem details body.
- The server claims the key with one atomic insert under a unique constraint, not a SELECT then INSERT, storing a request fingerprint and an in-progress state, then stores the final status and body and replays them for later attempts.
- Publish how long keys live, and keep them longer than the longest redelivery path (client retries, dead-letter replay, provider retry windows). A 24-hour key table behind a 7-day dead-letter replay charges twice.

## Retries and unknown outcomes

- A timeout, a reset connection or a 5xx after the request left is an unknown outcome, because the effect may have happened. Retry with the same key and parameters, or read the resource to reconcile, since a POST retried without a key creates a duplicate whenever the first request succeeded.
- Retry only idempotent methods and keyed POSTs, at one layer, with exponential backoff, full jitter, a cap and a per-request budget. Retry 408, 429, 502, 503, 504 and connection errors, not other 4xx. `Retry-After` holds either seconds or an HTTP date.
- Record the intent in your own database before calling out (a transactional outbox), so a crash between the call and its response leaves a row to reconcile.
- A transaction that fails with SQLSTATE 40001 (serialization failure) or 40P01 (deadlock) was rolled back, so rerun all of it, including the reads that chose its values. A connection lost during `COMMIT` is an unknown outcome instead, so reconcile before rerunning a relative write such as `balance = balance - 100`.
- Queue consumers ack after the side effect commits and stay idempotent, since delivery is at least once. Keep the visibility timeout or lease above the worst processing time, and dead-letter poison messages after a fixed number of attempts.

## Rate limits

- The RateLimit draft uses two structured fields, `RateLimit-Policy` (stable, with `q` quota, `w` window in seconds, optional `qu` unit and `pk` partition key) and `RateLimit` (current state, with `r` remaining and `t` seconds left). It replaces the de facto `X-RateLimit-*` headers and the draft's own earlier `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset`.

```http
RateLimit-Policy: "default";q=100;w=60
RateLimit: "default";r=50;t=30
```

- When a response carries both, `Retry-After` should not point earlier than the end of the effective window, and a client lets `Retry-After` win. A positive `r` does not promise that the next request is served.

## Gotchas

- A duplicate that arrives while the first attempt still runs gets a 409, a bounded wait or a 202 with a status URL, and no second execution, however stuck the first one seems.
- A response type can list a field that the query projection, the serializer or DTO, or the OpenAPI schema drops, and the type check still passes. When adding or renaming a field, assert on a real serialized response.

Related skills: concise:database for transactions, locks and migrations, concise:web-security for SSRF and access control on endpoints, concise:testing for proving retry and idempotency behavior, concise:typescript-javascript and concise:python for runtime specifics.
