# Language idioms

Project configuration, formatters, and linters win over this file.

- Python. Catch specific exceptions and re-raise with `raise ... from err`. Use `None` as the default instead of a mutable default argument.
- TypeScript. Use `strict` mode and `unknown` with narrowing instead of `any`. Handle every rejected promise.
- Java. Use `Optional` only for return values, not for fields or parameters.
- C#. Avoid `async void` outside event handlers. Async methods return `Task`.
- Go. Wrap errors with context, as in `fmt.Errorf("load config: %w", err)`. Define interfaces in the package that uses them. Pass `context.Context` first in functions that do I/O.
- Rust. Return `Result` and use `?`. In library code, treat `unwrap` as a bug and use `expect` only with a documented invariant.
- PHP. Follow PER Coding Style, which replaces PSR-12. Use `declare(strict_types=1)` and prepared statements for every query.
- Shell. `set -euo pipefail` is a partial safety net. Check critical commands explicitly, quote every expansion, and run `shellcheck` when available.
