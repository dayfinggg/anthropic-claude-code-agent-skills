# Security logging

This file draws on the OWASP Logging Cheat Sheet, OWASP A09:2025, and the OpenTelemetry page on sensitive data.
The project's logging policy and legal requirements win.
Log only events this application can detect and someone will act on.
Route suspicious events to an alert, because a log nobody reads detects nothing.

## Events to log

- Input and output validation failures.
- Authentication successes and failures, and authorization failures.
- Session management failures.
- Application errors.
- Start-up and shut-down of the application and of logging itself.
- Higher-risk functionality, such as user administration, administrator rights, and data export.
- Legal opt-ins, such as consent to use personal data.
- Suspicious business logic activity.

When the project has no event naming scheme, use the OWASP Application Logging Vocabulary.
Examples are `authn_login_fail` and `authz_fail`.
It is a proposal with no formal status.
It defines no security flag field.

## Event fields

| Question | Fields |
|---|---|
| When | Event time in ISO 8601 UTC and the correlation ID |
| Where | Application name and version, host, and URL and method or code location |
| Who | Source address and the user or machine identity |
| What | Event type, severity, a description, and optionally action, object, result, and reason |

Keep server clocks synchronized so events from several services line up.

## Alerting

- Alert when the application or its users behave suspiciously.
- Ship logs in a format the log management system can consume.
- Encode log data so it cannot inject into the logging or monitoring system.

## Data beyond the SKILL.md list

- Source code stays out of telemetry.
- Scan agent-written logging and config code for secrets before merge.
- Hashes of small input spaces can be reversed.
- Truncate or group instead, as in dropping the last IPv4 octet.
- Parameterized logging alone does not stop CR and LF injection in Java.
- Commercially sensitive information and data the user opted out of stay out.
- File paths and internal network names reveal the system, so handle them with care.
- When code cannot be fixed at once, the Collector can clean attributes.
  - The attributes processor deletes or hashes them.
  - The filter processor drops spans or metrics.
  - The redaction processor keeps an allowlist.
  - The transform processor rewrites values.

## Logging failures

- A failure to log or export never stops the application and never leaks information to the caller.
- Logging cannot exhaust disk or database transaction log space.
- Actions driven by log data, such as account lockouts, cannot be abused to deny service to other users.

## Tests

- A logged value with CR and LF produces exactly one record holding the neutralized value.
- A request carrying a password, token, or session cookie produces output with none of them.
- Each new security event is emitted with its when, where, who, and what fields.
- The application keeps serving when the log destination or exporter fails.
