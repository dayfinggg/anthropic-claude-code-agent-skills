---
name: web-security
description: Finding exploitable vulnerabilities in web application and API code, and deciding whether a suspected one is real. Use when asked for a security review or audit of a web app, API, PR or diff, when checking for IDOR or BOLA, broken access control, privilege escalation, tenant isolation or cross-tenant leaks, fail-open defaults, secrets leaking into logs, traces or JSON, SSRF, open redirects, CORS, CSRF, path traversal, mass assignment, injection (including argument injection into spawn or execFile), template autoescaping, spoofed X-Forwarded-For, when triaging a scanner or bug-bounty finding as true or false positive, or when reviewing auth middleware, permission classes, policies, ORM queries, serializers or security settings in Django, DRF, FastAPI, Express, Next.js, Rails, Laravel or Spring.
---

## Check first

- Establish exposure before judging severity: who can reach the code (internet, other internal services, customer SDKs, a local operator). Look in ingress, gateway and deployment config, and ask if it is unclear.
- Name the actors: anonymous caller, member of another tenant, lower role in the same tenant, a webhook or SDK payload. Most access-control bugs need a logged-in attacker.
- Find how this codebase enforces authorization: middleware, base controllers, decorators, policies and guards, the framework's default permission setting, scoped query helpers or managers, and every escape hatch that skips them.
- Read `SECURITY_MODEL.md` or a threat model if one exists, from the base revision when reviewing a PR (see concise:code-review). Only controls that block count as enforcement. A control that only logs, alerts or emits a metric is monitoring.
- Get framework versions from the lockfile and check which protections are on: template auto-escaping, CSRF middleware, ORM parameterization, secure cookie flags.
- Current ASVS release (5.0.0): https://github.com/OWASP/ASVS/tags.atom
- Facts verified 2026-11.

## Defaults

- Research the whole repository, not only the target the user named. The other half of a bug (the sink, the missing check, the caller) is often outside the diff. A function that returns a built SQL string, command, URL, path or template has its sink in its callers, so read them.
- Report a finding only when all three hold: the input is attacker-controlled, the path is reachable in production, and no upstream control stops it. A dangerous pattern with an unconfirmed source goes under "needs verification" with the exact question. Theoretical and defense-in-depth items are left out.
- Attacker-controlled: query, body, path segments, most headers (including `Host` and `X-Forwarded-For` unless a trusted proxy overwrites them), unsigned cookies, uploaded file names and contents, webhook and queue payloads from outside, and database rows written by other users. Not attacker-controlled: settings, environment variables, constants, admin-only configuration.
- Requiring login lowers severity, it does not remove an access-control finding.
- Restate each suspected bug in one sentence (actor, entry point, root cause, impact) before analysing it.
- Give each finding the actor, the route and method, a concrete request, the code path with `file:line`, and the impact. Pick the lower severity when reachability depends on an unproven precondition.
- Use the repository's severity scale if it has one, otherwise critical, high, medium, low with the condition that raises or lowers each.
- A fix must enforce in code: deny, filter or raise. A comment such as "caller must check permissions" is not a fix.
- The regression test for an access-control fix sends the request as the wrong actor and asserts both the denial and that none of the data appears in the response.
- Neighbouring areas: CI workflows in concise:github-actions, images and manifests in concise:containers-iac, secrets committed to git in concise:git, Server Component props in concise:react-next, webhook signatures in concise:backend-api, row-level security in concise:database.

## Gotchas

- Object-level authorization is the most common real finding. Check every lookup by ID, not just the obvious detail route. The full checklist is in references/access-control.md.
- Fail-open defaults run in production whenever a variable is missing or a dependency fails. Patterns are in references/defaults-and-sinks.md.
- Credentials leak through generated serialization (repr, `asdict`, `model_dump`, `JSON.stringify`) into logs, spans and error reports, usually across two separate changes. See references/defaults-and-sinks.md.
- CORS with `Access-Control-Allow-Origin: *` and credentials is refused by browsers, so it is not a credential leak. The exploitable patterns, each with `Access-Control-Allow-Credentials: true`, are reflecting the request `Origin`, matching origins by suffix or loose regex (`endsWith('example.com')` also matches `evilexample.com`), and allowing the `null` origin, which sandboxed iframes send.
- "JSON only" endpoints can still be forged cross-site. Forms and `fetch` can send `text/plain`, `application/x-www-form-urlencoded` or `multipart/form-data` without a preflight, so a server that parses the body whatever the `Content-Type`, or also accepts form bodies, is open to CSRF when its session cookie is not `SameSite=Lax` or `Strict`. State changes on GET stay forgeable even with `Lax`, because top-level navigations send the cookie.
- Open redirect checks with `startsWith('/')` let `//evil.example` and `/\evil.example` through, because browsers treat `\` as `/`. Resolve the target with a URL parser against your own origin and compare origins.
- `os.path.join` and `pathlib` drop the base when the user part is absolute. `startsWith(base)` without a trailing separator accepts `/srv/app-evil`. `path.resolve`, `normpath` and `filepath.Clean` are lexical and follow no symlinks. Resolve both sides with `fs.realpathSync`, `os.path.realpath` or `filepath.EvalSymlinks`, then compare against the base plus separator. Archive extraction needs the same check for every entry.
- SSRF allowlists checked on the hostname before DNS resolution fall to DNS rebinding and redirects. Check the IP actually connected to, re-check every redirect hop or turn redirects off, and block link-local metadata addresses (169.254.169.254) plus IPv6 and numeric encodings of internal addresses. Input that sets only the path on a fixed host and scheme is not SSRF.
- No shell does not mean no injection. User input as an argv element of `spawn`, `execFile`, `subprocess.run([...])` or `exec.Command` is parsed as a flag when it starts with `-`, and some flags run commands (`git --upload-pack=`, `rg --pre=`, `tar --checkpoint-action=exec=`). Put `--` before it or reject a leading `-`.
- Jinja's `Environment()` and `Template()` default to `autoescape=False`. Flask enables escaping only through `render_template` (`.html`, `.htm`, `.xml`, `.xhtml`, `.svg`) and `render_template_string`. Go's `text/template` does not escape, `html/template` does.
- Express `app.set('trust proxy', true)` takes `req.ip` from the left-most `X-Forwarded-For` entry, which the client controls, so IP allowlists, rate limits and audit logs can be spoofed. Trust only the real proxy addresses or hop count.
- Absolute URLs built from the `Host` or `X-Forwarded-Host` header (password reset, email confirmation, OAuth `redirect_uri`) send victims links to the attacker's domain. Build them from a configured base URL.
- Sort and filter parameters interpolated into `ORDER BY`, column or table names are SQL injection even in code that binds every value, because identifiers cannot be bound. Map them through an allowlist.
- Token payloads read with a decode-only call (`jsonwebtoken`'s `jwt.decode`, PyJWT with `verify_signature` off) are unauthenticated. Authorization must use the verifying call with a fixed algorithm list.
- Secrets compared with `==` leak timing. Use `hmac.compare_digest` or `crypto.timingSafeEqual`, which throws on inputs of different length, so compare fixed-length digests.
- Limits enforced by read-then-write (single-use codes, balances, quotas, invitations) race under parallel requests. Require an atomic conditional update or a unique constraint.
- LLM features: prompt-injection filters (regex blocklists, delimiters, "ignore instructions in the document") are not controls. Treat model output as attacker-controlled: limit tools to the requesting user's permissions, escape rendered output, and block auto-loaded markdown images and links that can carry data out.
- Test files, dead code, examples and fixtures are out of scope unless they ship. Check that a flagged route is registered and not behind a disabled flag before reporting it.

## References

- references/access-control.md: read when reviewing authorization, IDOR or BOLA, tenant isolation, roles, or any endpoint that takes an object ID.
- references/defaults-and-sinks.md: read when reviewing configuration, error handling around security checks, logging, tracing, error reporting, caching, or how objects holding credentials are serialized.
