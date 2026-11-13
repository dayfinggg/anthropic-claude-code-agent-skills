---
name: php
description: Current PHP 8.4 to 8.6 practice for the language, Composer, PHPStan, PHPUnit, Rector, PHP-CS-Fixer, Symfony and Doctrine DBAL and ORM. Use when writing, reviewing, debugging, testing or upgrading PHP code, when editing .php files, composer.json, composer.lock, phpstan.neon, phpunit.xml, rector.php or .php-cs-fixer.dist.php, when working on Symfony controllers, services, console commands, Messenger, security or config, or on Doctrine entities, repositories, DQL or DBAL queries, when Composer refuses an update or PHPStan or PHPUnit report errors or deprecations, when choosing which PHP, Symfony, PHPUnit or PHPStan version to target, and for quick PHP syntax questions.
---

## Read first

Do these steps now, in order, before anything else and whatever the task. The files hold the traps this skill depends on, and a skipped file or page is the usual cause of a wrong result.

1. Read `references/php-language.md` in full with the Read tool (PHP 8.4 idioms, PHP 8.5 features, PHP 8.5 deprecations and breaks, PHP 8.6 features (GA planned 2026-11-19), PHP 8.6 breaks, PHP 8.6 deprecations).
2. Read `references/symfony-doctrine.md` in full with the Read tool (Symfony versions, Removed in Symfony 8.0, Current Symfony idioms, Doctrine DBAL 4 (4.5 is current), Doctrine ORM 3 (3.7 is current)).
3. Open https://www.php.net/releases/active.php (Current PHP patch releases) and compare it with the facts below.
4. Open https://github.com/sebastianbergmann/phpunit/tags.atom (Current PHPUnit releases) and compare it with the facts below.
5. Open https://symfony.com/releases.json (Symfony versions and PHP floors) and compare it with the facts below.

## Check first

- Read `require.php` and `config.platform.php` in `composer.json`. Write code that runs on the lowest PHP version they allow.
- Read installed versions from `composer.lock` or `composer show --locked --direct`. Run `composer outdated --direct` for newer releases.
- Before raising the PHP floor, run `composer why-not php 8.5` to list the packages that block it.
- Run tools through the project's own configs and `composer.json` scripts: `phpstan.neon` or `phpstan.dist.neon`, `phpunit.xml` or `phpunit.xml.dist`, `rector.php`, `.php-cs-fixer.dist.php`, `config/bundles.php`.
- Facts verified 2026-11.

## Defaults

- PHP 8.5 is the newest stable branch. PHP 8.6.0 is at RC7 with general availability planned for 2026-11-19. Use 8.6-only features only when `require.php` excludes older versions.
- Security support ends 2026-12-31 for 8.2, 2027-12-31 for 8.3, 2028-12-31 for 8.4 and 2029-12-31 for 8.5. PHP 8.1 and older get no fixes.
- The minimum safe patch releases are 8.5.12, 8.4.27, 8.3.36 and 8.2.35, from 2026-10-21. Older builds have two critical unauthenticated remote code execution bugs (CVE-2026-109618, CVE-2026-109619). Pin at least these wherever a PHP version is pinned.
- Symfony 8, PHPUnit 13 and DoctrineBundle 3 need PHP 8.4 or later. Symfony 7.4 LTS needs PHP 8.2.

- Composer 2.11.2 is current. It fixes command execution and credential leaks triggered by a crafted `composer.lock`. Run `composer self-update` before installing a lock file from an untrusted source.
- Since Composer 2.9, `update`, `require` and `remove` refuse versions with security advisories (`config.policy.advisories.block` defaults to true). Move to a patched version. Ignore an advisory that does not apply by its ID, with a reason, under `config.policy.advisories.ignore-id`.
- Since Composer 2.10, `config.policy` replaces `config.audit`. The legacy `audit` keys are read only when the matching `policy` section is absent. Versions flagged as malware are also blocked during `install`. A failed dist download no longer falls back to a source checkout.
- Composer 2.11 adds `config.policy.cooldown.period`, such as `"7 days"`, which withholds fresh releases from updates. `--no-cooldown` skips it for one run. `--no-blocking` replaces the deprecated `--no-security-blocking`.
- `composer update --minimal-changes` (2.9+) changes only what the edited constraints require.

- PHPStan 2.3 is current. Level 10 is the top level. It also reports implicit `mixed` that comes from untyped code.
- PHPStan 2 rejects configs that set `checkMissingIterableValueType`, `checkGenericClassInNonGenericObjectType`, `checkAlwaysTrue*` or `excludes_analyse`. Ignore the identifiers `missingType.iterableValue` or `missingType.generics` instead, and use `excludePaths`. A path that may not exist needs a `(?)` suffix. phpstan-symfony 2 reads `containerXmlPath`, not `container_xml_path`.
- Suppress one error with `// @phpstan-ignore argument.type (reason)`. The table output prints each identifier. `@phpstan-ignore-next-line` hides every error on the line, and `reportIgnoresWithoutComments: true` (2.1.41+) bans it.
- PHPStan 2.3.5 adds `phpstan analyse --fix`. It rewrites source files for fixable errors and removes unmatched ignores and baseline entries, so review its diff. Prune a stale baseline with it rather than with `--generate-baseline`, which also absorbs every new error.
- PHPStan 2.2 adds unsealed array shapes such as `array{id: int, ...<string, mixed>}`. With bleeding edge, plain shapes reject extra keys.
- The PHPStan 2.3 rules for unused variables and parameters, and closure type inference from later usage, run only with bleeding edge: include `phar://phpstan.phar/conf/bleedingEdge.neon`.

- PHPUnit 13.4 is current and needs PHP 8.4. PHPUnit 12 needs PHP 8.3 and gets bug fixes until 2027-02-05. PHPUnit 14 is planned for 2027-02-05.
- PHPUnit metadata goes in attributes such as `#[Test]`, `#[DataProvider('cases')]` and `#[CoversClass(Foo::class)]`. PHPUnit 12 and later ignore docblock annotations like `@dataProvider`.
- PHPUnit 12 removed `getMockForAbstractClass()` and `getMockForTrait()`. Test through a concrete class.
- Use PHPUnit `createStub()` when the test verifies no calls. Since 12.5 a `createMock()` double without `expects()` triggers a notice. In 13, `any()` and `with()` without `expects()` are hard-deprecated. `#[AllowMockObjectsWithoutExpectations]` opts a test out.
- PHPUnit `withConsecutive()` is gone. Use `withParameterSetsInOrder()` or `withParameterSetsInAnyOrder()` (13.0).
- PHPUnit `expectExceptionMessage()` matches a substring and is deprecated since 13.2. On 13.2 and later use `expectExceptionMessageIs()` for an exact match or `expectExceptionMessageIsOrContains()`.
- PHPUnit 13 removed `assertContainsOnly()`, `isType()` and `#[RunClassInSeparateProcess]`. Use typed variants such as `assertContainsOnlyString()` or `assertContainsOnlyInstancesOf()`. It added `assertArraysAreIdenticalIgnoringOrder()`, `assertArraysHaveIdenticalValues()` and their loose `Equal` siblings, and `seal()` for test doubles.

- In Rector 2, `->withPhpSets()` without arguments applies every PHP set up to the `composer.json` version in one run. On an existing codebase start with `->withPhpLevel(1)` and raise the level one merged PR at a time, or cap a run with `--max-changes=N`. `->withComposerBased(phpunit: true, symfony: true, doctrine: true)` loads the rules that match installed package versions, and `vendor/bin/rector process --composer-based --dry-run` runs only those after a package upgrade.
- PHP-CS-Fixer 3.88 renamed versioned sets to the `@PHP8x4Migration` and `@PER-CS3x0` form. The old `@PHP84Migration` and `@PER-CS2.0` names are deprecated. `@auto` applies the newest PER-CS plus the migrations for the `composer.json` PHP version.
- For locks, indexes and migration safety see concise:database.

## Gotchas

- In a pipe chain an arrow function needs parentheses, as in `$s |> (fn($x) => trim($x, '/'))`. Without them PHP 8.5 raises a fatal error. The right side must take exactly one parameter, and not by reference.
- `clone($obj, ['prop' => $v])` honours visibility. A readonly property is `protected(set)` by default, so the call fails outside the class. Call it inside a `with*()` method. It skips the constructor, so validation must live in property hooks or in that method.
- `(void) f();` discards a `#[\NoDiscard]` result only as a statement. Inside an expression it is a parse error.
- `curl_close()`, `curl_share_close()`, `finfo_close()`, `imagedestroy()`, `xml_parser_free()` and every `setAccessible()` reflection call are deprecated no-ops in 8.5. Delete them.
- `PDO::MYSQL_ATTR_*`, `PDO::PGSQL_*` and `PDO::SQLITE_*` constants are deprecated in 8.5. On 8.4 and later use `Pdo\Mysql::ATTR_SSL_CA` and the other driver subclasses.
- `array_find()`, `array_find_key()`, `array_any()` and `array_all()` call the callback with `($value, $key)`. A first-class callable of a one-parameter built-in such as `is_numeric(...)` then throws `ArgumentCountError`, and `intval(...)` takes the key as `$base`. Pass `fn($v) => is_numeric($v)`, or on 8.6 `is_numeric(?)`.
- A parameter like `Foo $x = null` is deprecated since 8.4. Write `?Foo $x = null`.
- Throwing `RecoverableMessageHandlingException` from a Messenger handler retries regardless of `max_retries`, so a permanent failure loops forever. On Symfony 8.1 pass `forceRetry: false` to keep the limit, or throw another exception.
- With a Composer cooldown set, a full `composer update` replaces a locked version that is still inside the period with an older release, or fails. Update single packages, or list trusted ones under `config.policy.cooldown.ignore`.
- Doctrine DBAL 4 `datetime`, `date` and `time` types reject `DateTimeImmutable`. Map such properties to `datetime_immutable`, `date_immutable` or `time_immutable`.
- Rector resolves types through PHPStan. On a `mixed` value it cannot rename the call, add a return type or remove dead code, and a PHPStan baseline hides those unknown types. Fix the types before expecting Rector to change such code.
- Many Rector rules change only private members and final classes. Add `->withTreatClassesAsFinal()` when no code outside the project extends its classes.
- Rector's parallel mode can fail on Windows under PowerShell 7. Run it from cmd or Git Bash there.
- A Rector rule fixture (`.php.inc`) without a `-----` line asserts that the rule leaves the file unchanged. Name such fixtures `skip_*.php.inc`.
