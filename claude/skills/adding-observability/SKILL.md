---
name: adding-observability
description: Adds and reviews logs, metrics, traces, and health checks with OpenTelemetry. Use for logging, tracing, monitoring, OTEL setup, audit logs, log injection, personal data in logs, or error reporting.
---

# Adding observability

The project's logger, telemetry setup, and field names win over this skill.

## Names

- Agents invent attribute, environment variable, and package names.
- Confirm each name against the installed version and the official docs.
- Run the app with a console exporter and read its output.

## Traces

- Use an instrumentation library first. Write manual spans only for what it cannot see.
- Set up the SDK once in the composition root, always with `OTEL_SERVICE_NAME`.
- Use stable semantic convention names from the language's semconv package.
- Put custom attributes under the company's reverse domain, as in `com.acme.order.tier`, never under `otel.`.
- Name spans by route template or operation and target, as in `GET /orders/{orderId}` and `SELECT orders`.
- On failure set status Error and `error.type` to the exception class.
- Leave status unset on success, and on server spans for 4xx.

## Logs

- Bridge the project's logger with its OpenTelemetry appender, unless auto-instrumentation already does, which doubles records.
- Write a constant message with named fields. Bridges already inject trace ID and span ID.
- Write to stdout and leave rotation to the platform.
- Log an error once, at the boundary that handles it. Code that adds context rethrows without logging.

## Data

- Secrets, credentials, session IDs, card data, and personal data stay out of telemetry.
- Telemetry means logs, spans, baggage, metric attributes, and exception messages.
- Do not log bodies, header maps, or query values. Redaction is only a safety net.
- Baggage crosses service boundaries by default, so it never carries personal data.
- Pass untrusted values through a structured encoder. In plain text, replace CR, LF, and delimiters first.
- Keep metric attributes bounded.

## Reference files

- [reference/opentelemetry.md](reference/opentelemetry.md), read when setting up telemetry, naming, or writing spans.
- [reference/security-logging.md](reference/security-logging.md), read when logging input, login, or admin actions.
- [reference/health-and-metrics.md](reference/health-and-metrics.md), read when adding health checks or metrics.
- [examples.md](examples.md), read before writing a manual span or security event.
