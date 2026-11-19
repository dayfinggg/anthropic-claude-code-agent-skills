# Browser-side defenses for XSS, cookies and cross-origin fixes

Distilled from Chrome's Modern Web Guidance 1.0 security guides (https://developer.chrome.com/docs/modern-web-guidance, Apache-2.0). Baseline statuses are the ones the guides showed from webstatus.dev in 2026-11, and webstatus.dev publishes newer data.

## Rolling out a Content Security Policy

- Ship `Content-Security-Policy-Report-Only` with a `Reporting-Endpoints` header and `report-to` for days to weeks of real traffic. Report-only blocks nothing, so it does not count as a mitigation in a finding.
- Enforce `script-src 'nonce-{RANDOM}' 'strict-dynamic' 'report-sample'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; require-trusted-types-for 'script'; report-to <name>`, plus `form-action 'self'` where forms post only to the same origin, and keep reporting on after enforcement.
- Generate a new random nonce per response and hand it to the template, so that only template-authored `<script>` tags carry it. Static or cached HTML uses `sha256-` hashes of each script instead.
- Code that stamps nonces onto every `<script>` in already-rendered HTML with a regex also stamps the scripts an attacker injected, so report it as an XSS finding rather than credit it as a CSP.
- Host allowlists in `script-src` (`https://cdn.example.com`, `https:`) fall to open redirects, JSONP endpoints and libraries hosted on the allowed origin, so a policy that relies on them does not block XSS.
- `'report-sample'` adds the first 40 characters of the blocked code to each report, so mask tokens, session IDs and personal data before reports reach the endpoint.

## Trusted Types

- Trusted Types has been Baseline newly available since 2026-02-24 (Chrome 83, Firefox 148, Safari 26).
- `require-trusted-types-for 'script'` makes DOM XSS sinks (`innerHTML`, `outerHTML`, `document.write()`, `setHTMLUnsafe()`, `eval()`, `<script>` text and `src`, `Worker()`) throw on plain strings, so values must come from a named `trustedTypes.createPolicy()` policy.
- A policy whose `createHTML` returns its input unchanged (`(s) => s`) switches the protection off, so read the body of every policy before crediting it.
- Character escaping in a policy turns markup into text, and its output is not safe inside an unquoted attribute or an `href`, where `javascript:` survives entity escaping. Accepting real markup needs a sanitizer.
- Roll out in report-only mode with a temporary `default` policy that logs string writes while sinks are migrated, then enforce. `trusted-types <names>` restricts which policies may exist and needs `dompurify` listed when a policy delegates to DOMPurify, and frameworks and libraries that write strings to sinks must support Trusted Types before enforcement.
- In browsers without support, a tinyfill that defines `trustedTypes.createPolicy` as returning its rules object keeps the code working and still runs the sanitizer.

## Sanitizing untrusted HTML

- The Sanitizer API (`element.setHTML()`, `Document.parseHTML()`) has Baseline limited availability (Chrome 146, Firefox 148, not Safari).
- `setHTML()` parses, sanitizes and inserts in one step and needs no Trusted Types policy. A custom `Sanitizer` can only restrict the default further, and script-capable markup needs `setHTMLUnsafe()`, which is a sink.
- Elements outside a custom `elements` list are dropped together with their content, while `replaceWithChildrenElements` keeps the content of listed wrappers.
- Move nodes from `Document.parseHTML()` into the page with `replaceChildren()`, because serializing them to a string and assigning it to `innerHTML` can reintroduce mutation XSS.
- Where `'setHTML' in Element.prototype` is false, load DOMPurify. To match the native defaults, set `ALLOW_ARIA_ATTR: false`, `ALLOW_DATA_ATTR: false` and `KEEP_CONTENT: false` and allow `#text`, and under enforced Trusted Types pass `RETURN_TRUSTED_TYPE: true`.
- Regex or string replacement over HTML is not sanitization, and content rendered in other places (emails, server pages, other clients) needs server-side sanitization too.

## Third-party scripts and styles

- Subresource Integrity on `<script>` and `<link>` has been Baseline widely available since 2020-10-30, and so has the element-level `referrerpolicy`.
- Set `integrity="sha384-..."`, `crossorigin="anonymous"` and `referrerpolicy="no-referrer"` together. Without `crossorigin` the fetch is `no-cors`, the bytes cannot be hashed and the resource is blocked, and the CDN must send `Access-Control-Allow-Origin`.
- Compute digests at build time from known-good bytes, or copy the publisher's digest, because hashing the live response at runtime trusts whatever the server sends.
- Pin versioned URLs (`lib@1.0.0`). A file that updates in place breaks SRI, so restrict such vendor tags with a nonce and `'strict-dynamic'` or a sandboxed iframe instead.
- `fetch()` takes `integrity`, `mode: 'cors'`, `credentials` and `referrerPolicy`, and a mismatch rejects with `TypeError`.
- The CSS `url()` modifiers `integrity()`, `cross-origin()` and `referrer-policy()` have Baseline limited availability (Chrome 150, Safari 26.2 without `integrity()`). Until they spread, load stylesheets through `<link>` with SRI instead of `@import`, and declare plain and modified `src` or `background-image` values as separate cascading declarations. Two URLs in one comma-separated `@font-face` `src` let a tampered font fall back to the unverified URL.

## Cookies

- Give session cookies the `__Host-` prefix, which requires `Secure`, `Path=/` and no `Domain`, plus `HttpOnly` and an explicit `SameSite=Lax`, and use `__Secure-` where `__Host-` does not fit.
- Give the cookies of an app embedded in other sites `SameSite=None; Secure; Partitioned`, because unpartitioned `SameSite=None` cookies are being blocked as third-party cookies.
- Logout sends `Clear-Site-Data: "cookies", "storage", "cache"`, and each directive left out leaves that state behind.

## Comparing origins

- The `Origin` API (`Origin.from()`, `isSameOrigin()`, `isSameSite()`, `opaque`) has Baseline limited availability (Chrome 145, Safari 26.5, not Firefox).
- `startsWith()` accepts `https://app.example.com.attacker.example`, and splitting hostnames on `.` gets public suffixes such as `.co.uk` and `.github.io` wrong and ignores scheme downgrades.
- Sandboxed iframes and `data:` URLs serialize their origin as `"null"`, so `event.origin === expected` with two runtime values can match two unrelated opaque contexts. Reject `"null"` first.
- Use `isSameOrigin()` for privilege boundaries such as `postMessage` commands, and `isSameSite()`, which is schemeful and uses the Public Suffix List, for post-login redirects across subdomains. Both sides must be `Origin` objects and a string throws `TypeError`, so wrap calls on untrusted input in `try`.
- Without the `Origin` API, parse both sides with `new URL()`, reject `"null"` and compare `.origin`. For a same-site check, match only an explicit registrable domain you control by protocol plus exact or dot-prefixed hostname, and for a known sandboxed iframe check `event.source` or use a dedicated `MessageChannel`.
- A sender of sensitive data passes the exact target origin to `postMessage` instead of `*`.

## Cross-origin isolation and resource policies

- `Cross-Origin-Opener-Policy: same-origin-allow-popups` is the low-risk default, because plain `same-origin` breaks flows that rely on `window.opener`, such as OAuth or payment popups opened toward the app.
- Send `Cross-Origin-Resource-Policy: same-origin` on app-internal and authenticated responses, `same-site` for sharing across subdomains, and `cross-origin` only for assets meant for embedding.
- Cross-origin isolation is needed only for `SharedArrayBuffer`. Across browsers it takes COOP `same-origin` plus `Cross-Origin-Embedder-Policy: require-corp`, after which every subresource needs a CORP header. `Document-Isolation-Policy: isolate-and-credentialless` is the easier path, but the guide notes it is supported mainly in Chrome 142 and later.
- With Fetch Metadata, reject `Sec-Fetch-Site: cross-site` requests to non-navigation endpoints before authentication runs, allow cross-site top-level GET navigations, let requests without the header through for old browsers, and send `Vary: Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site`. Allowing `same-site` trusts every subdomain, including ones that host user content, and the policy blocks webhooks and SSO callbacks, so map those first.
- `Connection-Allowlist` limits all outbound connections of a document or worker, including channels CSP does not cover (`dns-prefetch`, `preconnect`, WebRTC, redirects). It has Baseline limited availability in Chrome 152 only and the guide marks it volatile, so elsewhere use a CSP with explicit `connect-src`, `form-action` and `worker-src`. A header value that fails to parse blocks every connection.

## Companion headers

- Reach `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` by starting at a short `max-age` such as 300, because a wrong long-lived policy locks browsers out of the site until it expires.
- Send `X-Content-Type-Options: nosniff` with a correct `Content-Type` on every response.
- Against clickjacking, pair `frame-ancestors 'none'` with `X-Frame-Options: DENY`, or `'self'` with `SAMEORIGIN`. For specific cross-origin embedders, list their origins in `frame-ancestors` and drop `X-Frame-Options`, which cannot express an allowlist.

## Passkeys

- WebAuthn has been Baseline widely available since 2024-03-07 and works only in secure contexts (`https://`, or `http://localhost` in development).
- The RP ID must equal or be a registrable suffix of the page's domain, or be authorized through `/.well-known/webauthn`, so read it from the server-provided options rather than from `location.hostname`.
- The AAGUID is a UX hint only, because platform passkeys do not attest it, so an access decision based on it is a finding.
- Verify on the server with a maintained library, such as SimpleWebAuthn, py_webauthn, java-webauthn-server or WebAuthn4J, fido2-net-lib, go-webauthn, webauthn-ruby or web-auth/webauthn-framework.
- The per-flow guides under https://developer.chrome.com/docs/modern-web-guidance/guides/security/ (`passkey-registration`, `passkey-authentication`, `passkey-conditional-create`, `passkey-management`, `passkey-reauthentication`, `quick-sign-ins`) cover registration, sign-in, conditional create, management and reauthentication.
