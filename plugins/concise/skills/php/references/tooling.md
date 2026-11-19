# PHPUnit, Rector and PHP-CS-Fixer

## PHPUnit 12 and 13

- PHPUnit 13 needs PHP 8.4 and gets bug fixes until 2028-02-04. PHPUnit 12 needs PHP 8.3 and gets bug fixes until 2027-02-05.
- Metadata goes in attributes such as `#[Test]`, `#[DataProvider('cases')]` and `#[CoversClass(Foo::class)]`. PHPUnit 12 removed support for metadata in doc-comments, so `@dataProvider` and `@test` are silently ignored and the test may not run at all.
- PHPUnit 12 removed `getMockForAbstractClass()`, `getMockForTrait()`, `getObjectForTrait()` and `MockBuilder::addMethods()`, so test through a concrete class.
- Use `createStub()` when the test checks no calls. Since 12.5 a test that creates a mock object with `createMock()` and configures no expectation gets a PHPUnit notice, and PHPUnit 13 hard-deprecates the `any()` matcher.
- `withConsecutive()` was removed in PHPUnit 10. On 13 use `withParameterSetsInOrder()` or `withParameterSetsInAnyOrder()`.
- PHPUnit 13 removed `assertContainsOnly()`, `assertNotContainsOnly()`, `containsOnly()`, `isType()` and `#[RunClassInSeparateProcess]`, so use typed variants such as `assertContainsOnlyString()` or `assertContainsOnlyInstancesOf()`. It added `assertArraysAreIdentical()`, `assertArraysAreIdenticalIgnoringOrder()`, `assertArraysHaveIdenticalValues()` and their `Equal` siblings, and sealed test doubles.
- PHPUnit 13.2 soft-deprecates `expectExceptionMessage()`, which matches a substring, in favour of `expectExceptionMessageIsOrContains()`.
- Since 13.2, `--order-by duration` and `--order-by size` are deprecated in favour of `duration-ascending` and `size-ascending`, and `--validate-configuration` checks `phpunit.xml`.

## Rector 2

- `->withPhpSets()` without arguments applies every PHP set up to the `composer.json` PHP version in one run. On an existing codebase start with `->withPhpLevel(1)` and raise the level one merged change at a time, or cap a run with `--max-changes=N`.
- `->withComposerBased()` without arguments loads the sets of every installed package it knows (PHPUnit, Symfony, Doctrine, Twig and others), bound to the installed versions. Any argument, such as `withComposerBased(phpunit: true)`, turns detection off and loads only those sets.
- After a package upgrade, `vendor/bin/rector process --composer-based --dry-run` runs only the rules bound to installed package versions, and `vendor/bin/rector composer-based` lists them.
- Many rules change only private members and final classes, so add `->withTreatClassesAsFinal()` when no code outside the project extends its classes.
- Rector 2.8 deprecated many niche rules that belong to no set. They still run and print a warning, and a future major removes them.
- Parallel mode can fail on Windows under PowerShell 7, so run it from cmd or Git Bash there.
- A rule fixture (`.php.inc`) without a `-----` line asserts that the rule leaves the file unchanged, so name such fixtures `skip_*.php.inc`.

## PHP-CS-Fixer 3

- Since 3.88 versioned sets are named `@PHP8x4Migration`, `@PHP8x5Migration` and `@PER-CS3x0`, and the old `@PHP84Migration` and `@PER-CS3.0` forms are deprecated.
- `@auto` applies the newest PER-CS set plus the migration sets for the `composer.json` PHP version, and `@auto:risky` adds the risky ones. `php-cs-fixer describe @auto --expand` lists the rules it enables.
- On a legacy codebase run `php-cs-fixer check --diff` first, because a whole-project fix touches every file and buries the real change.
