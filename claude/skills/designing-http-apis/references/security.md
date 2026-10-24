# Security by OWASP API Security Top 10 2023

- API1 Object level authorization. Authorize every object access.
- API2 Authentication. Use a standard scheme and validate tokens on every request.
- Rate limit login and token endpoints.
- API3 Property level authorization. Bind requests to schemas listing writable fields.
- Bind responses to schemas listing visible fields, so clients cannot set role, owner, or price.
- API4 Resource consumption. Limit body, page, and upload sizes and rate limit.
- A body over the size limit returns 413.
- API5 Function level authorization. Authorize every function and deny privileged endpoints by default.
- API6 Sensitive business flows. Protect sign-up, checkout, booking, and posting per account or device.
- API7 Server side request forgery. Pass client-supplied URLs such as webhooks through an allow-list.
- API8 Security misconfiguration. Serve HTTPS only with HSTS.
- Allow CORS only for explicit origins.
- Turn off debug endpoints and default credentials.
- API9 Improper inventory. List every deployed version, host, and endpoint in the spec.
- Retire old versions.
- API10 Unsafe consumption of APIs. Validate third-party responses like client input.
- Give third-party calls timeouts and size limits.
- Take ownership from the session, never from client-supplied IDs.
