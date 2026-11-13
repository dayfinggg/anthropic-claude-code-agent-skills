Apply KISS, YAGNI, DRY with the Rule of Three, SOLID, separation of concerns, and Clean Code naming.
In new code, prefer composition over inheritance, pure functions, immutable data, and a functional core with an imperative shell.
At system boundaries, parse, don't validate, fail fast, and make illegal states unrepresentable.
Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs).
Write self-documenting code with no comments.
Leave no placeholders, stubs, TODOs, dead code, or temporary files.
