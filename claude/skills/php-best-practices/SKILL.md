---
name: php-best-practices
description: "PHP best practices. Use when reading or editing any .php or .phtml file, or composer.json."
paths: ["**/*.php", "**/*.phtml", "**/composer.json"]
---

# PHP best practices

Apply the **type-system-discipline** principle skill first. Read the PHP version the code runs on before writing syntax: `require.php` in `composer.json`, the Docker image, or `php -v` on the host that serves it. Legacy code without Composer runs on whatever its host has. Use features up to that version and none above it. In legacy files, match the file's existing style and touch only the code the task changes.

| Rule | Summary |
|------|---------|
| Strict types | New files start with `declare(strict_types=1);`. Add it to an existing file only when every caller passes correct scalar types, because it changes runtime behavior. |
| Native types everywhere | Parameter, return and property types on every function and property. `mixed` only at a boundary before parsing. Unions, `?T`, `never` and `void` as the version allows. |
| Value objects | Wrap a semantic primitive (an id, an email, an amount) in a small `final readonly` class (8.2) or a class with `readonly` properties (8.1) that validates in its constructor or a named constructor. Downstream code takes the class, not the string. This is PHP's branded type. |
| Typed shapes over arrays | An associative array that travels past one function becomes a readonly class. Arrays stay for lists and for raw data at the boundary before parsing. |
| Enums over constants | A backed `enum` (8.1) for a closed set of values. `Enum::from()` at the boundary, `tryFrom()` when an unknown value is an expected branch. |
| `match` over `switch` | `match` compares strictly, returns a value and throws `UnhandledMatchError` on a missing case. Give an enum `match` no `default` arm, so a new case fails loudly instead of falling through. |
| Strict comparison | `===` and `!==` only. Pass `true` as the strict flag to `in_array` and `array_search`. No `empty()` or truthiness checks where `"0"` or `0` is a legitimate value. |
| Errors are exceptions | Throw a specific exception class instead of returning `false` or `null` for a failure the caller must check. Catch only where you can handle it, and pass `previous:` when rethrowing. No `@` suppression. PDO throws by default since 8.0 and mysqli since 8.1, so keep those defaults. |
| Boundary parsing | `$_GET`, `$_POST`, `$_COOKIE`, `$_FILES`, `$_SERVER`, `php://input`, environment values, files and database rows are untrusted. Parse them once into typed objects with `filter_var`, `json_decode` with `JSON_THROW_ON_ERROR` and the project's validator, then trust the types inside. |
| SQL | Prepared statements with bound parameters in PDO or mysqli. Never put a value into SQL text. Table names, column names and sort directions come from an allow-list. |
| Output encoding | Escape by context: `htmlspecialchars($s, ENT_QUOTES \| ENT_SUBSTITUTE, 'UTF-8')` in HTML, `json_encode` with `JSON_HEX_TAG \| JSON_HEX_AMP \| JSON_HEX_APOS \| JSON_HEX_QUOT` inside `<script>`, `rawurlencode` in URLs, or the template engine's autoescaping. |
| Dangerous functions | No `eval`, `extract`, `create_function`, `assert` as a check, `unserialize` on external data (use JSON) or `$$` variable variables. For processes, use a PHP API first, then `proc_open` with an argument array (7.4), and `escapeshellarg` only where neither exists. |
| Secrets and crypto | `random_bytes` and `random_int` for tokens, `password_hash` and `password_verify` for passwords, `hash_equals` to compare secrets, `#[\SensitiveParameter]` (8.2) on secret parameters. Secrets come from the environment, never from code or logs. |
| Files and uploads | Resolve paths with `realpath` and check the result starts with the allowed base directory. For uploads, check `is_uploaded_file`, generate the stored name, and never trust the client's file name or MIME type. |
| Composer | PSR-4 autoloading, `composer.lock` committed, `composer install` in deploys and never `update`. Add a package only after checking it on Packagist. |
| Style | The project's style first, otherwise PER Coding Style, the successor of PSR-12. Run the project's fixer (PHP-CS-Fixer or PHP_CodeSniffer) with its config. |
| Static analysis | Run the project's PHPStan or Psalm at its configured level and fix new errors instead of adding them to the baseline. At minimum run `php -l` on every changed file. |
| Real tests | PHPUnit or Pest through public behavior. A real database in a transaction or a container instead of mocking the query layer. Mock only what you cannot run locally. |
| Logging | A PSR-3 logger with a context array. No `var_dump`, `print_r` or `echo` debugging in shipped code. |
| Modern syntax by version | First-class callables `strlen(...)` (8.1), readonly classes (8.2), typed class constants and `#[\Override]` (8.3), property hooks and asymmetric visibility (8.4), the pipe operator `\|>`, `clone($object, [...])` and `#[\NoDiscard]` (8.5). Use them only when the target version has them. |
| No comments | No PHPDoc or inline comments, per the Comments house rule of the **poteto-mode** skill. One exception: when the project runs PHPStan or Psalm and a native type cannot say it (`list<User>`, `array{id: int}`, generics), a docblock with only type tags such as `@param`, `@return`, `@var` and `@template`, and no prose, stays, because the analyzer needs it. |

Examples: `references/patterns.md`.
