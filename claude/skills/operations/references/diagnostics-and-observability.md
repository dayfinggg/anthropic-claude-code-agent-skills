# Diagnostics and observability

## Diagnose one boundary at a time

When behavior is wrong after a build, release, or configuration change, establish the expected and actual results, onset, running revision, and effective configuration, and separate installation, build, deployment, startup, dependency access, saturation, and application correctness, because the repository state may differ from what runs in production. Check the actual failing path before applying a remembered fix.

<example>
An `H10 App crashed` error from the Heroku router right after a deploy is split into three checks. These are `heroku ps -a booking-prod` for the dyno state, whether the app listens on the `PORT` environment variable and not a fixed port, and the tail of `heroku logs -a booking-prod --num 100`, so the application code is not blamed first.
</example>

When forming a hypothesis, choose a low-risk check that could disprove it, compare evidence from the relevant process, network location, and credentials without exposing them, and prefer bounded read-only queries before active experiments, because a check from your workstation may test a different route than the one the failing process uses, and a recent change is a lead and not proof of cause.

<example>
A container that cannot reach an API is tested from inside it with `docker exec inventory-api curl -sS -o /dev/null -w "%{http_code}" https://api.example.com/health`, since the same call from the laptop takes another route.
</example>

When users are affected and a mitigation is authorized and understood, prefer it over a prolonged root-cause analysis, and capture useful evidence first when feasible, because a restart can clear symptoms while destroying diagnostic state. Check the user-visible improvement and keep the mitigation distinct from a proven cause, and enable debug logging for one component for a bounded time instead of globally, because global debug logging adds load and records data nobody planned to keep.

<example>
Before `sudo systemctl restart booking-api` on a hung JVM service, save a thread dump with `jcmd <pid> Thread.print > ~/booking-threads.txt`, restart, and then confirm that requests succeed again without calling the restart the cause.
</example>

## Measure the user outcome

When defining or repairing an SLI, identify the user journey, good event, eligible event, measurement point, and time window, and include correctness, latency, freshness, or durability where they represent the actual promise, because existing logs are cheaper than new probes but miss failures that occur before a request reaches the server. Check the numerator and denominator against known successful and failed cases.

<example>
The booking SLI counts `POST /bookings` entries in the load balancer's access log with status below 500 and under 2 seconds, and a request sent while `booking-api` is stopped must appear as a bad event.
</example>

When changing an SLO, keep the approved target and error-budget policy unless changing them is part of the request, because a stricter target costs engineering effort and release freedom while an easier one can hide a regression users still notice. Check the target's owner, measurement window, exclusions, and actual query before using it as a deployment gate.

<example>
Before a `99.5%` availability target is wired into the deploy script as a gate, confirm who approved it and run its query against recent data to see what it would have blocked.
</example>

## Alert on an actionable risk

When an existing alert is noisy or slow, evaluate its precision, missed failures, detection time, and reset time, and consider supported multiwindow burn-rate alerts for an established SLO, choosing burn-rate thresholds from the SLO's error budget and validating them against the service's own history, because the right thresholds depend on traffic and error budget. Check historical failure and recovery periods, zero traffic, missing series, and low traffic, since a longer duration can hide intermittent severe failures instead of improving confidence.

<example>
A `5xx` alert that fires on a single failed request during a quiet night is replayed against stored metrics from known outages and quiet nights, including a stretch with zero traffic, before its threshold or duration changes.
</example>

For low-traffic services, keep a small sample distinct from good reliability, and when synthetic traffic is added keep its identity visible, use safe test data, and exclude it from the real-user denominator, because mixing it in can hide real-user errors. Check that the measurement still represents the users it claims to protect.

<example>
A booking API's health probe sends requests with `User-Agent` set to `synthetic-check` every minute, and the SLI query filters that agent out so ten real failures among forty real requests are not diluted by 1,440 probe requests a day.
</example>

## Add the smallest useful instrumentation

When a demonstrated blind spot requires instrumentation, reuse the existing logger, SDK, collector, field names, and alert routes, correlate logs and traces through existing identifiers, and check the installed SDK's semantic conventions before changing names, because more detail helps diagnosis but raises cost and can break downstream queries. Check real emitted records and the affected dashboard or alert.

<example>
A Go service that logs JSON with `slog` adds a `duration_ms` attribute next to the existing `request_id` and not a second logging library, and `tail -n 5 /var/log/inventory/app.log` on the server shows the new field before any dashboard query is edited.
</example>

When adding metric dimensions, estimate the active combinations and choose bounded attributes, keeping raw URLs and request IDs in logs or traces and not in metric labels, because every distinct value creates a new series. Size required per-tenant metrics deliberately with overflow checks, since raising a cap protects a query while increasing memory and backend cost, and check that filtered totals stay trustworthy when the installed SDK overflows.

<example>
The route template `/orders/{id}` is a metric label, while the raw `/orders/84213` and the `order_id` appear only in the log line.
</example>

When telemetry may contain sensitive data, avoid collecting it instead of relying only on redaction, and inspect automatic instrumentation, exceptions, headers, bodies, and baggage, because hashing predictable identifiers is not reliable anonymization, and less data limits retrospective investigation but prevents disclosure. Exercise success and failure paths with harmless sentinel values and inspect the output.

<example>
After one login attempt with the wrong password `sentinel-pass-123` and one successful login, `Select-String -Path D:\logs\catalog\*.log -Pattern 'sentinel-pass-123'` on the server returns nothing.
</example>

## Check health according to its consumer

When changing a probe, inspect the platform's restart, routing, and startup behavior first, and keep process liveness separate from readiness to serve useful work, because a dependency-sensitive liveness probe turns a shared outage into restart loops, while a readiness check that never touches required work routes traffic to unusable instances. Check delayed startup, dependency failure, recovery, and shutdown under the actual platform contract.

<example>
A `/healthz` liveness endpoint answers 200 from the process alone, so a PostgreSQL outage does not restart the API in a loop, while a separate `/ready` endpoint runs `SELECT 1` and is the one the load balancer routes by.
</example>
