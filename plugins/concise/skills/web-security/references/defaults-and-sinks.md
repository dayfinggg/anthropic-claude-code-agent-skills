## Fail-open defaults

- Judge by what runs, not by the name. `os.environ.get('SECRET_KEY', 'dev')` runs with a known key when the variable is missing, while `os.environ['SECRET_KEY']` refuses to start. The second is the secure form.
- Fallback secrets: `process.env.JWT_SECRET || 'secret'`, `ENV.fetch('SECRET_KEY_BASE', 'x')`, `getenv('API_TOKEN', 'changeme')` feeding signing, encryption, sessions or tokens. Report them even though the value comes from configuration.
- Security switches whose unset value is off: `REQUIRE_AUTH` defaulting to `'false'`, `DEBUG` defaulting to true, CORS origins defaulting to `*`, signature checks gated by an optional flag.
- Development bypasses keyed on `NODE_ENV !== 'production'` or `APP_ENV != 'prod'` turn on in any deployment that forgets to set the variable.
- Errors that allow: a catch-all in auth middleware that calls `next()`, `except Exception: return True` in a permission check, a feature-flag or policy service timeout treated as allowed, token or signature verification errors that are logged and ignored.
- Seeded default accounts and passwords, and admin routes enabled by default.
- Skip values generated at random per boot, values used only as cache keys or IDs, and code that only runs in tests.

## Credentials in serialization sinks

- A leak needs a holder and a sink, often added months apart. The holder is a credential stored on an object with generated serialization. The sink is code that serializes whole objects or every argument: `logger.info("%s", obj)`, `str(value)` in a tracing decorator, `span.set_attribute(k, obj)`, error context, cache entries, queue payloads, API responses. Report either half alone and search the whole repository for the other half.
- Python field flags block only some paths:
  - `dataclasses.field(repr=False)` and `attrs.field(repr=False)` hide the field from `repr` and `str` but not from `asdict`.
  - Pydantic `Field(repr=False)` still appears in `model_dump`, and `Field(exclude=True)` still appears in `repr`. Only both flags together block every generated path.
  - `SecretStr` redacts `repr`, `str` and dumps, but `pickle` and recursive `vars` walks reach the raw value.
  - `vars(obj)`, `obj.__dict__`, `pickle` and `json.dumps(obj, default=vars)` expose every stored attribute whatever the flags.
- JavaScript and TypeScript: a TypeScript `private` field is still an own enumerable property, so `JSON.stringify`, `util.inspect`, spreads and loggers include it. A `#private` field is excluded from all of them. A custom `toJSON` covers only JSON serialization, while `util.inspect` and `console.log` ignore it.
- Error reporters that capture local variables or request bodies, and request-logging middleware that dumps headers, record `Authorization`, `Cookie` and API keys.
- API handlers that return ORM entities directly expose password hashes, tokens, internal flags and other tenants' foreign keys. Return an explicit response schema.
- A credential read inside a method or held in a closure is not stored on the object and does not leak this way. A refactor that moves it onto a field creates the holder.
- Fix the holder by blocking every generated path, using a redacting type, or not storing the value. Fix the sink by logging an allowlist of scalar keys and `type(value).__name__` for everything else. Prove it with a test that serializes the object with the sink's own serializer and asserts the secret string is absent.
