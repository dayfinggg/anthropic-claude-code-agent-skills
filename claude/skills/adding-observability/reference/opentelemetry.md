# OpenTelemetry setup and names

Versions pinned in the project win over this file.
Check the opentelemetry.io page for the language before changing a setup.
Package names and defaults move between releases.
Names for the same setting differ between releases, so read the docs for the pinned version.

## Running from an agent

- Set the `OTEL_*` variables in the command itself.
- Claude Code does not pass its own `OTEL_*` variables to Bash subprocesses.

## Stable names migration

- Move to stable HTTP or database names with `OTEL_SEMCONV_STABILITY_OPT_IN` set to `http` or `database`.
- The `/dup` values emit both sets and win over the plain values.
- Update dashboards and alerts in the same change.
- Exceptions as span events are deprecated.
- Emit them as log records with `OTEL_SEMCONV_EXCEPTION_SIGNAL_OPT_IN=logs`.
- Use `logs/dup` during a phased rollout.

## GenAI and sampling

- For `gen_ai.*` names, use the separate semantic-conventions-genai repository.
- Pin the instrumentation version for `gen_ai.*` names.
- Keep message content capture off unless the user asks.
- Head sampling decides early and is cheap.
- Large systems almost always need tail sampling in the Collector to keep useful traces.

## Logs API and signal status

- The Logs API mainly serves appender authors.
- Application code may call the Logs API directly for structured events.
- Logs are the signal that lags in some languages.
- Check opentelemetry.io/status before relying on a bridge.

## Environment variables

| Variable | Purpose |
|---|---|
| `OTEL_SERVICE_NAME` | Sets `service.name` |
| `OTEL_RESOURCE_ATTRIBUTES` | Extra resource attributes as key-value pairs |
| `OTEL_TRACES_EXPORTER`, `OTEL_METRICS_EXPORTER`, `OTEL_LOGS_EXPORTER` | Exporter per signal |
| `OTEL_PROPAGATORS` | Default is `tracecontext,baggage` |
| `OTEL_TRACES_SAMPLER` | Default is `parentbased_always_on` |
| `OTEL_SEMCONV_STABILITY_OPT_IN` | `http`, `database`, `http/dup`, `database/dup` |
| `OTEL_SEMCONV_EXCEPTION_SIGNAL_OPT_IN` | `logs` or `logs/dup` for exceptions as log records |

Without the exception opt-in, instrumentations keep emitting exceptions as span events.

## Metrics

- Latency histograms in seconds use these advisory bucket boundaries.

```
[0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10]
```

- The cardinality limit is configurable per View with `aggregation_cardinality_limit` and per MetricReader by instrument kind.
- Raise the limit only after removing unbounded attributes.
- Stable metrics are the histograms `http.server.request.duration`, `http.client.request.duration`, and `db.client.operation.duration`.

## Python

- Install `opentelemetry-distro` and `opentelemetry-exporter-otlp`. Then run `opentelemetry-bootstrap -a install` to add instrumentations for installed packages.
- Start with `opentelemetry-instrument python app.py`.
- `OTEL_PYTHON_LOG_CORRELATION=true` adds trace context to `logging` records.
- From OpenTelemetry Python 1.40.0 `OTEL_PYTHON_LOG_AUTO_INSTRUMENTATION` configures the logging handler automatically.
- Older versions used `OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED`.
- A handler added by hand then duplicates records.
- Exclude noisy instrumentations with `OTEL_PYTHON_DISABLED_INSTRUMENTATIONS`, as in `redis,kafka`.
- Import stable names from `opentelemetry.semconv.attributes`. The older `SpanAttributes` class holds pre-stable names such as `http.method`.

## JavaScript and TypeScript

- Install `@opentelemetry/api` and `@opentelemetry/auto-instrumentations-node`. Start Node with `--require @opentelemetry/auto-instrumentations-node/register`.
- All supported instrumentations are enabled by default. Narrow them with `OTEL_NODE_ENABLED_INSTRUMENTATIONS` or `OTEL_NODE_DISABLED_INSTRUMENTATIONS`.
- Keep pino or winston. Their instrumentations add `trace_id`, `span_id`, and `trace_flags`. Pino log sending needs pino 7 or later.
- Adding `@opentelemetry/winston-transport` while the instrumentation also sends logs duplicates every record.
- Wrap manual work in `tracer.startActiveSpan(name, span => ...)` and end the span in `finally`. On failure call `span.setStatus({ code: SpanStatusCode.ERROR })`.
- Import stable names from `@opentelemetry/semantic-conventions`, as in `ATTR_HTTP_ROUTE`.
- Do not import `/incubating`, because it is not bound by semantic versioning.
- Copy the few unstable definitions you need.

## Java

- Start with `-javaagent:path/to/opentelemetry-javaagent.jar`, or set it in `JAVA_TOOL_OPTIONS`.
- Keep SLF4J with Logback or Log4j. Bridge with `opentelemetry-logback-appender-1.0` or `opentelemetry-log4j-appender-2.17`.
- The Logback appender artifact is alpha. Pin its version and verify the class name after each upgrade.
- Structured fields use the SLF4J 2 fluent API, as in `logger.atInfo().setMessage("Order placed").addKeyValue("orderId", id).log()`.
- Manual spans use `tracer.spanBuilder(name).startSpan()` and `span.makeCurrent()` in try-with-resources. On failure call `span.setStatus(StatusCode.ERROR)` and end the span in `finally`.
- Import stable names from `io.opentelemetry.semconv`. Check the artifact version first.

## Go

- Use instrumentation libraries from `go.opentelemetry.io/contrib`, such as `otelhttp.NewHandler(mux, "/")`.
- Register providers once with `otel.SetTracerProvider`, `otel.SetMeterProvider`, and `global.SetLoggerProvider`. Set `otel.SetTextMapPropagator`. Call every provider's `Shutdown` on exit.
- Go has no user-facing logs API. Keep `slog`, zap, logrus, or logr with the matching bridge, such as `otelslog.NewLogger(name)`.
- Log with context methods such as `logger.InfoContext(ctx, msg, "key", value)`, so the bridge finds the span.
- `span.SetStatus(codes.Error, msg)` is required. `span.RecordError(err)` does not set the status.

## .NET

- Add `OpenTelemetry.Extensions.Hosting`, instrumentation packages such as `OpenTelemetry.Instrumentation.AspNetCore`, and `OpenTelemetry.Exporter.OpenTelemetryProtocol`.
- Configure with `builder.Services.AddOpenTelemetry().ConfigureResource(...).WithTracing(...).WithMetrics(...)`.
- Keep `ILogger` and add `builder.Logging.AddOpenTelemetry(logging => logging.AddOtlpExporter())`.
- Log with message templates, as in `logger.LogInformation("Order {OrderId} placed", orderId)`. Never interpolate strings into the message.
- Microsoft says `[LoggerMessage]` source generation gives the best performance. New hot-path code uses it instead of `LoggerMessage.Define`.
- Spans come from an `ActivitySource` with `StartActivity(name)` inside `using`. On failure call `activity?.SetStatus(ActivityStatusCode.Error)`.

## Rules for stable names

- Server spans set `http.route` as a low cardinality template. They set `error.type` when the request ended in error.
- Client spans set status Error for 4xx. Server spans leave status unset for 4xx.
- `error.type` falls back to `_OTHER` when the instrumentation has no custom value.
- Collect `db.query.text` only when the query is parameterized or its literals are sanitized.
- Leave `db.query.parameter.<key>` off by default, because values may hold personal data.
- Set `http.request.resend_count` on retries.
