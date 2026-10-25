# Identity, tenants, and state

## Authorize the operation and its object

When requests select objects, authorize both the action and the selected resource in trusted backend code, derive actor and tenant membership from the verified identity, and scope lookups and writes by the permitted tenant, owner, relationship, or explicit cross-tenant grant, because parameter binding protects query syntax and not object access, and random identifiers reduce guessing without enforcing permissions. Verify parent-child ownership and not only the parent URL. Check an existing foreign object, a foreign child under an allowed parent, and a direct call without the UI, and confirm that denial prevents disclosure and mutation, including data embedded in redirects.

<example>
`UPDATE line_items SET qty = ? WHERE id = ? AND order_id IN (SELECT id FROM orders WHERE tenant_id = ?)` binds the `tenant_id` from the session, so a clerk of tenant 3 who posts a `line_item_id` belonging to tenant 5 updates zero rows.
</example>

When a policy service, identity lookup, or permission cache fails, deny the protected operation and keep a bounded diagnostic, because a substitute service account, wildcard scope, or stale positive result turns an outage into an authorization bypass. Valid public behavior may stay available, and an explicit policy may allow bounded caching. Check missing identity, unknown roles, an expired permission entry, and a policy timeout, and assert that the downstream read, write, or tool operation is not performed.

<example>
When `fetchRoles(userId)` times out in the JavaScript API, the middleware answers 503 and the `DELETE /products/:id` handler never runs, while `GET /products` for the public catalog keeps serving.
</example>

## Preserve authority through jobs and field updates

When an operation becomes asynchronous, bind its actor, tenant, resource scope, and permitted operation to server-created job state, and enforce the current authorization the product requires at execution and at download, because a worker's broad storage credential is not the user's grant. Signed download links are bearer capabilities with their own scope and lifetime and not automatic user-bound authorization, so decide whether sharing or revocation is permitted before choosing them. Check a changed job identifier, a forged queue message, and revoked membership, and test another tenant's artifact through the actual download path.

<example>
The PDF export job stores `user_id` and `tenant_id` in the `jobs` row, the worker reads them from that row and not from the queue message, and `GET /jobs/88/download` rechecks the viewer's current membership before sending the file.
</example>

When request objects update domain records, map only the fields permitted for that operation, keep tenant, owner, role, approval state, and server-calculated values outside ordinary editable fields, and use distinct privileged operations where those changes are required, because a schema-valid property can still be forbidden and omitting a UI field does not remove it from the API. Check extra sensitive fields, nested object replacement, and batch items belonging to another tenant, and verify the persisted record and not only the response status.

<example>
`updateProfile` copies only `display_name` and `bio` from `req.body` into its `UPDATE users` statement, so a posted `{"role":"admin"}` leaves `users.role` unchanged in the database.
</example>

When permission or business state can change between the check and the mutation, enforce the invariant atomically with a conditional write, a transaction, or an equivalent datastore operation, and bind idempotency records to the actor and intended operation when replay has consequences, because a transaction alone does not make a previously checked condition current. Check concurrent revocation, duplicate requests, and failure before an event is emitted, so that the result is never an unauthorized write, a duplicate action, or a partial externally visible transition.

<example>
Shipping an order in Go runs `UPDATE orders SET status = 'shipped' WHERE id = $1 AND status = 'paid'` and sends the shipping email only when `RowsAffected()` returns 1, so two simultaneous requests produce one email.
</example>

## Authenticate and recover without introducing bypasses

When changing login or sensitive account operations, reuse the maintained identity system instead of writing new credential checks, require reauthentication for password, MFA, recovery-channel, or privilege changes, and apply account-aware throttling and abuse limits that do not make public attempts a reliable account-lockout attack, because neutral wording alone does not hide enumeration through status codes or obvious timing differences. Check wrong credentials, disabled accounts, repeated guesses from varying origins, and a valid low-privilege session attempting an account takeover action.

<example>
Changing a member's email in the SaaS dashboard asks for the current password again, and the login form returns the same 200 "invalid email or password" page, with similar timing, for an unknown address and for a wrong password.
</example>

When implementing recovery links or codes, use unpredictable, expiring, purpose-bound, single-use credentials tied to the intended account, store and consume them through the identity framework, build recovery destinations from trusted configuration and not from the request host, and leave the account unchanged until proof is presented, because a host taken from the request lets an attacker get a valid token mailed to their own domain. Recovering from a compromise may also require invalidating sessions and reviewing changed recovery factors, not just resetting a password. Check expired, reused, wrong-account, and concurrently submitted tokens, and confirm that a reset-request flood neither locks the victim out nor leaks account existence.

<example>
The reset email links to `$"{options.AppUrl}/reset?token={token}"` with `AppUrl` read from config and not from `Request.Host`, and the token comes from `RandomNumberGenerator.GetBytes(32)`, expires after 30 minutes, and is deleted on first use.
</example>

## Enforce session and token lifecycle

When changing sessions, verify them on a trusted backend, rotate them after authentication or privilege change, enforce the configured idle and absolute expiry, and make logout, account disablement, and recovery invalidate authority according to the product's policy, because clearing a browser cookie alone does not revoke a stolen token. Self-contained tokens need an explicit revocation or bounded-lifetime design and not a claim of immediate revocation. Check the old session after rotation, logout, expiry, and disablement, and verify that valid users can still complete the intended sign-in flow.

<example>
After a successful login the Spring Security configuration keeps session fixation protection on so a new `JSESSIONID` is issued, and a test replays the pre-login `JSESSIONID` and sees the anonymous view, then logs out, replays the post-login cookie, and is redirected to `/login`.
</example>

When accepting JWTs, configure allowed algorithms, issuer-bound keys, expected audience, token purpose, and required time claims outside attacker-controlled token content, use the maintained verifier and not decoding plus manual claim checks, and keep validation rules distinct for access, identity, and recovery tokens, because a valid signature from the wrong context is still invalid authority. Check wrong audience, wrong token type, altered algorithm, expired claims, unknown keys, and key-discovery failure, and confirm that no failed verification falls back to an unsigned or partially verified identity.

<example>
The Python API calls `jwt.decode(token, key, algorithms=["RS256"], issuer="https://id.acme.example", audience="billing-api")` from the `PyJWT` package on every request, and a password-reset token with a recovery purpose claim is rejected by the API middleware.
</example>
