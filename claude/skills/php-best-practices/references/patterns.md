# PHP patterns

Code examples for the rules in `SKILL.md`. The principles behind them are language-agnostic, see the **type-system-discipline** principle skill. The examples target PHP 8.2 or newer unless a section says otherwise.

## Value objects as branded types

Give each semantic primitive its own class that can only hold a valid value. Validate once, then pass the object.

Avoid this, where any string can be passed as an email and every caller must remember to validate:

```php
<?php
declare(strict_types=1);

function sendWelcome(string $email, string $name): void
{
}
```

Write this instead:

```php
<?php
declare(strict_types=1);

final readonly class Email
{
    private function __construct(public string $value)
    {
    }

    public static function parse(string $input): self
    {
        $normalized = strtolower(trim($input));
        if (filter_var($normalized, FILTER_VALIDATE_EMAIL) === false) {
            throw new InvalidArgumentException("Invalid email: {$input}");
        }
        return new self($normalized);
    }
}

function sendWelcome(Email $email, string $name): void
{
}
```

The private constructor makes `parse` the only way in, so an `Email` object is always valid.

## Enums and exhaustive `match`

A closed set of values is an enum. `match` without a `default` arm throws `UnhandledMatchError` when a new case appears, which works as the exhaustiveness check.

```php
<?php
declare(strict_types=1);

enum ArticleStatus: string
{
    case Draft = 'draft';
    case Scheduled = 'scheduled';
    case Published = 'published';

    public function isVisible(): bool
    {
        return match ($this) {
            self::Published => true,
            self::Draft, self::Scheduled => false,
        };
    }
}

$status = ArticleStatus::from($row['status']);
```

Use `tryFrom` and handle `null` when an unknown value is a normal branch, such as an optional filter in a query string.

## States as classes, not flag bags

Avoid a class where `published`, `publishAt` and `error` can contradict each other:

```php
<?php
declare(strict_types=1);

final class Publication
{
    public bool $published = false;
    public ?DateTimeImmutable $publishAt = null;
    public ?string $error = null;
}
```

Model each state as its own type, so only valid combinations exist:

```php
<?php
declare(strict_types=1);

interface PublicationState
{
}

final readonly class Unpublished implements PublicationState
{
}

final readonly class ScheduledFor implements PublicationState
{
    public function __construct(public DateTimeImmutable $at)
    {
    }
}

final readonly class PublishedAt implements PublicationState
{
    public function __construct(public DateTimeImmutable $at)
    {
    }
}

function label(PublicationState $state): string
{
    return match (true) {
        $state instanceof Unpublished => 'Draft',
        $state instanceof ScheduledFor => 'Scheduled for ' . $state->at->format('d.m H:i'),
        $state instanceof PublishedAt => 'Published ' . $state->at->format('d.m H:i'),
    };
}
```

## Parse the request once

Turn superglobals into a typed object at the edge. Code past this point takes the object and never touches `$_POST`.

```php
<?php
declare(strict_types=1);

final readonly class SaveArticleInput
{
    public function __construct(
        public int $articleId,
        public string $title,
        public ArticleStatus $status,
        public DateTimeImmutable $publishAt,
    ) {
    }

    public static function fromPost(array $post, DateTimeZone $zone): self
    {
        $id = filter_var($post['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($id === false) {
            throw new InvalidArgumentException('Article id must be a positive integer');
        }
        $title = trim((string) ($post['title'] ?? ''));
        if ($title === '') {
            throw new InvalidArgumentException('Title is required');
        }
        $publishAt = DateTimeImmutable::createFromFormat('!Y-m-d H:i', (string) ($post['publish_at'] ?? ''), $zone);
        if ($publishAt === false) {
            throw new InvalidArgumentException('Publish time must look like 2026-10-27 14:25');
        }
        return new self($id, $title, ArticleStatus::from((string) ($post['status'] ?? '')), $publishAt);
    }
}

$input = SaveArticleInput::fromPost($_POST, new DateTimeZone('Europe/Kyiv'));
```

Decode JSON with exceptions, so a malformed body fails at the boundary instead of turning into `null` deep inside:

```php
<?php
declare(strict_types=1);

$payload = json_decode(file_get_contents('php://input'), true, 64, JSON_THROW_ON_ERROR);
```

## Prepared statements

Values go through placeholders. Identifiers come from an allow-list.

```php
<?php
declare(strict_types=1);

function findArticles(PDO $db, int $authorId, string $sort): array
{
    $column = match ($sort) {
        'date' => 'published_at',
        'title' => 'title',
        default => throw new InvalidArgumentException("Unknown sort: {$sort}"),
    };
    $statement = $db->prepare("SELECT id, title FROM articles WHERE author_id = :author ORDER BY {$column} DESC");
    $statement->execute(['author' => $authorId]);
    return $statement->fetchAll(PDO::FETCH_ASSOC);
}
```

The same with mysqli, which throws on errors by default since PHP 8.1:

```php
<?php
declare(strict_types=1);

$statement = $mysqli->prepare('UPDATE articles SET title = ? WHERE id = ?');
$statement->bind_param('si', $input->title, $input->articleId);
$statement->execute();
```

## Output encoding

Escape at the moment of output, for the context the value lands in.

```php
<?php
declare(strict_types=1);

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
?>
<h1><?= e($article->title) ?></h1>
<a href="/search?q=<?= rawurlencode($query) ?>">Search</a>
<script>
const article = <?= json_encode($articleData, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR) ?>;
</script>
```

## Exceptions instead of `false`

Avoid return values the caller can forget to check:

```php
<?php
declare(strict_types=1);

function loadUser(PDO $db, int $id): array|false
{
    $statement = $db->prepare('SELECT * FROM users WHERE id = ?');
    $statement->execute([$id]);
    return $statement->fetch(PDO::FETCH_ASSOC);
}
```

Throw a specific exception, or return `null` only when absence is a normal outcome the type makes visible:

```php
<?php
declare(strict_types=1);

final class UserNotFound extends RuntimeException
{
}

function loadUser(PDO $db, int $id): User
{
    $statement = $db->prepare('SELECT id, email FROM users WHERE id = ?');
    $statement->execute([$id]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);
    if ($row === false) {
        throw new UserNotFound("User {$id} not found");
    }
    return new User((int) $row['id'], Email::parse($row['email']));
}
```

## Type tags for static analysis

When the project runs PHPStan or Psalm and a native type is too wide, a docblock with type tags only is allowed. No prose, no `@author`, no description lines.

```php
<?php
declare(strict_types=1);

/**
 * @param list<int> $ids
 * @return array<int, User>
 */
function loadUsers(PDO $db, array $ids): array
{
    return [];
}
```
