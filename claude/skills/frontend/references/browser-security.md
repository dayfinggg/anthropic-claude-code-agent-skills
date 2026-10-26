# Browser security

## Contents

- Identify the trust boundary
- Render content through safe destinations
- Keep secrets and authorization out of client assumptions
- Scope persisted and cross-window state
- Check the actual boundary safely

## Identify the trust boundary

Treat URL values, API responses, user content, browser storage, messages, and uploaded metadata as untrusted, and determine the destination context before rendering or acting on them, because type annotations and a successful JSON parse do not validate a remote object's contract.

<example>
The `?next=` parameter and the `displayName` from the API are each checked against their expected shape before they reach a link or the DOM.
</example>

Validate the expected structure once at the integration boundary and keep later UI code based on that contract, because repeated speculative checks in child components blur where validation happens. Client validation improves feedback and cannot establish server-side authorization or trust.

<example>
`fetchProfile()` parses its response with a schema in `api/profile.ts`, so `ProfileCard` treats `name` as a string and does no re-checking.
</example>

## Render content through safe destinations

Render ordinary content through framework escaping or text-oriented DOM APIs and do not build executable markup from strings, because escaping that suits text does not make a value safe inside a URL, style, script, or raw HTML context.

<example>
A product review is rendered as `{review.text}` or set through `textContent`, and `innerHTML` is not used.
</example>

If rich HTML is actually required, sanitize it at the boundary with the project's maintained sanitizer and approved policy, and check retained links and media as well as script elements, because a regex sanitizer misses cases and a framework's raw-HTML feature renders whatever it receives. In Angular, security-trust bypass APIs need a justified trusted value, and in Vue, raw HTML and untrusted templates bypass the usual protections.

<example>
A seller's HTML product description goes through the project's existing `sanitizeHtml()` before `v-html`, and the policy is checked to keep `<a href>` while stripping `javascript:` URLs and `onerror` attributes.
</example>

Parse URLs and apply the policy that fits the destination, because navigation links, return destinations, images, and downloads allow different schemes and origins. Allow legitimate `mailto` and `tel` links, reject executable schemes where untrusted navigation could run code, and restrict return destinations to the intended scope.

<example>
A `redirect` parameter is accepted only when `new URL(value, location.origin).origin === location.origin`, and a profile link of `javascript:alert(1)` is dropped while `mailto:` stays.
</example>

For file previews, use the application's established preview mechanism and lifecycle, revoke object URLs owned by the component when they are no longer needed, and render an untrusted document sandboxed and not as same-origin content, because the browser being able to open a file does not make it safe on the application's origin.

<example>
An effect cleanup calls `URL.revokeObjectURL(previewUrl)`, and an uploaded HTML file previews in an iframe with `sandbox` and without `allow-same-origin`.
</example>

Load third-party scripts and frames with the least authority they need, using `sandbox` and `allow` on frames and `integrity` with `crossorigin` on CDN scripts and stylesheets, because a third-party script runs with the page's authority, an unsandboxed frame can run scripts, open popups, and submit forms, and a CDN file can change after review.

<example>
A chart script from `https://cdn.example.com` is loaded with `integrity` and `crossorigin="anonymous"`, and a map frame gets `sandbox` with only the tokens it needs.
</example>

## Keep secrets and authorization out of client assumptions

Treat anything shipped in client JavaScript or serialized hydration data as visible to its recipient, keep private credentials on the server, and inspect the selected bundler's actual exposure rules, because public environment-variable prefixes are exposure mechanisms and not secret stores, and an `.env` file does not make a value private.

<example>
A `VITE_PAYMENT_SECRET` ends up in the built bundle, so the secret key moves to the server's environment and only `VITE_PAYMENT_PUBLISHABLE_KEY` stays client-side.
</example>

Use the framework's safe serializer when embedding hydration state, because valid JSON is not automatically safe inside an HTML script context and a `</script>` inside a value ends the tag early.

<example>
Initial data goes through the framework's state serializer and not `JSON.stringify` into an inline `<script>` tag.
</example>

Do not treat hidden controls, route guards, or disabled actions as authorization, preserve the server's checks and the existing session mechanism, and name the missing backend protection and not the UI as the safeguard, because anyone can call the endpoint directly. An unrelated interface task does not call for redesigning authentication.

<example>
Hiding the "Delete user" button for non-admins stays a convenience, and the report notes that `DELETE /api/users/:id` still needs a server-side role check.
</example>

For cookie-authenticated mutations, use the application's established CSRF handling, and solve a browser error through the real transport policy and not by adding credentialed cross-origin requests, disabling checks, or using `no-cors`, because transport policy and user authorization are different problems and `no-cors` only hides the response.

<example>
A failing cross-origin `POST` is fixed in the API's CORS configuration or through a same-origin proxy and not with `mode: "no-cors"`.
</example>

## Scope persisted and cross-window state

Keep session identifiers and private credentials out of local storage, treat stored values as untrusted when reading them, scope cached user data and clear it when account or tenant identity changes, and remember that storage is shared across an origin, because any script on the origin can read it and a previous account's cache would otherwise leak.

<example>
The session stays in an `HttpOnly` cookie, and logout removes `recentSearches:<userId>` from `localStorage` and clears the query cache.
</example>

When cross-window messaging is required, send to the exact intended origin and validate the sender's origin, the expected window source where applicable, and the message shape before acting, add no listener the feature does not need, and treat received data as data and not code, because any window can post a message to yours.

<example>
The sender calls `window.postMessage(data, "https://pay.example.com")` and the receiver starts with `if (event.origin !== "https://pay.example.com") return`.
</example>

Keep the existing CSP compatible with the change and leave broad script permissions and dynamic evaluation out of it for a dependency's sake, because CSP and Trusted Types support safe rendering and do not replace sanitization, authorization, or correct data handling.

<example>
A chart library that needs `unsafe-eval` is replaced or switched to its CSP-safe build and `'unsafe-eval'` is not added to `script-src`.
</example>

## Check the actual boundary safely

In an authorized local or test environment, verify that markup-like input remains text where intended, check invalid URL schemes, denied actions, expired sessions, and account switching when they are affected, inspect outgoing data for secrets and unnecessary personal information, and use controlled fixtures, because hostile content run against a live account can cause real harm.

<example>
Create a fixture user named `<img src=x onerror=alert(1)>`, confirm the local profile page shows it as plain text, and scan the network panel for tokens in query strings.
</example>
