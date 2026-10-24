---
name: applying-design-patterns
description: Adds or removes design patterns like Strategy, Factory, Observer, and Singleton only for a real smell. Use when weighing a pattern, when switches multiply, or when reviewing over-engineering.
---

# Applying design patterns

The project's existing pattern for a kind of problem wins. Resilience patterns belong to building-resilient-services.

- Start from a smell you can point to or a requirement that exists today, such as a second real variant. Otherwise write the plain solution.
- Name the cost in one sentence, covering new types, the extra hop, and what gets harder to change.
- Add the pattern only when today's gain is larger than that cost. In a review, give the user both.
- Use the simplest form. With first-class functions, a function or a map of functions replaces a Strategy, Command, or Template Method class.
- Use classes when a variant holds state, groups several operations, or the codebase already models variants as classes.
- Prefer the framework's own mechanism, such as middleware, events, or DI lifetimes, over a hand-written pattern.
- Make each introduce or remove step a named refactoring from refactoring.com. Keep behavior unchanged and apart from feature changes.
- Run the tests, build, or lint after each step and show the result. If no check exists, say the step is unverified.
- YAGNI rejects speculative features. It does not excuse tangled code.

## Reference files

- [reference/smells.md](reference/smells.md) maps code signals to patterns and lists over-engineering signs. Read it when picking a pattern or reviewing.
- [reference/catalog.md](reference/catalog.md) gives cost and refactorings per pattern. Read the row of every pattern you add or remove.
