---
name: web-security
description: Method and framework knowledge for finding exploitable vulnerabilities in web apps and APIs and judging if a suspected one is real. Adds to the built-in /security-review a reachability standard and traps in Django, DRF, FastAPI, Express, Next.js, Rails, Laravel, Symfony and Spring. Use for a security review of code, a PR or a diff, for IDOR, tenant leaks, SSRF, CSRF, injection or secrets in logs, and to triage a scanner or bug-bounty finding.
---

# Web application security review

This skill covers how to find vulnerabilities in web application and API code that an attacker can actually reach, and the framework behavior that hides them. Its vulnerability classes follow the OWASP Top 10:2025 and the OWASP API Security Top 10:2023, and it cites requirements from OWASP ASVS 5.0.0. Read the framework versions from the lockfile. Where a framework's installed release is newer, its own security documentation is right about defaults.

## References

Each file below holds what this page only names. Read it in full with the Read tool before the first step its condition describes, also when that step comes late in a long task or after a compaction.

- [references/access-control.md](references/access-control.md): read when reviewing authorization, IDOR or BOLA, tenant isolation, roles, mass assignment, or any endpoint that takes an object ID.
- [references/frameworks.md](references/frameworks.md): read when the code uses Django, DRF, FastAPI, Flask or Jinja, Express, Next.js, Rails, Laravel, Symfony, Spring or Go templates, before judging whether the framework already blocks a suspected bug.
- [references/browser-defenses.md](references/browser-defenses.md): read when a fix or a mitigation involves CSP, Trusted Types, HTML sanitizing, Subresource Integrity, cookie attributes, origin checks, cross-origin headers or passkeys, or when judging whether such a defense actually blocks a finding.
- [references/defaults-and-sinks.md](references/defaults-and-sinks.md): read when reviewing configuration, error handling around security checks, logging, tracing, error reporting, caching, or how objects holding credentials are serialized.

## Check first

- Establish exposure before judging severity: who can reach the code (internet, other internal services, customer SDKs, a local operator). Look in ingress, gateway and deployment config, and ask if it is unclear.
- Name the actors: anonymous caller, member of another tenant, lower role in the same tenant, a webhook or SDK payload. Most access-control bugs need a logged-in attacker.
- Find how this codebase enforces authorization: middleware, base controllers, decorators, policies and guards, the framework's default permission setting, scoped query helpers or managers, and every escape hatch that skips them.
- Read `SECURITY_MODEL.md` or a threat model if one exists, from the base revision when reviewing a PR. Only controls that block count as enforcement. A control that only logs, alerts or emits a metric is monitoring.
- Check which framework protections are on: template auto-escaping, CSRF middleware, ORM parameterization, secure cookie flags, the trusted proxy setting.

## Method

- Research the whole repository, not only the target the user named. The other half of a bug (the sink, the missing check, the caller) is often outside the diff. A function that returns a built SQL string, command, URL, path or template has its sink in its callers, so read them.
- Report a finding only when all three hold: the input is attacker-controlled, the path is reachable in production, and no upstream control stops it. A dangerous pattern with an unconfirmed source goes under "needs verification" with the exact question. Theoretical and defense-in-depth items are left out.
- Attacker-controlled: query, body, path segments, most headers (including `Host` and `X-Forwarded-For` unless a trusted proxy overwrites them), unsigned cookies, uploaded file names and contents, webhook and queue payloads from outside, and database rows written by other users. Not attacker-controlled: settings, environment variables, constants, admin-only configuration.
- Restate each suspected bug in one sentence (actor, entry point, root cause, impact) before analysing it.
- Requiring login lowers severity, it does not remove an access-control finding.
- Test files, dead code, examples and fixtures are out of scope unless they ship. Check that a flagged route is registered and not behind a disabled flag before reporting it.

## Findings and fixes

- Give each finding the actor, the route and method, a concrete request, the code path with `file:line`, the impact, and its OWASP ID (`A01:2025`, `API1:2023`). Pick the lower severity when reachability depends on an unproven precondition.
- Use the repository's severity scale if it has one, otherwise critical, high, medium, low with the condition that raises or lowers each.
- A fix must enforce in code: deny, filter or raise. A comment such as "caller must check permissions" is not a fix.
- The regression test for an access-control fix sends the request as the wrong actor and asserts both the denial and that none of the data appears in the response.

## Classes to cover

- Broken access control (`A01:2025`, `API1`, `API3`, `API5:2023`): object, property and function level checks, tenant isolation, mass assignment, and CSRF and SSRF (`API7:2023`), which OWASP 2025 files under A01. Most real findings are here.
- Injection (`A05:2025`): SQL including identifiers, OS commands and argv flags, templates, paths.
- Exceptional conditions (`A10:2025`): fail-open defaults, catch-all handlers that allow, errors that leak internals.
- Misconfiguration (`A02:2025`, `API8:2023`): permissive CORS, cookies without `Secure` or `HttpOnly`, debug modes, XML parsers that resolve external entities.
- Authentication (`A07:2025`, `API2:2023`): unverified tokens, hard-coded fallback secrets, trust in a client IP taken from a spoofable header, reset links built from the `Host` header.
- Resource and business-flow abuse (`API4`, `API6:2023`): missing limits, read-then-write races on quotas, codes and balances.
- Secrets in logs, traces and responses (`A09:2025`, `API3:2023`).
- Outgoing calls to third-party APIs whose responses are trusted without validation (`API10:2023`), and undocumented old API versions or hosts still serving traffic (`API9:2023`).
- Software supply chain (`A03:2025`) and build integrity (`A08:2025`) are reviewed with concise:github-actions and concise:containers-iac.

## Gotchas

- CORS with `Access-Control-Allow-Origin: *` and credentials is refused by browsers, so it is not a credential leak. The exploitable patterns, each with `Access-Control-Allow-Credentials: true`, are reflecting the request `Origin`, matching origins by suffix or loose regex (`endsWith('example.com')` also matches `evilexample.com`), and allowing the `null` origin, which sandboxed iframes send.
- "JSON only" endpoints can still be forged cross-site. Forms and `fetch` send `text/plain`, `application/x-www-form-urlencoded` or `multipart/form-data` without a preflight, so a server that parses the body whatever the `Content-Type` is open to CSRF when its session cookie is not `SameSite=Lax` or `Strict`. State changes on GET stay forgeable even with `Lax`, because top-level navigations send the cookie.
- A cookie without a `SameSite` attribute is not safe either: browsers that default it to `Lax` still send it on cross-site POST for two minutes after it was set, and other browsers do not default to `Lax` at all.
- A Content Security Policy lowers the severity of an XSS finding only when it is enforced and built on nonces or hashes with `'strict-dynamic'`. A `Report-Only` header blocks nothing, and host allowlists in `script-src` fall to open redirects and JSONP on the allowed host. A Trusted Types policy that returns its input unchanged protects nothing.
- `message` event handlers without an origin check, with `startsWith` or `includes` on `event.origin`, or that accept the string `"null"` take commands from any page that can frame or open the app.
- Open redirect checks with `startsWith('/')` let `//evil.example` and `/\evil.example` through, because browsers treat `\` as `/`. Resolve the target with a URL parser against your own origin and compare origins.
- `os.path.join` and `pathlib` drop the base when the user part is absolute. `startsWith(base)` without a trailing separator accepts `/srv/app-evil`. `path.resolve`, `normpath` and `filepath.Clean` are lexical and follow no symlinks. Resolve both sides with `fs.realpathSync`, `os.path.realpath` or `filepath.EvalSymlinks`, then compare against the base plus separator. Archive extraction needs the same check for every entry.
- SSRF allowlists checked on the hostname before DNS resolution fall to DNS rebinding and redirects. Check the IP actually connected to, re-check every redirect hop or turn redirects off, and block link-local metadata addresses (169.254.169.254) plus IPv6 and numeric encodings of internal addresses. Input that sets only the path on a fixed host and scheme is not SSRF.
- No shell does not mean no injection. User input as an argv element of `spawn`, `execFile`, `subprocess.run([...])` or `exec.Command` is parsed as a flag when it starts with `-`, and some flags run commands (`git --upload-pack=`, `rg --pre=`, `tar --checkpoint-action=exec=`). Put `--` before it or reject a leading `-`.
- Sort and filter parameters interpolated into `ORDER BY`, column or table names are SQL injection even in code that binds every value, because identifiers cannot be bound. Map them through an allowlist.
- Absolute URLs built from the `Host` or `X-Forwarded-Host` header (password reset, email confirmation, OAuth `redirect_uri`) send victims links to the attacker's domain. Build them from a configured base URL.
- Token payloads read with a decode-only call (`jsonwebtoken`'s `jwt.decode`, PyJWT with `verify_signature` off) are unauthenticated. Authorization must use the verifying call with a fixed algorithm list.
- Secrets compared with `==` leak timing. Use `hmac.compare_digest` or `crypto.timingSafeEqual`, which throws on inputs of different byte length, so compare fixed-length digests.
- Limits enforced by read-then-write (single-use codes, balances, quotas, invitations) race under parallel requests. Require an atomic conditional update or a unique constraint.
- LLM features: prompt-injection filters (regex blocklists, delimiters, "ignore instructions in the document") are not controls. Treat model output as attacker-controlled: limit tools to the requesting user's permissions, escape rendered output, and block auto-loaded markdown images and links that can carry data out.

Related skills: concise:security-audit for auditing a whole codebase with a threat model, triage of many findings and verified fixes, concise:github-actions for CI workflows, concise:containers-iac for images and manifests, concise:git for secrets committed to history, concise:react-next for Server Component props, concise:backend-api for webhook signatures, concise:database for row-level security, concise:code-review for the review process around a PR.
