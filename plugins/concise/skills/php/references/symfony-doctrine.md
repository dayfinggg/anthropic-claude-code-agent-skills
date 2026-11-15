# Symfony and Doctrine

## Contents

- Symfony versions
- Removed in Symfony 8.0
- Symfony 8.1 changes and idioms
- Doctrine DBAL 4
- Doctrine ORM 3 and DoctrineBundle 3

## Symfony versions

- Symfony 7.4 is the LTS. It gets bug fixes until 2028-11 and security fixes until 2029-11. Symfony 6.4 is still maintained.
- Symfony 8.0 reached end of life in 2026-07. Symfony 8.1 is the stable line, maintained until 2027-01. Symfony 8.2 is in beta, ships in 2026-11 and is maintained until 2027-07.
- 7.4 and 8.0 have the same features. 8.0 only drops what 7.4 deprecates, so clear every 7.4 deprecation before the major upgrade.

## Removed in Symfony 8.0

- XML configuration for services and routes. Use YAML, attributes or PHP that returns `App::config([...])`.
- Fluent config-builder closures such as `return function (AcmeConfig $config) { ... }`. Return an array instead.
- `Request::get()`. Read `$request->attributes`, `$request->query` or `$request->request`.
- `UserInterface::eraseCredentials()` and `TokenInterface::eraseCredentials()`. Do not add the method to user classes. Strip secrets in `__serialize()` when the session must not hold them.
- `#[TaggedIterator]` and `#[TaggedLocator]`. Use `#[AutowireIterator]` and `#[AutowireLocator]`, and `!tagged_iterator` instead of `!tagged`.
- `Application::add()` and `Command::getDefaultName()`. Use `addCommand()` and `#[AsCommand]`.
- Option arrays in constraint constructors such as `new Assert\Length(['min' => 3])`. Pass named arguments, as in `new Assert\Length(min: 3)`.
- Automatic lookup of an entity from every matching route wildcard. `{id}` still resolves. For another field write `#[Route('/product/{slug:product}')]` or use `#[MapEntity]`.
- HTTP method override for `GET` and `HEAD` requests is ignored.

## Symfony 8.1 changes and idioms

- A console command is a class with `#[AsCommand('app:name')]` and `__invoke(#[Argument] string $name, #[Option] bool $force = false, ...): int`. It needs no `Command` parent (7.3+). Extend `Command` only for `initialize()` or `interact()`.
- 8.1 deprecates named autowiring aliases without `#[Target]`. Write `#[Target] StorageInterface $imageStorage` when the parameter name selects the alias.
- 8.1 deprecates writing public properties of `Request` and `Response` directly. `ParameterBag::getInt()` and `getBoolean()` now throw `UnexpectedValueException` for values they cannot convert instead of returning `0` or `false`.
- 8.1 deprecates `Bundle::registerCommands()`. Register commands with `#[AsCommand]` or the `console.command` tag.
- 8.1 Messenger routes messages that fail to decode through retry and the failure transport instead of deleting them.
- Throwing `RecoverableMessageHandlingException` from a Messenger handler retries regardless of `max_retries`, so a permanent failure loops forever. On 8.1 pass `forceRetry: false` to keep the limit, or throw another exception.
- `UuidFactory` generates UUIDv7 by default since 7.4.

## Doctrine DBAL 4

- `Connection::query()`, `exec()`, `executeUpdate()` and `Result::fetch()` and `fetchAll()` are removed. Use `executeQuery()`, `executeStatement()`, `fetchAllAssociative()`, `fetchAssociative()` and `fetchOne()`.
- The `url` connection parameter is removed from `DriverManager`. Parse URLs with `Doctrine\DBAL\Tools\DsnParser`. DoctrineBundle 3 still accepts `doctrine.dbal.url`, but not together with `host` or `dbname`.
- `Connection::PARAM_INT_ARRAY` and `PARAM_STR_ARRAY` are removed. Use `ArrayParameterType::INTEGER` and `ArrayParameterType::STRING`.
- `serverVersion` needs three parts, such as `'8.4.13'`. For MariaDB pass the `SELECT VERSION()` value, such as `'10.11.9-MariaDB-1'`, without a `mariadb-` prefix.
- `bigint` values come back as `int` when they fit. The `array` and `object` types are removed. DBAL 4.5 deprecates `simple_array` in favour of `json`.
- A nested `beginTransaction()` always creates a savepoint.
- DBAL 4.4 and ORM 3.6 deprecate string defaults such as `'CURRENT_TIMESTAMP'`. Use `new CurrentTimestamp()`, `new CurrentDate()` or `new CurrentTime()` from `Doctrine\DBAL\Schema\DefaultExpression`.
- DBAL 4.5 deprecates schema mutators such as `Schema::createTable()` and `Table::addColumn()` in favour of `Schema::edit()` and the table editors.
- DBAL 4.6 deprecates the mutable date and time types (`date`, `datetime`, `datetimetz`, `time`, `vardatetime`) and their `Types::*_MUTABLE` constants. Map such columns to `date_immutable`, `datetime_immutable` and the other `*_immutable` types. Schema introspection now returns the immutable types.
- The mutable types reject `DateTimeImmutable` values, so a property typed `DateTimeImmutable` needs an `*_immutable` column type.
- DBAL 4.6 deprecates support for MySQL 8.0 to 8.3 and MariaDB 10.6 to 10.10.

## Doctrine ORM 3 and DoctrineBundle 3

- Mapping uses attributes or XML. The annotation and YAML drivers are gone, also from DoctrineBundle 3.
- `EntityManager::merge()`, `flush($entity)`, `clear(Foo::class)`, `transactional()`, `EntityManager::create()`, `Query::iterate()` and named queries are removed. Use `wrapInTransaction()`, `new EntityManager($connection, $config)` and `toIterable()`.
- With DBAL 4, `#[ORM\GeneratedValue(strategy: 'AUTO')]` on PostgreSQL means an identity column, not a sequence. Existing `SERIAL` tables need a migration or `setIdentityGenerationPreferences()`.
- On PHP 8.4, ORM 3.5 deprecates running without native lazy objects. Call `$config->enableNativeLazyObjects(true)`. DoctrineBundle 3 always uses them and no longer accepts `proxy_dir`, `proxy_namespace`, `auto_generate_proxy_classes` or `enable_lazy_ghost_objects`.
- ORM 3.6 deprecates `WITH` as the condition of an arbitrary join. Use `ON`, and keep `WITH` for filtering association joins.
- ORM 3.7 deprecates `Doctrine\ORM\Tools\Pagination\Paginator`. Use `OffsetPaginator` with a `Window`, or `CursorPaginator`. It also deprecates `'ASC'`, `'DESC'` and `null` as sort directions in `orderBy()`, `addOrderBy()` and `#[ORM\OrderBy]` in favour of `\SortDirection::Ascending` and `\SortDirection::Descending`. ORM 3.8 accepts `SortDirection` in `findBy()` and `findOneBy()`.
- In ORM 3.7, `LockMode::NONE` no longer makes `find()` refresh an entity already in the identity map. Call `refresh()` explicitly. Passing `null` as lock mode is deprecated.
- ORM 3.8 moves the second-level cache into the `doctrine/orm-plugin-second-level-cache` package, which a project using it must require. It also deprecates running without the schema editor API (`Configuration::setUseSchemaEditorApi()`).
- DoctrineBundle 3 replaces `doctrine:query:sql` with `dbal:run-sql` and the `slaves` option with `replicas`.
