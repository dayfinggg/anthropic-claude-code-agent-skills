# Health checks and metrics

## Health checks

- Use separate liveness, readiness, and startup probes.
- A startup probe covers slow initialization.
- A health response carries only the status.
- The failure reason goes to a log.

## Metrics

- Keep metric attributes bounded.
- Streams default to 2000 series.
- Overflow lands in one series marked `otel.metric.overflow`.
- Per-user questions go to traces and logs.
- Units are seconds and bytes.
- Latency bucket boundaries and the cardinality limit settings are in [opentelemetry.md](opentelemetry.md).
