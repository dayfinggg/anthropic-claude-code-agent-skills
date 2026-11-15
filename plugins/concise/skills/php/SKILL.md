---
name: php
description: PHP practice for the language, legacy and custom-CMS code with Smarty templates, Composer, PHPStan, PHPUnit, Rector, PHP-CS-Fixer, Symfony and Doctrine. Use when writing, reviewing, debugging or upgrading PHP code or .tpl templates, editing composer.json, phpstan.neon, phpunit.xml or rector.php, when Composer refuses an update, when PHPStan or PHPUnit report errors or deprecations, or when choosing a PHP version to target.
---

# PHP

This skill matches PHP 8.5 (8.6.0 is at RC7, general availability planned for 2026-11-19), Composer 2.11, PHPStan 2.3, PHPUnit 13.4, Rector 2.8, PHP-CS-Fixer 3.95, Smarty 5.8, Symfony 8.1 and 7.4 LTS, Doctrine DBAL 4.6 and ORM 3.8. Run `php -v` and `composer show --locked --direct` to see what is installed. Where the installed release is newer, its own `--help`, changelog and `UPGRADING` notes are right.

## Check first

- Read `require.php` and `config.platform.php` in `composer.json`, and write code that runs on the lowest PHP version they allow. Before raising that floor, `composer why-not php 8.5` lists the packages that block it.
- In a custom CMS, find the house way before writing new code: its database wrapper (grep for `->query(`, `prepare(`, `mysqli_`, `new PDO`), how the Smarty object is set up (`setEscapeHtml`, `escape_html`, `default_modifiers`), and where request input is read.
- Run tools through the project's configs and `composer.json` scripts: `phpstan.neon` or `phpstan.dist.neon`, `phpunit.xml` or `phpunit.xml.dist`, `rector.php`, `.php-cs-fixer.dist.php`.

## Safe and fast code

- Start every new file with `declare(strict_types=1);`. Do not add it to an existing file you touch for another reason: it changes how every call in that file coerces scalars, and calls that worked start to throw `TypeError`.
- Compare with `===` and `!==`, and pass `true` as the strict flag to `in_array()`, `array_search()` and `array_keys()`. Loose `==` between numeric strings compares numbers, so `'1e3' == '1000'` is true.
- Bind every value in SQL: PDO `prepare()` plus `execute([...])`, or mysqli `execute_query($sql, [...])` (8.2+). Table names, column names and sort directions cannot be bound, so map them from an allowlist in code. `addslashes()` and hand-built quoting are not escaping.
- Never run a query inside a loop over rows. Collect the ids, fetch once with `WHERE id IN (?, ?, ...)` (one placeholder per id), index the result by id, then loop. Read Memcached the same way with `getMulti()`. Smarty plugins or modifiers that query per row are the same N+1 pattern.
- Escape at output. Smarty does not escape by default: unless the project turns auto-escaping on, write `{$var|escape}` in HTML text and attributes, `{$var|escape:'url'}` inside URLs and `{$var|escape:'javascript'}` inside inline script strings. In plain PHP templates use `htmlspecialchars($s)` (its default flags are `ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401` since 8.1).
- Cast or validate request input once where it enters, such as `(int) ($_GET['id'] ?? 0)`, and pass the typed value on. Pass shell commands as an array to `proc_open()`, which skips the shell, or wrap each argument in `escapeshellarg()`.
- Decode outside data with `json_decode($s, true, flags: JSON_THROW_ON_ERROR)`. php.net warns never to pass untrusted input to `unserialize()`, even with `allowed_classes => false`. That includes cookies, form fields and cache entries other code can write.
- Use `random_bytes()` or `random_int()` for tokens, `password_hash()` and `password_verify()` for passwords, and `hash_equals()` to compare secrets. `rand()`, `mt_rand()` and `uniqid()` are predictable.
- Large result sets: iterate with `fetch()` or a generator instead of `fetchAll()`. pdo_mysql buffers the whole result in PHP memory by default, so turn off `Pdo\Mysql::ATTR_USE_BUFFERED_QUERY` (`PDO::MYSQL_ATTR_USE_BUFFERED_QUERY` before 8.4) for exports.
- Look up membership with `isset($map[$key])` on an `array_flip()`ed list, not `in_array()` inside a loop. `array_merge()` inside a loop copies the array each time, so collect parts and merge once with `array_merge(...$parts)`.
- Legacy code stays in its own style: keep its database wrapper, globals, array syntax and naming in a file you fix, and add no types, namespaces or framework to it. Fix the unsafe line you touch (string-built SQL, unescaped output) and report the other unsafe lines you saw instead of rewriting them.

## Versions and Composer

- Security support ends 2026-12-31 for 8.2, 2027-12-31 for 8.3, 2028-12-31 for 8.4 and 2029-12-31 for 8.5. PHP 8.1 and older get no fixes from php.net.
- Builds older than 8.5.12, 8.4.27, 8.3.36 and 8.2.35 (2026-10-21) have two critical unauthenticated remote code execution bugs, CVE-2026-109618 and CVE-2026-109619, that reach every PHP-FPM site. Pin at least these patch releases wherever a version is pinned, or check that the distribution package carries the fix.
- Symfony 8, PHPUnit 13 and DoctrineBundle 3 need PHP 8.4. Symfony 7.4 LTS and PHPUnit 12 need PHP 8.2 and 8.3.
- Composer 2.11.2 fixes command execution and credential leaks triggered by a crafted `composer.lock` or `vendor/composer/installed.json`. Run `composer self-update` before installing a lock file from an untrusted source.
- `update`, `require` and `remove` refuse versions with security advisories (`config.policy.advisories.block`, default `true`). Move to a patched version. Ignore an advisory that does not apply by ID, with a reason, under `config.policy.advisories.ignore-id`. Since 2.10 `config.policy` replaces `config.audit`, whose keys are read only when the matching `policy` section is absent.
- `config.policy.cooldown.period` (2.11), such as `"7 days"`, withholds fresh releases. `--no-cooldown` skips it for one run, and `--no-blocking` replaces the deprecated `--no-security-blocking`.
- `composer update --minimal-changes` changes only what the edited constraints require. A failed dist download no longer falls back to a source checkout.

## PHPStan

- Level 10 is the top level and also reports implicit `mixed` from untyped code. PHPStan 2 rejects configs that set `checkMissingIterableValueType`, `checkGenericClassInNonGenericObjectType`, `checkAlwaysTrue*` or `excludes_analyse`: ignore the identifiers `missingType.iterableValue` or `missingType.generics` instead, and use `excludePaths`, with a `(?)` suffix for a path that may not exist.
- Suppress one error with `// @phpstan-ignore argument.type (reason)`, using the identifier the table output prints. `@phpstan-ignore-next-line` hides every error on the line, and `reportIgnoresWithoutComments: true` (2.1.41+) bans ignores without a reason.
- `phpstan analyse --fix` (2.3.5+) rewrites source files for auto-fixable errors and removes unmatched `ignoreErrors` entries, baseline entries and `@phpstan-ignore` comments, so review its diff. Prune a stale baseline with it, not with `--generate-baseline`, which also absorbs every new error.
- The unused-variable rules and closure type inference from later use run only with bleeding edge: include `vendor/phpstan/phpstan/conf/bleedingEdge.neon`.

## Gotchas

- With pdo_mysql's default emulated prepares, values passed to `execute([...])` are bound as strings, so `LIMIT ?` becomes `LIMIT '10'` and fails. Bind it with `bindValue(1, $n, PDO::PARAM_INT)`.
- Smarty `escape_html` (`setEscapeHtml(true)` in Smarty 5) is a compile-time setting. After changing it, clear the compiled templates, or old pages keep the old escaping. With it on, `{$var nofilter}` or Smarty 5 `{$var|raw}` prints unescaped and `|escape:'force'` escapes twice.
- In a pipe chain an arrow function needs parentheses: `$s |> (fn($x) => trim($x, '/'))`. Without them PHP 8.5 raises a fatal error.
- `clone($obj, ['prop' => $v])` honours visibility. A readonly property is `protected(set)` by default, so the call fails outside the class. Call it inside a `with*()` method. It skips the constructor, so validation must live in property hooks or in that method.
- `array_find()`, `array_any()` and `array_all()` call the callback with `($value, $key)`. `is_numeric(...)` then throws `ArgumentCountError`, and `intval(...)` takes the key as `$base`. Pass `fn($v) => is_numeric($v)`, or on 8.6 `is_numeric(?)`.
- A parameter like `Foo $x = null` is deprecated since 8.4. Write `?Foo $x = null`.
- With a Composer cooldown, a full `composer update` replaces a locked version still inside the period with an older release, or fails. Update single packages, or list trusted ones under `config.policy.cooldown.ignore`.
- Rector resolves types through PHPStan. On a `mixed` value it cannot rename a call, add a return type or remove dead code, and a PHPStan baseline hides those unknown types. Fix the types before expecting Rector to change such code.

## References

- [references/php-language.md](references/php-language.md): read when code may use or must avoid PHP 8.4, 8.5 or 8.6 syntax, functions or deprecations, or when upgrading PHP on a site.
- [references/tooling.md](references/tooling.md): read when writing or migrating PHPUnit tests, configuring Rector or PHP-CS-Fixer, or upgrading these tools.
- [references/symfony-doctrine.md](references/symfony-doctrine.md): read when the project requires `symfony/*` or `doctrine/*` packages.

Related skills: concise:database for locks, indexes and migrations, concise:server-ops for PHP-FPM, OPcache and deploys, concise:web-security for a security review, concise:codebase-analysis for wide mechanical changes such as a Rector run over many files.
