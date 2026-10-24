# Hardening, failure handling, and reviews

The rules follow OWASP Proactive Controls 2024. Findings cite OWASP Top 10 2025 and CWE Top 25 2025.

## Contents

- Other skills
- Configuration and headers
- Failure handling
- Resource limits
- Packages and LLM output
- Tests and reviews
- Rule mapping

## Other skills

- SQL and NoSQL injection go to working-with-databases.
- Endpoint rules go to designing-http-apis.
- Model calls, prompt injection, and agent permissions go to securing-llm-features.
- Packages and CI go to managing-dependencies-and-ci.
- Logging goes to adding-observability.
- Timeouts, retries, and rate-limit policy go to building-resilient-services.

## Configuration and headers

- Grant least privilege everywhere.
- Serve HTTPS only.
- Send `X-Content-Type-Options` with the value `nosniff`.
- Set `Referrer-Policy` and `Permissions-Policy` explicitly.
- Send a CSP with HTML responses.
- Start HSTS with a short `max-age` and raise it once HTTPS works on every host.
- A long HSTS value locks users out after a certificate fault.
- An invalid security setting stops startup.

## Failure handling

- An error in a policy lookup also denies the request.
- Run multi-step changes in one transaction, or undo them with compensating actions.
- Keep error details in the logs.
- Log failed logins and access denials.
- Answer as if a forbidden record does not exist.
- Treat ownership as untrusted client input.

## Resource limits

- Cap decompressed size, collection length, and loop count as well.
- Give every query a timeout.
- Rate-limit expensive operations.
- Take numbers from the project's configuration.
- Take policy from building-resilient-services.

## Packages and LLM output

- Follow managing-dependencies-and-ci for every package change.
- Validate and encode LLM output like any request field before it reaches a sink.

## Tests and reviews

- Review every line you generate before finishing.
- Test denied access to another user's object and to privileged functions.
- Test malicious input at each sink.
- Test rollback after a failure halfway.
- Run the project's security linters, static analysis, and secret scanning when they exist.
- Run `/security-review` on the branch before finishing.
- Put rules that must hold every time in a hook or CI check, not in prose.
- In a security review, report each finding with its location, OWASP category, CWE, and a concrete fix.
- List the most severe finding first.

## Rule mapping

- Input validation maps to C3, A05, and CWE-20.
- Sinks map to C3, A05, CWE-79, CWE-78, CWE-77, and CWE-94.
- Authorization maps to C1, A01, CWE-862, CWE-863, CWE-639, and CWE-284.
- Authentication and CSRF map to C7, A07, A01, CWE-306, and CWE-352.
- Secrets map to C2 and A07 for CWE-798.
- Crypto maps to A04 for CWE-327 and CWE-330.
- Secure configuration maps to C5, A02, CWE-489, and CWE-942.
- Failing closed maps to C3, A10, A09, CWE-636, CWE-209, and CWE-200.
- Resource limits map to A10 and CWE-770.
- Packages map to C6 and A03.
- LLM output maps to A05 and LLM05:2025 Improper Output Handling.
