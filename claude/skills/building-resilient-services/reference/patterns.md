# Resilience patterns

Rules beyond SKILL.md. Sources are listed at the end. None of them gives universal numbers.

## Retry details

- Retry at the layer just above the one that rejects the request.
- Match the SDK or handler default for retried statuses when one exists.
- For interactive work use few attempts, a short total, and at most one immediate retry.
- The total timeout must fit the caller's deadline.
- Keep retries under about 10 percent of a client's requests.
- Do not retry when much of the backend is overloaded.
- Do not retry a 429 or 400 that reports a spend cap, because it keeps failing.
- When the breaker opens, fail fast or degrade.
- Skip your own breaker when the platform or mesh already has one.
- Log the elapsed time with each retry warning.
- Keep request bodies, auth headers, and personal data out of retry logs.
- The .NET standard resilience handler retries every method. Call `DisableForUnsafeHttpMethods()` unless unsafe calls carry a key.
- Defaults differ by library, so check the real backoff and jitter default before relying on it.

## Idempotent consumer

- A producer writes the message to an outbox table in the state change's transaction, then relays it.
- Bound the attempts and send the rest to a dead letter queue.
- When several consumers share one dedup store, key the record by consumer and message.
- A third party call cannot join your transaction. Record the key as in progress and call with the idempotency key. Then mark the record completed with its outcome.
- Keep dedup records longer than the broker can redeliver. Count messages that operators resubmit from the dead letter queue.
- Broker duplicate detection reduces duplicates but does not replace an idempotent handler.
- A check then set in a cache races. Use a uniqueness constraint.
- Skip deduplication when the effects are already idempotent or when rare duplicates cost less than the store.

## Idempotency keys on an API

- Store a fingerprint of the request parameters with each key.
- Reject a reused key that arrives with different parameters.
- Keys expire, so keep them longer than the longest retry window.
- Never build a key from personal data such as an email address.
- Clients generate a new key per logical operation and reuse it on every retry of that operation.

## Compensating transaction and jobs

- An operation may span services without one atomic transaction. If a later step fails for good, undo the completed steps. Retry first and compensate only when forward progress is impossible.
- Record each completed step and how to undo it.
- Make every compensation step idempotent and record its progress so it can resume.
- Put irreversible steps after all critical validations.
- Alert with details when a person must intervene.
- A job can be killed at any moment. Wrap its results in a transaction or make it idempotent, and release its locks when it stops.

## Bulkhead, rate limiting, load leveling

- Give each dependency its own connection pool, concurrency limit, or queue. Prefer the library's bulkhead or the platform's limits over application code.
- Use separate breakers for independent resources such as shards or hosts.
- For a dependency that throttles, pace calls below its documented limit. Send every workstream that uses it through the same limiter and coordinate retries with that pace.
- When spikes overwhelm a dependency and callers need no immediate answer, put a durable queue in front.
- Bound the consumers' total downstream rate, watch the queue depth, and assume no ordering unless the broker provides it.
- Hedging sends parallel requests, so it doubles load. Use it only for idempotent reads.

## Health endpoints

- Liveness stays shallow so a dependency outage does not restart healthy processes.
- A deep readiness check against a slow dependency can pull healthy instances out of service. Give each check a timeout and let it respect the dependency's breaker.
- An optional dependency reports degraded and does not remove the instance.
- Cache expensive results with a short time to live. Size that staleness window, because the probe then lags the real state.
- Report not ready until startup work is done. Move slow warm up behind the readiness signal.
- Require authentication or restrict the network, and return only the minimum detail.
- Which signals the endpoints expose belongs to the adding-observability skill.

## Shutdown

- Kubernetes removes a pod from service endpoints at the same time it sends SIGTERM. Traffic can still arrive after shutdown starts.
- Add a short preStop delay or a brief pause before closing listeners.
- `terminationGracePeriodSeconds` defaults to 30 seconds. Set it longer than the delay plus the drain timeout.
- On a plain load balancer, remove the instance from rotation first, then signal shutdown, then wait for the drain.
- Requests still open when the drain timeout expires are aborted, which shows as client errors.
- Close pools after draining. Exit before the platform's kill deadline.
- Make work reentrant so the process survives sudden death.
- Set the shutdown delay and the grace period from configuration.

## LLM and agent calls

- Retry 500 and 529 with backoff. A 529 means the API is overloaded. Resolve a 409 conflict, then retry. Do not retry a 400.
- Honour `retry-after` on a rate limit 429. A spend cap 429 has no `retry-after` and keeps failing.
- The Anthropic SDK retries connection errors, rate limits, and 5xx twice by default. Configure that and add no wrapper.
- Keep non streaming requests well under 10 minutes. Stream long outputs.
- A streamed response can fail after the 200 status. Handle error events inside the stream.
- Cap agent loops with a maximum iteration count and a cost ceiling.

## State and configuration

- Keep nothing in memory or on local disk between requests except a brief single request cache.
- Store durable state in a backing service.
- Keep deploy specific values in environment variables or the project's configuration system. These are URLs, credentials, timeouts, and retry settings.
- Refuse to start when a required value is missing.
- Do not bundle settings into named environments in code.

## Tests

- Run a few fault tests under high concurrency.
- Run fault injection only outside production.
- Review and test generated resilience code, because it often misses edge cases.

## Sources

- https://learn.microsoft.com/en-us/azure/well-architected/design-guides/handle-transient-faults
- https://learn.microsoft.com/en-us/azure/architecture/patterns/health-endpoint-monitoring
- https://learn.microsoft.com/en-us/azure/architecture/patterns/idempotent-consumer
- https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction
- https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead
- https://learn.microsoft.com/en-us/dotnet/core/extensions/generic-host
- https://sre.google/sre-book/handling-overload/
- https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
- https://docs.stripe.com/api/idempotent_requests
- https://microservices.io/patterns/data/transactional-outbox.html
- https://platform.claude.com/docs/en/api/errors
- https://www.anthropic.com/engineering/building-effective-agents
