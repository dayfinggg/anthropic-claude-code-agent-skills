---
name: building-resilient-services
description: Adds timeouts, retries, circuit breakers, idempotent consumers, graceful shutdown, and health probes. Use for remote API or LLM calls, queues, workers, SIGTERM, readiness, or idempotency keys.
---

# Building resilient services

The project's resilience library, policies, and settings win over this skill.

## Reference files

- `reference/libraries.md` holds library defaults and setup. Read it before configuring one.
- `reference/patterns.md` covers retry limits, outbox, probes, shutdown, rate limits, and LLM calls. Read it for these.
- `examples.md` shows one idempotent handler. Read it before writing one.

## Values and libraries

- Take timeouts, retry counts, delays, breaker thresholds, and grace periods from configuration.
- If configuration has none, use the library's documented defaults.
- If neither exists, add a named setting and flag its default in your report.
- Use the SDK's built in retry first, then the project's library, then the one in the libraries file.
- Do not hand write a retry loop, backoff, or breaker.

## Remote calls

- Give every remote call a timeout and pass the caller's cancellation downstream.
- Bound each attempt with a timeout and wrap all retries in a longer total timeout.
- Retry connection failures, attempt timeouts, 408, 429 with `Retry-After`, and 5xx. Do not retry other 4xx.
- Use finite attempts with exponential backoff and jitter.
- Retry in one layer only. Nested retries multiply calls.
- Put the retry around the circuit breaker. Make its predicate skip the breaker's own rejection.
- Retry a create, payment, increment, or email only with an idempotency key the receiver deduplicates.

## Messages and jobs

- Brokers deliver at least once, so make every handler idempotent.
- Prefer an upsert or a write of absolute state.
- Otherwise claim a dedup key under a uniqueness constraint, in the same transaction as the side effects. Acknowledge after the commit.
- Use the producer's message ID or a business key. Never use a broker delivery ID, receive timestamp, or shared correlation ID.

## Health and shutdown

- Liveness is a shallow check that touches no dependency.
- Readiness checks each dependency with its own timeout.
- On SIGTERM a web process stops accepting connections and drains in flight requests within a grace period.
- A worker finishes or requeues its job.

## Tests

Inject timeouts, 429 and 503 responses, an open breaker, a duplicate message, and a SIGTERM.
