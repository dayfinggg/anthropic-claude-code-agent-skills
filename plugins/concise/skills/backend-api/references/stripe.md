# Stripe payments, webhooks and API versions

This file matches Stripe API version `2026-10-28.endive`. The current version is published at https://docs.stripe.com/api/versioning, and the API changelog lists what each version changed.

## Versions and SDKs

- Monthly releases carry no breaking changes. Twice a year a named major release starts with a version that has breaking changes.
- Read the SDK version in the lockfile and the API version it pins. Typed SDKs (stripe-java, stripe-go, stripe-dotnet) are fixed to the API version current at their release, so change the SDK to change the version. stripe-node 12+, stripe-python 6+, stripe-ruby 9+ and stripe-php 11+ also pin the version current at their release, and older majors use the account's default version from the Dashboard.
- Requests with curl or the Stripe CLI use the account's default version unless the `Stripe-Version` header (curl) or the CLI's `stripe-version` argument overrides it.
- Create a client instance (`new Stripe(key)`, `StripeClient`) instead of setting a global key. The stripe-python README (2026-11-19) calls the global pattern legacy and says that once it is deprecated, new endpoints will be reachable only through `StripeClient`.
- Give each service a restricted key (`rk_`) with only the permissions it uses, and keep keys out of code, servers' source trees included.

## Checkout and payments

- Accept payments with Checkout Sessions, embedded or with the Payment Element. Omit `payment_method_types` so the payment methods configured in the Dashboard apply, and restrict with `excluded_payment_method_types`, or `allowed_payment_method_types` on a PaymentIntent.
- Fulfill orders from webhooks for `checkout.session.completed` and `checkout.session.async_payment_succeeded` when `payment_status` is not `unpaid`. The success page may never load, and bank transfers and other delayed methods complete later through the async event.
- The fulfillment function can run several times, also concurrently, for one Checkout Session, so make it safe to repeat, for example with a unique constraint on the session ID.
- With a `checkout.session.completed` endpoint and a `success_url`, Checkout waits up to 10 seconds for the webhook response before redirecting, so answer that event fast. It does not wait for organization-level endpoints or under the Stripe CLI.
- Stripe Tax with `automatic_tax` calculates and collects tax only for locations with a registration added in Stripe Tax, and without registrations the integration runs and collects no tax. Confirm the registrations first.

## Idempotency

- In API v1, send `Idempotency-Key` on POST requests. Keys are up to 255 characters, V4 UUIDs are recommended, and keys must not contain personal data such as email addresses. Keys on GET and DELETE have no effect.
- Stripe saves the status code and body only after the endpoint starts executing, so a request rejected for invalid parameters, or for conflicting with a concurrent request on the same key, can be fixed and retried.
- A saved 500 is replayed for the same key, so retrieve the object to learn the real outcome before using a new key.
- Keys can be pruned after 24 hours, and a reused pruned key starts a new request. Reusing a key with different parameters returns an error.
- In API v2, retries finish failed or partial work where possible instead of replaying the first response.

## Webhooks and event destinations

- Event destinations deliver thin events (recommended for new integrations, unversioned, typed in the SDKs, fetched in full with `fetchRelatedObject()`) or snapshot events (the full Event object for one API version). The format is chosen per destination, so thin events need their own destination, and a live-mode or sandbox account can have at most 16 destinations.
- Verify the `Stripe-Signature` header over the raw body. During a secret roll, kept for up to 7 days, the header carries one `v1` signature per active secret, so accept a match on any of them.
- The libraries reject timestamps older than 5 minutes by default, and a tolerance of 0 disables the replay check rather than tightening it.
- A snapshot event is shaped by the account's API version when it was created, or by the destination's version. Create the destination with the SDK's pinned version and upgrade both together.
- Events arrive out of order and more than once, so deduplicate on the event ID. Stripe can also emit two different Event objects for one change, so deduplicate on `data.object.id` together with `event.type` too. `created` has whole-second precision and cannot order events.
- Live mode retries failed deliveries for up to three days with backoff, and sandboxes retry three times over a few hours. A manual resend (Dashboard up to 15 days, `stripe events resend` up to 30 days) does not cancel the automatic retries.
- Exempt the webhook route from CSRF middleware.

## Rate limits

- Live mode allows 100 requests per second per account and a sandbox 25, with 25 per second per endpoint unless noted and 1,000 updates per PaymentIntent per hour, so load tests against a sandbox hit 429 early.
- A separate concurrency limit of 50 in-flight live requests applies, and list requests and expansions hold it longest. A rate-limited 429 carries `Stripe-Rate-Limited-Reason` (`global-rate`, `endpoint-rate`, `global-concurrency`, `endpoint-concurrency`, `resource-specific`), and the fix is a retry with backoff and jitter.
- A 429 without that header is not a rate limit. Code `lock_timeout` means another request is working on the same object, so retry and serialize writes to one object.
