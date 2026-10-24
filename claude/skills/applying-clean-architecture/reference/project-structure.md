# Project structure

An existing project's structure wins. Use these notes only for new modules.

## Contents

- Default layout
- Language rules
- Enforcing dependency direction

## Default layout

Each business module has the same three folders. The composition root sits outside all modules.

```
src/
  orders/
    domain/
    application/     use cases and ports
    adapters/        controllers, repositories, gateways
  infrastructure/    framework setup, database client, config
  main                composition root
```

## Language rules

- Python. Declare ports with `typing.Protocol` and requests and responses as dataclasses.
- TypeScript. Declare ports as interfaces in `application`.
- Java. Keep Spring, JPA, and Jackson annotations out of `domain` and `application`. Map JPA entities to domain objects in the persistence adapter.
- C#. Use one project per layer so the compiler enforces direction. Domain references nothing. Application references Domain. Infrastructure references Application. The API project references both and holds the DI setup.
- Go. Define an interface in the package that uses it, and only once a consumer needs it. Put repository code in a sub-package such as `postgres/` and handlers in `http/`. Put `main.go` under `cmd/`.

## Enforcing dependency direction

Run the check in CI and after each local change.

| Language | Tool |
|---|---|
| Python | import-linter with layers or forbidden contracts |
| TypeScript, JavaScript | dependency-cruiser, or ESLint `no-restricted-imports` |
| Java | ArchUnit tests |
| C# | separate projects, or NetArchTest |
| Go | separate packages under `internal`, plus depguard in golangci-lint |

Add a first rule that fails when `domain` or `application` imports an ORM, HTTP, or framework package.
