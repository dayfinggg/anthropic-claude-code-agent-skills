# Resilience libraries

The project's library comes first. A new one goes through the managing-dependencies-and-ci skill. The current docs give the exact API.

## Retry defaults

| Library | Default retry delay |
| --- | --- |
| .NET standard HTTP handler | Exponential with jitter, 3 retries, 2 s base delay |
| Plain Polly retry | Constant, no jitter, 3 retries, 2 s delay |
| Resilience4j retry | Constant wait of 500 ms |
| failsafe-go retry | No delay |
| Cockatiel ExponentialBackoff | Decorrelated jitter |

Change any constant or missing delay to exponential backoff with jitter for background work.

## C# and .NET

- Use Polly pipelines built with `ResiliencePipelineBuilder`. Strategies are Retry, Circuit Breaker, Timeout, Rate Limiter, Fallback, and Hedging. Docs are at https://www.pollydocs.org/.
- For `HttpClient` use `Microsoft.Extensions.Http.Resilience` and `AddStandardResilienceHandler()`.
- The handler order from outermost is rate limiter, total timeout, retry, circuit breaker, then attempt timeout.
- The handler retries HTTP 500 and above, 408, 429, `HttpRequestException`, and `TimeoutRejectedException`. It does not retry `BrokenCircuitException`.
- Bind its options from configuration with the `IConfigurationSection` overload or `.Configure(...)`. Add one resilience handler per client.
- `options.Retry.DisableForUnsafeHttpMethods()` stops retries for `POST`, `PATCH`, `PUT`, `DELETE`, and `CONNECT`.
- The hedging handler runs requests in parallel. Use it only for idempotent reads.
- Plain Polly retry handles every exception except `OperationCanceledException` by default. That includes `BrokenCircuitException`. Set `ShouldHandle` explicitly.

```csharp
var retry = new RetryStrategyOptions
{
    MaxRetryAttempts = settings.RetryCount,
    Delay = settings.RetryDelay,
    BackoffType = DelayBackoffType.Exponential,
    UseJitter = true,
    ShouldHandle = new PredicateBuilder()
        .Handle<HttpRequestException>()
        .Handle<TimeoutRejectedException>(),
};
```

- A Polly timeout throws `TimeoutRejectedException`, not `TimeoutException`.

## Java

- Use Resilience4j 2, which requires Java 17. Modules are `resilience4j-circuitbreaker`, `-retry`, `-bulkhead`, `-ratelimiter`, `-timelimiter`, and `-cache`. Docs are at https://resilience4j.readme.io/docs/getting-started.
- `Decorators.ofSupplier(...).withCircuitBreaker(...).withRetry(...).decorate()` needs `resilience4j-all`.
- The Spring Boot annotations put Retry outermost around CircuitBreaker, RateLimiter, TimeLimiter, and Bulkhead.
- `RetryConfig` waits a fixed `waitDuration`. Set an `intervalFunction` built from `IntervalFunction.ofExponentialBackoff` with `ofRandomized`.
- List transient exceptions in `retryExceptions` and permanent ones in `ignoreExceptions`.
- Spring Boot enables graceful shutdown by default. Set the shutdown phase timeout from configuration.

## Python

- Use Tenacity for retry.

```python
@retry(
    stop=stop_after_attempt(settings.retry_attempts),
    wait=wait_random_exponential(multiplier=settings.retry_base_seconds),
    retry=retry_if_exception_type(TransientError),
    reraise=True,
)
```

- Without `reraise=True` the last failure surfaces as `RetryError`.
- Tenacity has no circuit breaker. Use the project's breaker or vet a maintained library first.
- `requests` never times out unless `timeout` is passed. Pass one value or a `(connect, read)` tuple. Neither is a wall clock limit on the whole call.
- `httpx` times out after 5 seconds of network inactivity by default. Set the timeouts explicitly anyway.
- For a true deadline across awaits use `asyncio.timeout`, added in Python 3.11.

## TypeScript and JavaScript

- Use Cockatiel with `retry`, `circuitBreaker`, `timeout`, `bulkhead`, and `fallback`. Combine them with `wrap`, outermost first. Docs are at https://github.com/connor4312/cockatiel.
- Pass `handleWhen(isTransient)` to `retry` and `circuitBreaker` so only transient errors count.
- `retry` takes `{ maxAttempts, backoff: new ExponentialBackoff() }`.
- `circuitBreaker` takes `{ halfOpenAfter, breaker: new ConsecutiveBreaker(n) }`.
- `timeout(ms, TimeoutStrategy.Aggressive)` cancels the call when time runs out.
- `execute` passes `{ signal }`. Pass that signal to `fetch` or the client so a timeout cancels the request.
- An open breaker throws `BrokenCircuitError`. An aggressive timeout throws `TaskCancelledError`. A full bulkhead throws `BulkheadRejectedError`.
- With plain `fetch` pass `signal: AbortSignal.timeout(ms)`. Combine signals with `AbortSignal.any()`.

## Go

- Use failsafe-go from `github.com/failsafe-go/failsafe-go`. Policies are Retry, Circuit Breaker, Rate Limiter, Timeout, Fallback, Hedge, Bulkhead, and Cache. Docs are at https://failsafe-go.dev/.
- Build a retry with `retrypolicy.NewBuilder[T]()`, `HandleErrors(...)`, `WithBackoff(delay, maxDelay)`, `WithJitterFactor(...)`, and `WithMaxRetries(...)`.
- Run it with `failsafe.With(retryPolicy, circuitBreaker, timeout).Get(fn)`. The first policy is outermost, so list retry first.
- A retry policy has no delay by default, so always set a backoff.
- Set breaker thresholds and delay explicitly from configuration. An open breaker returns `circuitbreaker.ErrOpen`.
- An `http.Client` with a zero `Timeout` never times out. `Timeout` covers connecting, redirects, and reading the body.
- On `http.Server` set `ReadHeaderTimeout`, `ReadTimeout`, and `WriteTimeout`. A zero value means no timeout.
- `Server.Shutdown(ctx)` closes listeners and waits for active connections to go idle. Give `ctx` the drain timeout.
