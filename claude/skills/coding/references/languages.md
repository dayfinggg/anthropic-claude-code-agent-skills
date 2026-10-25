# Language idioms and standards

Read only the sections for languages being changed. For a boundary between two languages, read both sections.

## Separate requirements from recommendations

Treat language and runtime semantics as requirements, the project's adopted style standard and configured checks as binding where they apply, and books and ecosystem preferences as conditional guidance, because only the first two break builds or behavior when ignored. Check the actual language version and project configuration before choosing an idiom, and do not carry another language's naming, error model, or formatting over.

<example>
A project pinned to Python 3.9 cannot use `match`, and Go's error-return style is not carried into a PHP codebase that uses exceptions.
</example>

Style guides that recommend docstrings or comments do not override the rule against unrequested comments. When an enforced documentation check would fail, name the exact conflict in the answer instead of adding the prose or disabling the check, because each silent option breaks one of the two rules. Required notices and executable directives are not explanatory comments and stay.

<example>
When `pydocstyle` in CI demands a docstring on a new function nobody asked to document, the answer reports that conflict, and an existing `# noqa` or license header stays untouched.
</example>

## Python

When the project leaves style open, follow PEP 8 naming and formatting, keep existing public names even when they break PEP 8, and take line length from the configured formatter and linter, because renaming a public function breaks its importers and the project's tools decide the limit.

<example>
A legacy `getUserName()` keeps its name, a new helper is `get_user_email()`, and the line length comes from `ruff.toml`.
</example>

Test optional values with `is None` when `0`, `""`, or `[]` are valid data, catch the specific exception around the smallest operation that raises it, and use `with` or `try/finally` for cleanup, because a truthiness check drops valid zeros and a broad `except` hides unrelated bugs. Check zero, empty input, and an exception raised later in processing.

<example>
`if quantity is None:` instead of `if not quantity:`, and `except FileNotFoundError:` wrapped around the `open()` call only.
</example>

## Go

Format with `gofmt`, use `MixedCaps`, treat export capitalization as API, and return recoverable failures as `error` instead of panicking, because a capitalization change alters the package API and a panic crashes callers who could have handled the error. Check exported callers before renaming, and test the error path separately from a valid zero value.

<example>
Renaming `parseConfig` to `ParseConfig` exports it, so confirm that is wanted, and `LoadConfig` returns `Config{}, err` instead of calling `panic(err)`.
</example>

Define small interfaces on the consumer side for the capability it uses, pass the request `context.Context` through to keep cancellation, and give every started goroutine a defined exit, because producer-side interfaces written for mocking couple packages and a goroutine without an exit leaks. Check copied structs for shared backing slices or maps.

<example>
A handler that only reads users accepts an interface with one `GetUser(ctx, id)` method, and its worker goroutine returns when `ctx.Done()` closes.
</example>

## Rust

Borrow when a function only reads data, and take ownership only when it consumes or keeps the value, because a `clone()` added to silence the borrow checker copies data and hides the intended ownership. A justified clone is still allowed.

<example>
`fn count_words(text: &str)` borrows, while `fn store(name: String)` takes ownership because it keeps the value.
</example>

Return `Result` for recoverable failures and propagate it with `?`, keep `Option` for absence, and avoid `unwrap()` outside a proven invariant, because `unwrap()` turns an expected failure into a crash. Check the error branch explicitly.

<example>
`let cfg = fs::read_to_string(path)?;` instead of `.unwrap()`, and `find_user()` returns `Option<User>` because no match is a normal result.
</example>

## JavaScript

Use `const` for bindings that are not reassigned and `let` when they are, and leave unrelated legacy `var` declarations alone, because rewriting them changes scoping in code the task did not touch. Check hoisting and closures before replacing a `var` you do need to change.

<example>
A new `const total = items.length;` is fine, while an untouched `var` in another function stays.
</example>

Use strict equality unless coercion is part of the contract, and avoid truthiness checks where `0`, `""`, or `null` are valid values, because `==` and `if (!x)` treat valid data as missing. Check zero, the empty string, and absent values before changing an existing loose comparison.

<example>
`if (count === undefined)` instead of `if (!count)` when a count of `0` is valid.
</example>

## TypeScript

Narrow unknown external data before using it, and do not add `any`, unchecked `as` casts, or non-null `!` assertions just to compile, because type assertions perform no runtime check. Check under the project's real `strict` settings with invalid input.

<example>
A fetched response body is typed `unknown` and checked with a type guard or a schema validator before `user.name` is read.
</example>

Model variants with different required fields as a discriminated union instead of one type full of optional fields, because the compiler can then show which fields exist and flag a new variant that is not handled.

<example>
`{ kind: "ok"; value: number } | { kind: "error"; message: string }` instead of `{ value?: number; message?: string }`.
</example>

Keep an escape hatch that an incremental migration needs at the boundary where it is needed, because an `any` that spreads switches off checking in code that was checked.

<example>
A legacy module's return value is cast once inside an adapter, and the rest of the code receives a typed value.
</example>

## PHP

In a project that adopted PSR-1, apply its class, method, constant, and autoloading rules to changed code and keep property naming consistent with the project, because PSR-1 leaves property style open. Check autoloaded names and the configured standards checker.

<example>
A new class `InvoiceExporter` with a method `exportToCsv()`, while its properties follow the existing `$invoice_id` style.
</example>

Follow the coding style standard the project selected, PSR-12 or a PER version, and write only syntax the server's PHP version supports, because a newer standard does not authorize restyling and code using features the server lacks fails at runtime. Check syntax with the target server's PHP binary, since a newer local PHP proves nothing about the server.

<example>
On a host running PHP 8.0, avoid enums and `readonly` properties, which arrived later, and check the file with that host's own `php -l`.
</example>

## C++

Prefer an existing RAII handle for resources, make ownership transfer or borrowing explicit, and add a class hierarchy only for substitutable domain concepts, because manual `new` and `delete` leak on early returns and inheritance used for reuse couples unrelated classes. Check borrowed references against the owner's lifetime.

<example>
`auto file = std::make_unique<File>(path);` instead of a raw `new`, and a function that only reads the file takes `const File&`.
</example>

## PowerShell

Name a reusable cmdlet-style function with an approved verb in `Verb-Noun` form, because unapproved verbs trigger import warnings and make commands hard to discover. Check the verb's meaning with `Get-Verb`.

<example>
`Test-SiteStatus` instead of `Check-SiteStatus`, because `Check` is not an approved verb.
</example>

When a failure must reach `catch`, make that command's error terminating with `-ErrorAction Stop`, and check `$LASTEXITCODE` after native programs, because ordinary cmdlet errors and native exit codes do not throw. Check one failing cmdlet and one failing native command under the installed PowerShell version.

<example>
`try { Get-Item $path -ErrorAction Stop } catch { ... }`, and `git pull` followed by `if ($LASTEXITCODE -ne 0) { throw "git pull failed" }`.
</example>

## Other languages

For a language not covered here, use its official version-specific documentation and the project's existing tooling, because the nearest familiar language's rules for ownership, errors, nullability, and effects often do not hold.

<example>
Kotlin null handling follows the Kotlin documentation and the project's `ktlint` configuration, not Java habits.
</example>
