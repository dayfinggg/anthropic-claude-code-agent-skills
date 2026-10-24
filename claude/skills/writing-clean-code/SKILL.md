---
name: writing-clean-code
description: Applies clean code rules when writing, changing, or reviewing code. Use for refactor, code review, error handling, duplication, over-engineering, scope creep, and checking agent-written code.
---

# Writing clean code

## Priorities

1. Correctness for all valid inputs. Never hard-code values or special-case inputs to pass a test.
2. Project conventions, linters, formatters, and CLAUDE.md win over every rule here.
3. Scope. Change only what the task needs and mention other problems instead of fixing them.
4. Simplicity. Build for the current task and add an abstraction once a second real variant exists.

## Rules

- Fix the root cause. Do not suppress an error, and do not delete, weaken, or special-case a failing test. If the test is wrong, say so.
- Handle every error or pass it up with context. Never leave an empty catch block.
- Validate at system boundaries such as HTTP input, files, environment variables, queues, and external APIs. Inside the system, trust types and contracts.
- Extract a function for repeated logic or a block that needs a comment. Length alone is no reason.
- Merge only duplicated knowledge, meaning one rule kept in two places. Code that only looks alike stays separate until a third use shows the shared rule.
- Search for an existing helper before writing a new one. Agents copy code more often than they reuse it.
- Comments explain why. Add no comments, docstrings, or type annotations to code you did not change.
- Fix a smell only when it hurts the current change or the user asked for a refactor.
- Do not chase every review finding. Extra layers, defensive code, and tests for impossible cases are over-engineering.
- Put refactoring in a separate change from new behavior.

## Before finishing

1. Run the project's formatter, linter, type checker, and tests, and fix what they report.
2. Review the diff. It holds only what the task needs.
3. Report the commands you ran, their results, and what you did not verify.

## Reference files

- [reference/situational-rules.md](reference/situational-rules.md) covers failure handling, shared state, parameters, dependencies, risky refactors, and exceptions. Read it for those cases.
- [reference/language-idioms.md](reference/language-idioms.md) lists non-obvious rules per language. Read the section for your language.
- [examples.md](examples.md) shows an over-engineered and a right-sized solution to one task. Read it when a change adds an abstraction.
