# Fail-open defaults and credentials in serialization sinks

## Fail-open defaults

- Judge by what runs, not by the name. `os.environ.get('SECRET_KEY', 'dev')` runs with a known key when the variable is missing, while `os.environ['SECRET_KEY']` refuses to start, which is the secure form.
- Report fallback secrets that feed signing, encryption, sessions or tokens, such as `process.env.JWT_SECRET || 'secret'`, `ENV.fetch('SECRET_KEY_BASE', 'x')` and `getenv('API_TOKEN', 'changeme')`, even though the value comes from configuration.
- Security switches whose unset value is off include `REQUIRE_AUTH` defaulting to `'false'`, `DEBUG` defaulting to true, CORS origins defaulting to `*`, and signature checks gated by an optional flag.
- Development bypasses keyed on `NODE_ENV !== 'production'` or `APP_ENV != 'prod'` turn on in any deployment that forgets to set the variable.
- Errors that allow include a catch-all in auth middleware that calls `next()`, `except Exception: return True` in a permission check, a feature-flag or policy service timeout treated as allowed, and token or signature verification errors that are logged and ignored.
- A multi-step operation (debit, credit, record) that fails part way must roll back every step. Code that catches the error and carries on leaves the state half-written, and an attacker who can trigger the failure repeats the first step.
- Error responses that include stack traces, SQL text or internal hostnames give the attacker the next request.
- Seeded default accounts and passwords and admin routes enabled by default are findings too.
- Skip values generated at random per boot, values used only as cache keys or IDs, and code that only runs in tests.

## Credentials in serialization sinks

- A leak needs a holder and a sink, often added months apart. The holder is a credential stored on an object with generated serialization. The sink is code that serializes whole objects or every argument, such as `logger.info("%s", obj)`, `str(value)` in a tracing decorator, `span.set_attribute(k, obj)`, error context, cache entries, queue payloads and API responses. Report either half alone, and search the whole repository for the other half.
- Python field flags block only some paths.

| Field | Hidden from | Still exposed by |
|---|---|---|
| `dataclasses.field(repr=False)`, `attrs.field(repr=False)` | `repr`, `str` | `asdict` |
| Pydantic `Field(repr=False)` | `repr` | `model_dump` |
| Pydantic `Field(exclude=True)` | `model_dump` | `repr` |
| `SecretStr` | `repr`, `str` and JSON dumps, which show `'**********'` | `get_secret_value()`, `pickle`, recursive `vars` walks |

- Only both Pydantic flags together block every generated path, and `vars(obj)`, `obj.__dict__`, `pickle` and `json.dumps(obj, default=vars)` expose every stored attribute whatever the flags.
- In JavaScript and TypeScript, a TypeScript `private` field is still an own enumerable property, so `JSON.stringify`, `util.inspect`, spreads and loggers include it, while a `#private` field is excluded from all of them. A custom `toJSON` covers only JSON serialization, and `util.inspect` and `console.log` ignore it.
- Error reporters that capture local variables or request bodies, and request-logging middleware that dumps headers, record `Authorization`, `Cookie` and API keys.
- A credential read inside a method or held in a closure is not stored on the object and does not leak this way, but a refactor that moves it onto a field creates the holder.
- Fix the holder by blocking every generated path, using a redacting type, or not storing the value. Fix the sink by logging an allowlist of scalar keys and `type(value).__name__` for everything else. Prove the fix with a test that serializes the object with the sink's own serializer and asserts that the secret string is absent.
