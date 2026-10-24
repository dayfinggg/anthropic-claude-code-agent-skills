# Authentication, sessions, tokens, and cryptography

The values here are minimums from the OWASP cheat sheets and the RFCs. Take stronger settings from the project or framework when it has them.

## Contents

- Authentication and OAuth
- Passwords
- Sessions and cookies
- CSRF
- JSON Web Tokens
- Secrets
- Cryptography
- Cheat sheets

## Authentication and OAuth

- Use the framework's identity system, or an external identity provider through OAuth 2.0 and OpenID Connect. This covers login, password reset, remember-me, and MFA.
- A deliberately public function uses the framework's explicit marker for public routes. This avoids CWE-306.
- Rate-limit login, registration, password reset, and MFA verification. Protect them against credential stuffing as the cheat sheet describes.
- Offer MFA where the product has accounts. Default or shared passwords never ship.
- Public OAuth clients must use PKCE, as RFC 9700 requires. Do not use the implicit grant. Never use the resource owner password grant.

## Passwords

- Use Argon2id with at least 19 MiB of memory, 2 iterations, and a parallelism of 1.
- Where Argon2id is unavailable, use scrypt. Set the cost parameter to at least 2^17, the block size to 8, and the parallelism to 1.
- Where neither exists, use bcrypt with a work factor of at least 10. Reject passwords longer than 72 bytes, because most implementations read no more.
- Use PBKDF2 only when FIPS-140 compliance is required. Use HMAC-SHA-256 with at least 600,000 iterations.
- A pepper adds defense in depth but never replaces the adaptive hash.
- Rehash legacy hashes at the user's next login.

## Sessions and cookies

- Let the framework create session IDs. They need at least 64 bits of entropy. The target is 128 bits from a secure random generator.
- Session cookies get `Secure`, `HttpOnly`, and `SameSite=Strict` where the flows allow it. Otherwise use `SameSite=Lax`. `SameSite=None` always comes with `Secure`.
- Name the session cookie with the `__Host-` prefix. It requires `Secure`, `Path=/`, and no `Domain` attribute.
- Renew the session ID after login and after every other privilege change.
- Every session has an idle and an absolute timeout from the project's configuration. OWASP cites idle timeouts of 2 to 5 minutes for high-value applications and 15 to 30 minutes for low-risk ones. It cites absolute timeouts of 4 to 8 hours.
- Invalidate the session on the server at logout and at expiry, not only in the browser.
- Keep session IDs, JWTs, refresh tokens, and other credentials out of `localStorage` and `sessionStorage`. Any script in the origin can read them.

## CSRF

- Turn on the framework's CSRF protection first.
- Stateful applications use the synchronizer token pattern. Stateless ones use the signed double-submit cookie, with the token bound to the session by an HMAC.
- `Sec-Fetch-Site` is the primary signal for rejecting cross-site state-changing requests. Fall back to checking `Origin` for browsers without Fetch Metadata.
- A missing header or `Origin: null` does not prove a same-origin request. Reject it or require a token.
- APIs called by scripts can require a custom request header. That forces a CORS preflight for cross-origin callers.
- `SameSite` cookies are defense in depth, never the only CSRF defense.
- XSS defeats every CSRF defense, so also follow the HTML rules in the sinks file.

## JSON Web Tokens

- Validate with a maintained library. Pass the expected algorithms as a fixed list, as RFC 8725 requires. The token header never picks the algorithm. Reject `none`. One key never accepts both public-key and MAC algorithms.
- Require `exp`. Reject a token at or after `exp` and before `nbf`. Allow at most a few minutes of leeway for clock skew.
- Check that `iss` is an issuer the deployment trusts and that the key belongs to that issuer. Check that `aud` contains this service's own identifier.
- An HMAC key is at least as long as the hash output, as RFC 7518 section 3.2 requires. That is 256 bits for HS256. It is never a password.
- Anyone holding the token can read its claims. Claims also leak through logs, browser storage, and referrer headers. Put no sensitive data in them.
- Keep access tokens short-lived. Revoke earlier through a denylist or a Token Status List when the product needs it.

## Secrets

- Use environment variables only when no secret manager is possible. Every process and many crash dumps can see them.
- Keep secrets out of `ENV` and `ARG` lines of a Dockerfile. Mask them when they must pass through output.
- Design for rotation, so changing a secret needs no code change.
- When a secret has been committed or logged, tell the user to rotate it. Removing it from the latest version does not remove the copies.
- Store keys in an HSM, a cloud key vault, or a secret manager, apart from the data they protect.
- The managing-dependencies-and-ci skill covers secrets in CI.

## Cryptography

- Encrypt with AES in an authenticated mode such as GCM or CCM. Use a key of at least 128 bits, preferably 256. Never use ECB.
- Use CTR or CBC only with a separate MAC in encrypt-then-MAC order.
- Generate tokens, keys, nonces, reset codes, and unguessable identifiers with the platform's secure random generator. Never use `Math.random`, Python `random`, `java.util.Random`, `System.Random`, or Go `math/rand`.
- A random UUID is a secret only when the implementation is known to use a secure generator.
- Compare secrets, MACs, and token hashes in constant time.

| Language | Function |
|---|---|
| Python | `secrets.compare_digest` |
| Node | `crypto.timingSafeEqual`, which throws a `RangeError` when lengths differ |
| Java | `MessageDigest.isEqual` |
| C# | `CryptographicOperations.FixedTimeEquals` |
| Go | `subtle.ConstantTimeCompare` |

## Cheat sheets

- [Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Credential Stuffing Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html)
- [Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Cross-Site Request Forgery Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [JSON Web Token](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html)
- [OAuth2](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)
- [Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [RFC 9700, OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700.html)
- [RFC 8725, JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725.html)
