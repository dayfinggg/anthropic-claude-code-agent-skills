---
name: applying-clean-architecture
description: Keeps business rules independent of frameworks and ORMs with ports and adapters. Use for clean or hexagonal architecture, layers, module structure, dependency direction, or ORM imports in core code.
---

# Applying clean architecture

Source dependencies point only inward. Domain and application code never name a framework, ORM, HTTP, UI, or driver type.

- Domain holds entities, value objects, and invariants with no I/O. Application holds use cases named in business terms and their ports.
- A use case declares a port for each outward need, such as storage, an external API, the clock, or messaging. An adapter implements it.
- Data crossing inward is a plain request or response structure. ORM models, HTTP requests, and database rows stop in the adapters.
- Business rules live in the domain or a use case. Every entry point, such as a controller, job, or CLI command, calls the same use case.
- Adapters validate and sanitize input. Use cases enforce authorization. Adapters never return ORM objects or internal error types to clients. See writing-secure-code.
- One composition root creates every concrete adapter. It reads environment config once into a typed settings object validated at startup.
- Inner layers never read environment variables or config files.

## Workflow

1. Search for an existing port, use case, or helper before adding one.
2. Put new code in the layer that owns the rule, then wire it in the composition root.
3. Run the project's dependency check after each change. Fix failures before moving on.
4. When new code replaces an old path, delete the old path in the same change.
5. If the project has no dependency check, add one.

## Reference files

- [reference/project-structure.md](reference/project-structure.md) holds folder layout, language rules, and dependency check tools. Read it when creating modules or adding a check.
- [reference/situations.md](reference/situations.md) covers sizing the architecture, legacy systems, module boundaries, and tests. Read it when the project is not a plain new service.
