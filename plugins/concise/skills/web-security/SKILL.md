---
name: web-security
description: Method and framework knowledge for finding exploitable vulnerabilities in web apps and APIs and judging whether a suspected one is real, adding to the built-in /security-review a reachability standard and traps in Django, DRF, FastAPI, Express, Next.js, Rails, Laravel, Symfony and Spring. Use when reviewing code, a PR or a diff for security, for IDOR, tenant leaks, SSRF, CSRF, XSS, injection or secrets in logs, and when triaging a scanner or bug-bounty finding. A whole-codebase audit with a threat model, a find-and-fix loop or a hunt through logs belongs to security-audit.
---

# Web application security review

This skill takes its vulnerability classes from the OWASP Top 10:2025 and the OWASP API Security Top 10:2023, and cites requirements from OWASP ASVS 5.0.0. Read the framework versions from the lockfile. Where a framework's installed release is newer, its own security documentation is right about defaults.

## References

- Read [references/access-control.md](references/access-control.md) before you review authorization, IDOR or BOLA, tenant isolation, roles, mass assignment, or any endpoint that takes an object ID.
- Read [references/frameworks.md](references/frameworks.md) before you judge whether Django, DRF, FastAPI, Flask or Jinja, Express, Next.js, Rails, Laravel, Symfony, Spring or Go templates already block a suspected bug.
- Read [references/browser-defenses.md](references/browser-defenses.md) when a fix or a mitigation involves CSP, Trusted Types, HTML sanitizing, Subresource Integrity, cookie attributes, origin checks, cross-origin headers or passkeys, and before you credit such a defense with blocking a finding.
- Read [references/defaults-and-sinks.md](references/defaults-and-sinks.md) before you review configuration, error handling around security checks, logging, tracing, error reporting, caching, or how objects that hold credentials are serialized.

## Check first

- Establish who can reach the code before you judge severity, such as the internet, other internal services, customer SDKs or a local operator. Look in ingress, gateway and deployment config, and ask when it stays unclear.
- Name the actors, such as an anonymous caller, a member of another tenant, a lower role in the same tenant, or a webhook or SDK payload. Most access-control bugs need a logged-in attacker.
- Find how this codebase enforces authorization, in middleware, base controllers, decorators, policies and guards, the framework's default permission setting and scoped query helpers or managers, and find every escape hatch that skips them.
- Read `SECURITY_MODEL.md` or a threat model if one exists, from the base revision when you review a PR. Only controls that block count as enforcement, and a control that only logs, alerts or emits a metric is monitoring.
- Check which framework protections are on, such as template auto-escaping, CSRF middleware, ORM parameterization, secure cookie flags and the trusted proxy setting.

## Method

- Read past the target the user named, because the other half of a bug, such as the sink, the missing check or the caller, often sits outside the diff. A function that returns a built SQL string, command, URL, path or template has its sink in its callers, so read them.
- Report a finding only when the input is attacker-controlled, the path is reachable in production, and no upstream control stops it. List a dangerous pattern with an unconfirmed source under "needs verification" with the exact open question, and leave theoretical and defense-in-depth items out.
- Attacker-controlled input covers the query, the body, path segments, most headers (`Host` and `X-Forwarded-For` included, unless a trusted proxy overwrites them), unsigned cookies, uploaded file names and contents, webhook and queue payloads from outside, and database rows written by other users. Settings, environment variables, constants and admin-only configuration are not attacker-controlled.
- Requiring login lowers the severity of an access-control finding but does not remove it.
- Test files, dead code, examples and fixtures are out of scope unless they ship. Before you report a route, check that it is registered and not behind a disabled flag.

## Findings and fixes

- Give each finding the actor, the route and method, a concrete request, the code path with `file:line`, the impact, its OWASP ID (`A01:2025`, `API1:2023`) and a severity on the repository's scale where it has one. Pick the lower severity when reachability depends on an unproven precondition.
- A fix enforces in code by denying, filtering or raising, because a comment that asks callers to check permissions fixes nothing.
- The regression test for an access-control fix sends the request as the wrong actor and asserts both the denial and that none of the data appears in the response.

## Classes to cover

- Broken access control (`A01:2025`, `API1`, `API3`, `API5:2023`) covers object, property and function level checks, tenant isolation, mass assignment, and CSRF and SSRF (`API7:2023`), which OWASP 2025 files under A01. Most real findings are here.
- Injection (`A05:2025`) covers SQL including identifiers, OS commands and argv flags, XSS, templates and paths.
- Mishandled exceptional conditions (`A10:2025`) cover fail-open defaults, catch-all handlers that allow, and errors that leak internals.
- Misconfiguration (`A02:2025`, `API8:2023`) covers permissive CORS, cookies without `Secure` or `HttpOnly`, debug modes and XML parsers that resolve external entities.
- Authentication (`A07:2025`, `API2:2023`) covers unverified tokens, fallback secrets, client IPs from spoofable headers and links built from the `Host` header.
- Resource and business-flow abuse (`API4`, `API6:2023`) covers missing limits and read-then-write races.
- Secrets in logs, traces and responses (`A09:2025`, `API3:2023`).
- Outgoing calls to third-party APIs whose responses are trusted without validation (`API10:2023`), and undocumented old API versions or hosts that still serve traffic (`API9:2023`).
- Software supply chain (`A03:2025`) and build integrity (`A08:2025`) are reviewed with concise:github-actions and concise:containers-iac.

## Gotchas

- CORS with `Access-Control-Allow-Origin: *` and credentials is refused by browsers, so it is not a credential leak. The exploitable patterns, each with `Access-Control-Allow-Credentials: true`, are a reflected request `Origin`, origins matched by suffix or loose regex (`endsWith('example.com')` also matches `evilexample.com`), and an allowed `null` origin, which sandboxed iframes send.
- An endpoint that only accepts JSON can still be forged cross-site. Forms and `fetch` send `text/plain`, `application/x-www-form-urlencoded` or `multipart/form-data` without a preflight, so a server that parses the body whatever the `Content-Type` is open to CSRF when its session cookie is not `SameSite=Lax` or `Strict`. State changes on GET stay forgeable even with `Lax`, because top-level navigations send the cookie.
- Judge a cookie without a `SameSite` attribute as unprotected against CSRF, because browsers that default it to `Lax` still send it on a cross-site POST for two minutes after it was set, and other browsers do not default to `Lax` at all.
- A Content Security Policy lowers the severity of an XSS finding only when it is enforced and built on nonces or hashes with `'strict-dynamic'`. A `Report-Only` header blocks nothing, host allowlists in `script-src` fall to open redirects and JSONP on the allowed host, and a Trusted Types policy that returns its input unchanged protects nothing.
- A `message` event handler without an origin check, with `startsWith` or `includes` on `event.origin`, or that accepts the string `"null"` takes commands from any page that can frame or open the app. Compare `event.origin` exactly with the expected origin.
- An open-redirect check with `startsWith('/')` lets `//evil.example` and `/\evil.example` through, because browsers treat `\` as `/`. Resolve the target with a URL parser against your own origin and compare origins.
- `os.path.join` and `pathlib` drop the base when the user part is absolute, `startsWith(base)` without a trailing separator accepts `/srv/app-evil`, and `path.resolve`, `normpath` and `filepath.Clean` are lexical and follow no symlinks. Resolve both sides with `fs.realpathSync`, `os.path.realpath` or `filepath.EvalSymlinks`, then compare against the base plus a separator, for every entry of an extracted archive too.
- An SSRF allowlist checked on the hostname before DNS resolution falls to DNS rebinding and redirects. Check the IP actually connected to, re-check every redirect hop or turn redirects off, and block link-local metadata addresses (169.254.169.254) plus IPv6 and numeric encodings of internal addresses. Input that sets only the path on a fixed host and scheme is not SSRF.
- Running without a shell does not rule out injection. User input as an argv element of `spawn`, `execFile`, `subprocess.run([...])` or `exec.Command` is parsed as a flag when it starts with `-`, and some flags run commands (`git --upload-pack=`, `rg --pre=`, `tar --checkpoint-action=exec=`). Put `--` before it or reject a leading `-`.
- Sort and filter parameters interpolated into `ORDER BY`, column or table names are SQL injection even in code that binds every value, because identifiers cannot be bound. Map them through an allowlist.
- Absolute URLs built from the `Host` or `X-Forwarded-Host` header, as in password reset, email confirmation or an OAuth `redirect_uri`, send victims links to the attacker's domain. Build them from a configured base URL.
- A token payload read with a decode-only call, such as `jsonwebtoken`'s `jwt.decode` or PyJWT with `verify_signature` off, is unauthenticated. Authorize only with the verifying call and a fixed algorithm list.
- Secrets compared with `==` leak timing. Use `hmac.compare_digest` or `crypto.timingSafeEqual`, which throws on inputs of different byte length, so compare fixed-length digests.
- Limits enforced by read-then-write, such as single-use codes, balances, quotas and invitations, race under parallel requests. Require an atomic conditional update or a unique constraint.
- In LLM features, prompt-injection filters such as regex blocklists, delimiters or an instruction to ignore instructions in the document are not controls. Treat model output as attacker-controlled, limit tools to the requesting user's permissions, escape rendered output, and block auto-loaded markdown images and links that can carry data out.

Related skills: concise:security-audit for auditing a whole codebase with a threat model, triage of many findings and verified fixes, concise:github-actions for CI workflows, concise:containers-iac for images and manifests, concise:git for secrets committed to history, concise:react-next for Server Component props, concise:backend-api for webhook signatures, concise:database for row-level security, concise:code-review for the review process around a PR.
