# Remote execution and cancellation

## Allocate a deadline, not disconnected timeouts

When a request calls dependencies, bound the complete operation and its attempts, including connection setup, DNS, TLS, response reading, and retry delays where the client's controls cover them, and inspect the client's actual semantics, because a socket inactivity timeout may neither bound the whole request nor abort it. Check cold connections, slow response bodies, and delay before a downstream call starts, and with a controllable clock verify that attempts and waiting cannot exceed the logical operation's budget.

<example>
A Go inventory client sets the dialer timeout to 3 seconds and `http.Client.Timeout` to 20 seconds, so a response that trickles bytes cannot hold a request goroutine past 20 seconds.
</example>

Start deadline values from the existing latency objective, downstream measurements, network conditions, and acceptable false timeouts, and add a network allowance for remote clients instead of copying a same-region timeout into an internet integration, because too-short deadlines create false failures and retry traffic, and too-long deadlines retain scarce resources.

<example>
A partner bank's transfer-status API with a 40-second p99 does not inherit the 5-second timeout that suits the internal pricing service, so the call gets a 90-second budget.
</example>

Propagate the remaining budget with the framework's supported deadline mechanism, leave enough time to return the outcome, and check whether deadline propagation is automatic in the target language, because restarting the original timeout at every hop lets nested calls outlast what the caller will still wait for.

<example>
A Node.js handler with a 30-second budget that spent 12 seconds on its first call passes `AbortSignal.timeout(16_000)` to the second, which keeps 2 seconds to answer.
</example>

## Retry only when safety and usefulness both hold

When a failure appears transient, establish whether the operation is safe to repeat or provably was not applied, and apply the service's documented failure semantics instead of a universal status-code allowlist, because an HTTP method name or a network timeout does not establish a provider's side-effect contract, and invalid input, cancellation, and permanent quota exhaustion do not become recoverable through repetition.

<example>
A timed-out SMS gateway `POST /messages` may already be delivered, so the notification service records it as uncertain and does not resend.
</example>

Inspect SDK, proxy, worker, and application retry policies together, choose one logical retry owner where feasible, bound attempts, elapsed time, and aggregate retry traffic, use backoff with jitter when clients could synchronize, and reuse existing tested policy mechanisms, because stacked policies multiply attempts and synchronized clients turn a recovery into a second outage. Stop when attempts no longer improve availability, and introduce a circuit breaker only for a demonstrated need, because it adds state and recovery behavior. Check persistent throttling, nested retry policies, cancellation during backoff, and recovery under many simultaneous clients, and count downstream attempts, not only top-level calls.

<example>
The payment SDK's built-in retry is set to `max_network_retries = 0` because the job queue already makes three attempts with jittered backoff, so one failing call causes three provider attempts instead of twelve.
</example>

For HTTP `Retry-After`, support the documented delay or date form, and stop the attempt when the suggested wait exceeds the remaining deadline, because sleeping past the deadline wastes the request and retrying at once ignores the server's instruction.

<example>
A `429` with `Retry-After: 45` while the webhook has 8 seconds left ends the attempt and reschedules the job 45 seconds later instead of sleeping inside the request.
</example>

## Match cancellation to the operation's lifetime

When work exists only to answer the current request, propagate cancellation into spawned work and release its resources, and inspect CPU loops, blocking calls, readers, and child tasks, because a cancellation signal does not necessarily interrupt application computation, and the language's handler and downstream client may not cooperate. Stopping promptly saves resources but may leave an uncertain remote result. Check cancellation before dispatch, during a downstream wait, after remote success, and during result persistence, and confirm resource release and a stable terminal state.

<example>
An ASP.NET Core action streaming a large report passes `HttpContext.RequestAborted` to the database query and the writer, so closing the browser tab stops the query instead of letting it run to completion unread.
</example>

When a durable job has already been accepted, let its submitter's disconnect leave it running, use the explicit business cancellation operation if one exists, and resolve its race with commitment, because cancellation cannot undo an already completed external effect, and a compensating action is a separate authorized operation and not a local rollback. Keeping durable work alive preserves the acceptance contract but requires status tracking. Report cancellation as a request until the terminal state is known, because it is not proof that a charge, send, or update did not occur.

<example>
A user presses Cancel on a queued `bulk_price_update` after the worker already applied the changes, so the job ends `completed` and the API answers that it was too late instead of reporting `cancelled`.
</example>
