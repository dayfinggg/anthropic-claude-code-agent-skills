# Secrets, cryptography, and private outputs

## Keep credentials outside public artifacts

When adding integration credentials, obtain only the needed record from the user's authorized store or the project's runtime secret mechanism, and keep values out of source, command output, URLs, prompts, fixtures, browser bundles, source maps, and container layers, because browser code cannot keep a shared backend credential confidential, and a variable named secret or kept in a local environment file is not automatically protected from a frontend build. Check the produced client assets and failure output using a dummy marker, and verify that the browser receives only the public configuration the feature requires.

<example>
The mail API key stays in the Go server's environment and is read with `os.Getenv("MAIL_API_KEY")`, and after the frontend build a Grep search of `dist/` for `DUMMY_KEY_123` finds nothing.
</example>

When a runtime consumes secrets, scope credentials to the operation, service, and environment, prefer short-lived workload identity where supported, and validate required security configuration without substituting a shared default, because a secret manager controls access but does not make a secret safe after it enters logs or process arguments. Check missing credentials, a denied store read, and the wrong environment's identity, and confirm that the application fails the protected operation without printing the value or escalating to a more privileged credential.

<example>
The staging ingest worker's database user can only `SELECT` and `INSERT` on `sensor_readings`, and when `DB_PASSWORD` is empty the Python startup code raises "database credentials missing" and does not connect as `postgres`.
</example>

When a credential is exposed, identify the affected uses without repeating its value, revoke or rotate it through the authorized owner, and verify that the replacement reaches the intended consumers, because removing the latest file, masking future output, or restarting the service does not invalidate stolen copies. Leave unrelated access and repository history alone, because rotation can have availability and data-decryption consequences. Check that the exposed credential no longer authenticates and that the new scoped credential works through an authorized test path.

<example>
A committed `appsettings.json` shows a live SMTP password, so the response lists which services read it, asks the account owner to rotate it, and confirms that the old password gets an authentication error while the nightly payroll mailer works with the new one.
</example>

## Choose protection for the actual asset

When storing passwords, use the identity framework's adaptive salted password hashing and verification APIs with current supported parameters chosen for the deployment's performance and policy requirements, because encryption or a fast digest lets an attacker who copies the table test guesses quickly or recover the passwords. Existing hashes may call for compatibility with rehash-on-success and not a bulk replacement that locks users out. Check incorrect passwords, malformed stored hashes, supported long inputs, and a legitimate legacy login, and confirm that a rejected input is never silently truncated into another accepted credential.

<example>
Python code stores `PasswordHasher().hash(pw)` from `argon2-cffi` and verifies with `verify(hash, pw)`, and after a successful login `check_needs_rehash(hash)` triggers a replacement hash, while a row that still holds an `md5` value is verified once with the legacy check and replaced in that same login.
</example>

When confidentiality and integrity require application encryption, use a maintained high-level authenticated-encryption API, let the library manage nonce handling where possible, satisfy the chosen construction's uniqueness and usage limits, keep key material separate from protected data, and plan recovery and rotation, because encoding is not encryption, ciphertext does not enforce object authorization, and authenticated encryption does not prevent replay by itself. Check modified and truncated ciphertext, a wrong key, and an authentication-tag failure, and confirm that no unauthenticated plaintext is returned or processed, including in error paths.

<example>
Java code uses `AES/GCM/NoPadding` with a fresh 12-byte `SecureRandom` IV stored next to the ciphertext and a key from the secret store, and flipping one byte makes `Cipher.doFinal` throw `AEADBadTagException`.
</example>

When creating session identifiers, reset credentials, keys, or unpredictable handles, use the platform's cryptographic random generator and an encoding suitable for the protocol, because timestamps, counters, ordinary random functions, and some UUID implementations do not provide secrecy, and unpredictability does not replace an access check or expiry. Read the exact generator guarantees in the installed version's documentation and not a length copied from an unrelated protocol. Check that production cannot select a fixed handle or a deterministic test generator, and that expired or wrong-user handles are rejected.

<example>
The share-link token is `crypto.randomBytes(16).toString('hex')` and not `md5(Date.now().toString())`, and `GET /share/:token` still checks the token's `expires_at` and `document_id`.
</example>

## Prevent secondary copies from widening access

When serializing private records, define the returned fields explicitly, inspect nested objects, exports, error details, file metadata, and third-party telemetry, keep only the data the authorized feature requires, and apply established retention rules to derived copies, because encryption at rest does not protect an overbroad API response. Leave unrelated customer data and invented legal retention obligations out of the change. Check another user, a public response, and a triggered error using distinguishable dummy records, and confirm that the private marker appears in no unauthorized channel.

<example>
The members API declares a `MemberOut` response model with only `id` and `name` and not the whole ORM row, so `email` and `password_hash` never appear in `/api/members`, and a forced SQL error returns a generic 500 page.
</example>

When caching personalized data, partition cache entries by the authority and resource dimensions that data needs, including tenant and relevant permission state or invalidation when those change, and set browser and shared-cache behavior to fit the data's sensitivity, because a session check on a cache miss does not secure a hit and a URL-only key can mix users. Check identical requests by users with different access, a permission change, and logout followed by browser navigation, and inspect the cached bytes and not merely whether a new backend query ran.

<example>
A page cache keyed on `/dashboard` shows one customer's name to the next visitor, so the key becomes `dashboard:{user_id}:{plan}` and the account page sends `Cache-Control: private, no-store`.
</example>

## Make logs useful without turning them into a leak

When logging security decisions, record bounded actor, operation, target identifier, decision, and outcome metadata in structured fields, exclude credentials, raw sessions, authorization headers, and unnecessary personal content, encode untrusted fields for the log format, and restrict access to the logs themselves, because redaction by field name or regular expression alone can miss transformed values and line-breaking input can forge extra records. Check a dummy secret in nested error data and line-breaking input in an identifier, and verify that useful denial evidence remains without the secret or forged records.

<example>
Each audit line is JSON such as `{"actor":42,"op":"project.delete","target":88,"decision":"deny"}`, and a username of `bob\n{"decision":"allow"}` is written as one escaped string.
</example>

When logging or an error handler fails, preserve the operation's authorization and privacy invariants, return the project's safe public error, and keep diagnostics within an authorized channel, because a generic privileged fallback or a leaked stack trace turns a logging fault into a disclosure. Ordinary telemetry failure need not stop unrelated safe work, while operations that require durable audit evidence follow their explicit fail-closed policy. Check full storage, an unavailable logging transport, and an exception containing dummy private data, and verify that no authorization bypass, partial protected action, or sensitive response appears.

<example>
If writing to `audit.log` fails on a full disk, the `POST /invoices/88/void` handler returns a generic 500 and does not void the invoice because that action requires an audit record, while a failed page-view counter write is ignored.
</example>
