# Browser-side defenses for XSS, cookies and cross-origin fixes

Distilled from Chrome's Modern Web Guidance 1.0 security guides (https://developer.chrome.com/docs/modern-web-guidance, Apache-2.0). Baseline statuses are the ones the guides display from webstatus.dev as of 2026-11. For a browser matrix newer than that, webstatus.dev publishes the current data.

## Contents

- Rolling out a Content Security Policy
- Trusted Types
- Sanitizing untrusted HTML
- Third-party scripts and styles
- Cookies
- Comparing origins
- Cross-origin isolation and resource policies
- Companion headers
- Passkeys

## Rolling out a Content Security Policy

- Inventory first: existing security headers in server, middleware, CDN and `<meta>` config, inline scripts and styles, third-party script origins, popup flows (OAuth, payments, SSO), iframes in both directions, and cross-site callers such as webhooks and SSO redirects.
- Ship `Content-Security-Policy-Report-Only` with a `Reporting-Endpoints` header and `report-to`, for days to weeks of real traffic. Report-only blocks nothing, so it never counts as a mitigation in a finding.
- The enforced policy: `script-src 'nonce-{RANDOM}' 'strict-dynamic' 'report-sample'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; require-trusted-types-for 'script'; report-to <name>`, plus `form-action 'self'` where forms never post elsewhere. Keep reporting on after enforcement.
- Generate a new random nonce per response and hand it to the template, so only template-authored `<script>` tags carry it. Static or cached HTML uses `sha256-` hashes of each script instead.
- Stamping nonces onto every `<script>` in already-rendered HTML with a regex also stamps the scripts an attacker injected. Treat that code as an XSS finding, not as a CSP.
- Host allowlists in `script-src` (`https://cdn.example.com`, `https:`) are bypassable through open redirects, JSONP endpoints and libraries hosted on the allowed origin. A policy that relies on them does not block XSS.
- Report triage: drop noise from extensions, old browsers and crawlers, and look at high-volume patterns from current browsers. `'report-sample'` adds the first 40 characters of the blocked code to each report.
- Mask tokens, session IDs and personal data in reports before they reach the reporting endpoint.

## Trusted Types

- Baseline newly available since 2026-02-24 (Chrome 83, Firefox 148, Safari 26).
- `require-trusted-types-for 'script'` makes DOM XSS sinks (`innerHTML`, `outerHTML`, `document.write()`, `setHTMLUnsafe()`, `eval()`, `<script>` text and `src`, `Worker()`) throw on plain strings. Values must come from a named `trustedTypes.createPolicy()` policy.
- A policy whose `createHTML` returns its input unchanged (`(s) => s`) switches the protection off. Read the body of every policy before crediting it.
- Character escaping in a policy turns markup into text. Its output is not safe inside an unquoted attribute or an `href`, where `javascript:` survives entity escaping. Accepting real markup needs a sanitizer.
- Rollout: report-only first, a temporary `default` policy that logs string writes while sinks are migrated, then enforcement. `trusted-types <names>` restricts which policies may exist, and needs `dompurify` listed when a policy delegates to DOMPurify. Frameworks and libraries that write strings to sinks must support Trusted Types before enforcement.
- Fallback: a "tinyfill" that defines `trustedTypes.createPolicy` as returning its rules object keeps the code working and still runs the sanitizer in browsers without support.

## Sanitizing untrusted HTML

- Sanitizer API (`element.setHTML()`, `Document.parseHTML()`): Baseline limited availability (Chrome 146, Firefox 148, not Safari).
- `setHTML()` parses, sanitizes and inserts in one step, and needs no Trusted Types policy. A custom `Sanitizer` can only restrict the default further. Allowing script-capable markup requires `setHTMLUnsafe()`, which is a sink.
- Elements outside a custom `elements` list are dropped together with their content. `replaceWithChildrenElements` keeps the content of listed wrappers.
- Move nodes from `Document.parseHTML()` into the page with `replaceChildren()`. Serializing them to a string and assigning it to `innerHTML` can reintroduce mutation XSS.
- Fallback: load DOMPurify only when `'setHTML' in Element.prototype` is false. To match the native defaults set `ALLOW_ARIA_ATTR: false`, `ALLOW_DATA_ATTR: false`, `KEEP_CONTENT: false` and allow `#text`. Under enforced Trusted Types pass `RETURN_TRUSTED_TYPE: true`.
- Regex or string replacement over HTML is not sanitization. Content rendered in other places (emails, server pages, other clients) needs server-side sanitization too.

## Third-party scripts and styles

- Subresource Integrity on `<script>` and `<link>`: Baseline widely available (since 2020-10-30). Element-level `referrerpolicy`: widely available.
- Set `integrity="sha384-..."`, `crossorigin="anonymous"` and `referrerpolicy="no-referrer"` together. Without `crossorigin` the fetch is `no-cors`, the bytes cannot be hashed, and the resource is blocked. The CDN must send `Access-Control-Allow-Origin`.
- Compute digests at build time from known-good bytes, or copy the publisher's digest. Hashing the live response at runtime trusts whatever the server sends.
- Pin versioned URLs (`lib@1.0.0`). A file that updates in place breaks SRI, so restrict such vendor tags with a nonce and `'strict-dynamic'` or a sandboxed iframe instead.
- Several valid payloads: list several digests of the same algorithm separated by spaces.
- `fetch()` takes `integrity`, `mode: 'cors'`, `credentials` and `referrerPolicy`. A mismatch rejects with `TypeError`.
- CSS `url()` modifiers `integrity()`, `cross-origin()` and `referrer-policy()`: Baseline limited availability (Chrome 150, Safari 26.2 without `integrity()`). Fallback: load stylesheets through `<link>` with SRI instead of `@import`, and declare plain and modified `src` or `background-image` values as separate cascading declarations. Two URLs in one comma-separated `@font-face` `src` let a tampered font fall back to the unverified URL.
- Set `Referrer-Policy: strict-origin-when-cross-origin` for the document as the default.

## Cookies

- Session cookies: `__Host-` prefix (requires `Secure`, `Path=/` and no `Domain`), `HttpOnly`, and an explicit `SameSite=Lax`. Use `__Secure-` where `__Host-` does not fit.
- Cookies for an app embedded in other sites: `SameSite=None; Secure; Partitioned`. Unpartitioned `SameSite=None` cookies are being blocked as third-party cookies.
- Logout sends `Clear-Site-Data: "cookies", "storage", "cache"`. Leaving out a directive leaves that state behind.

## Comparing origins

- `Origin` API (`Origin.from()`, `isSameOrigin()`, `isSameSite()`, `opaque`): Baseline limited availability (Chrome 145, Safari 26.5, not Firefox).
- `startsWith()` accepts `https://app.example.com.attacker.example`. Splitting hostnames on `.` gets public suffixes such as `.co.uk` and `.github.io` wrong and ignores scheme downgrades.
- Sandboxed iframes and `data:` URLs serialize their origin as `"null"`, so `event.origin === expected` with two runtime values can match two unrelated opaque contexts. Reject `"null"` first.
- `isSameOrigin()` for privilege boundaries such as `postMessage` commands, `isSameSite()` (schemeful, uses the Public Suffix List) for post-login redirects across subdomains. Both sides must be `Origin` objects, a string throws `TypeError`, so wrap calls on untrusted input in `try`.
- Fallback: parse both sides with `new URL()`, reject `"null"`, compare `.origin`. For same-site checks without `Origin`, match only an explicit registrable domain you control by protocol plus exact or dot-prefixed hostname. For a known sandboxed iframe, check `event.source` or use a dedicated `MessageChannel`.
- Senders pass an explicit target origin to `postMessage`, never `*`, when the data is sensitive.

## Cross-origin isolation and resource policies

- `Cross-Origin-Opener-Policy: same-origin-allow-popups` is the low-risk default. Plain `same-origin` breaks flows that rely on `window.opener`, such as OAuth or payment popups opened toward the app.
- `Cross-Origin-Resource-Policy: same-origin` on app-internal and authenticated responses, `same-site` for sharing across subdomains, `cross-origin` only for assets meant for embedding.
- Cross-origin isolation is only needed for `SharedArrayBuffer`. Cross-browser it takes COOP `same-origin` plus `Cross-Origin-Embedder-Policy: require-corp`, and every subresource then needs a CORP header. `Document-Isolation-Policy: isolate-and-credentialless` is the easier path, but the guide notes it is supported mainly in Chrome 142 and later.
- Fetch Metadata: reject `Sec-Fetch-Site: cross-site` requests to non-navigation endpoints before authentication runs, allow cross-site top-level GET navigations, let requests without the header through for old browsers, and send `Vary: Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site`. Allowing `same-site` trusts every subdomain, including ones that host user content. Map webhooks and SSO callbacks first, because the policy blocks them.
- `Connection-Allowlist` limits all outbound connections of a document or worker, including channels CSP does not cover (`dns-prefetch`, `preconnect`, WebRTC, redirects). Baseline limited availability, Chrome 152 only, and the guide marks it volatile. Fallback is a CSP with explicit `connect-src`, `form-action` and `worker-src`. A header value that fails to parse blocks every connection.

## Companion headers

- HSTS: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`, reached by starting at a short `max-age` such as 300, because a wrong long-lived policy locks browsers out of the site until it expires.
- `X-Content-Type-Options: nosniff`, with correct `Content-Type` on every response.
- Clickjacking: `frame-ancestors 'none'` with `X-Frame-Options: DENY`, or `'self'` with `SAMEORIGIN`. For specific cross-origin embedders use `frame-ancestors` with their origins and drop `X-Frame-Options`, which cannot express an allowlist.
- `Permissions-Policy: camera=(), geolocation=(), microphone=()` for unused features, with the iframe `allow` attribute for delegated ones.

## Passkeys

- WebAuthn: Baseline widely available (since 2024-03-07). It works only in secure contexts (`https://`, or `http://localhost` in development).
- The RP ID must equal or be a registrable suffix of the page's domain, or be authorized through `/.well-known/webauthn`. Read it from the server-provided options, not from `location.hostname`.
- The AAGUID is a UX hint only, because platform passkeys do not attest it. An access decision based on it is a finding.
- Verify on the server with a maintained library (SimpleWebAuthn, py_webauthn, java-webauthn-server or WebAuthn4J, fido2-net-lib, go-webauthn, webauthn-ruby, web-auth/webauthn-framework).
- Registration, sign-in, conditional create, management and reauthentication flows are documented in the per-flow guides under https://developer.chrome.com/docs/modern-web-guidance/guides/security/ (`passkey-registration`, `passkey-authentication`, `passkey-conditional-create`, `passkey-management`, `passkey-reauthentication`, `quick-sign-ins`).
