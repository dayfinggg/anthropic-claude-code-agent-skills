---
name: designing-http-apis
description: Designs and reviews HTTP JSON APIs, REST endpoints, RFC 9457 errors, pagination, idempotency keys, versioning, OpenAPI. Use for routes, controllers, schemas, status codes, or API security.
---

# Designing HTTP APIs

The project's API conventions or style guide win over this skill.

## Rules

- Controllers validate input, call one use case, and map the result.
- Keep request and response schemas separate from entities and database models.
- Paths are plural kebab-case nouns, such as `/orders/{orderId}/items`. Nest one level at most.
- Use one JSON field casing across the API, usually camelCase.
- Return 201 with `Location` on create and 202 with a status link for async work.
- Return 422 for a well-formed body that fails validation and 400 for malformed syntax.
- The 400 and 422 split is a convention, so follow the project's choice.
- Return 404 when the caller may not know the resource exists.
- Return 405 with `Allow` and 429 with `Retry-After`.
- Do not require the RateLimit headers, because they are still an IETF draft.
- Errors use RFC 9457 `application/problem+json`.
- Never return stack traces, SQL, or other users' internal IDs.
- Timestamps use RFC 3339 with a zone, preferably UTC.
- IDs are strings, so JavaScript clients keep precision.
- Money is integer minor units or a decimal string plus an ISO 4217 code, never a float.
- Enums are stable strings that clients expect to grow.
- Paginate every growing collection from the first release, using cursors and a maximum page size.
- Accept `Idempotency-Key` on creating POST where a duplicate costs money or data.
- Change additively. Ship a breaking change as a new version beside the old one.
- Authorize every object access and every function.
- Take ownership from the session, never from client-supplied IDs.

## References

- `references/errors-and-patch.md` for the problem details example, PATCH formats, and QUERY.
- `references/pagination-and-retries.md` for pagination, idempotency keys, deprecation headers, and ETags.
- `references/security.md` for the OWASP API Security Top 10 2023 checklist.
- `references/agents-and-contract.md` for APIs that agents call and for OpenAPI.
