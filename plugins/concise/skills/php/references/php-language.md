## PHP 8.4 idioms

- When the floor is 8.4, chain on `new Foo()->bar()` without wrapping parentheses, and use `array_find()`, `array_find_key()`, `array_any()` and `array_all()` instead of search loops.
- Use property hooks and `public private(set)` instead of getter and setter boilerplate, `#[\Deprecated]` instead of `@deprecated` plus `trigger_error()`, and `Dom\HTMLDocument::createFromString()` for HTML5.
- `mb_trim()`, `mb_ucfirst()`, `request_parse_body()` for multipart bodies of non-POST requests, `BcMath\Number` and `PDO::connect()`, which returns a driver subclass, are all new in 8.4.

## PHP 8.5 features

- `#[\NoDiscard]` warns when a call result is unused. PHP 8.5 puts it on `DateTimeImmutable::modify()`, `add()`, `sub()` and the `set*()` methods, so a bare `$date->modify('+1 day');` now warns, and an error handler that throws on warnings turns it into an exception.
- `array_first()` and `array_last()` return `null` for an empty array and leave the internal pointer alone. They replace `reset()`, `end()` and `$a[array_key_last($a)]`.
- `Uri\Rfc3986\Uri` and `Uri\WhatWg\Url` are always available. Prefer them to `parse_url()` when a URL is validated or compared.
- Static closures and first-class callables work in constant expressions, such as attribute arguments, parameter defaults and constants.
- `#[\Override]` works on properties. `#[\Deprecated]` works on traits and constants. Static properties support asymmetric visibility. Promoted constructor properties can be `final`.
- `curl_share_init_persistent()` keeps DNS and connection caches across requests in the same worker.
- `Closure::getCurrent()` returns the running closure for recursion. `get_error_handler()` and `get_exception_handler()` read the current handlers.
- Fatal errors, including execution timeouts, now carry a backtrace (`fatal_error_backtraces`).

## PHP 8.5 deprecations and breaks

- The casts `(integer)`, `(boolean)`, `(double)` and `(binary)` are deprecated. Use `(int)`, `(bool)`, `(float)` and `(string)`.
- The backtick shell operator is deprecated. Use `shell_exec()`.
- A `case` label ending in `;` instead of `:` is deprecated.
- `null` as an array offset or as the key in `array_key_exists()` is deprecated. Use `''`.
- `__sleep()` and `__wakeup()` are soft-deprecated. Implement `__serialize()` and `__unserialize()`.
- `$http_response_header` is deprecated. Call `http_get_last_response_headers()` after the request.
- `SplObjectStorage::attach()`, `detach()` and `contains()` are deprecated. Use `offsetSet()`, `offsetUnset()` and `offsetExists()`.
- Driver methods on `PDO` such as `pgsqlCopyFromArray()` or `sqliteCreateFunction()` are deprecated. Use `Pdo\Pgsql::copyFromArray()` and `Pdo\Sqlite::createFunction()`.
- Incrementing a non-numeric string is deprecated. Use `str_increment()`.
- `DATE_RFC7231` and `DateTimeInterface::RFC7231` are deprecated.
- Casting a float that does not fit in an `int`, or casting `NAN`, now warns. Destructuring a non-array value other than `null` warns.
- `disable_classes` is removed. OPcache is always compiled in, and `zend_extension=opcache` warns.

## PHP 8.6 features (GA planned 2026-11-19)

- Partial function application: `str_replace('a', 'b', ?)` or `foo(1, ...)` returns a closure. `?` stands for one argument and `...` for the rest. The supplied arguments are evaluated when the closure is created, not when it is called. `new Foo(?)` is not supported. A partial without `...` drops extra arguments, so it suits callbacks.
- `clamp($value, $min, $max)` returns the nearest bound. It throws `ValueError` when `$min > $max` or a bound is `NAN`.
- Readonly properties may declare default values. The default counts as initialisation, so the constructor can no longer assign that property.
- `#[\Override]` works on class constants and enum cases. Enums may define `__debugInfo()`.
- The global `enum SortDirection { case Ascending; case Descending; }` exists. `symfony/polyfill-php86` provides it on older PHP, and Doctrine ORM 3.7 expects it.
- New APIs: `Time\Duration`, the `Io\Poll` polling API, `Uri\Rfc3986\UriBuilder` and `Uri\WhatWg\UrlBuilder`.

## PHP 8.6 breaks

- Session defaults change to `session.use_strict_mode=1`, `session.cookie_httponly=1` and `session.cookie_samesite=Lax`. A cross-site POST flow that needs the session cookie must set `SameSite=None` with `session.cookie_secure=1`. A custom session handler without `validateId()` and `create_sid()` now triggers a deprecation.
- `trim()`, `ltrim()` and `rtrim()` also strip form feed (`\f`) by default.
- `fclose()`, `file_put_contents()` and `copy()` return `false` when the final flush fails.
- `preg_grep()` returns `false` on a PCRE error instead of a partial array.
- A hard out-of-memory failure now aborts with exit code 134.

## PHP 8.6 deprecations

- `return` inside a `finally` block.
- Returning a value from `__construct()` or `__destruct()`, or making either a generator.
- `spl_object_hash()`: use `spl_object_id()`. `is_double()`, `is_long()`, `is_integer()` and `doubleval()`: use `is_float()`, `is_int()` and `floatval()`.
- `strcoll()` and `SORT_LOCALE_STRING`: use `Collator`. Also `metaphone()`, the mbregex `mb_ereg*` functions, and the third argument of `define()`.
- `SplFileObject::fgetcsv()`, `fputcsv()`, `setCsvControl()` and `getCsvControl()`. The global `fgetcsv()` and `fputcsv()` functions stay.
- `mysqli_stmt_init()`, `mysqli::stmt_init()` and `mysqli_get_charset()`.
- Passing an object to `array_walk()` or `http_build_query()`. Convert it with `get_object_vars()`.
- `ReflectionProperty::setValue()` with an object of another class, and `ReflectionMethod::invoke()` with an object for a static method.
- `let` or `is` as a class, function or constant name, `_` as a constant name, `readonly` as a function name, and `namespace` as a class constant name.
