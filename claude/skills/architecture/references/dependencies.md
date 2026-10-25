# Dependencies and composition

## Direction follows the protected decision

When business behavior must run independently of UI, persistence, or an external provider, isolate that conversation behind a purpose-specific boundary and make the technology-specific translation depend on the application contract, because provider types that spread through the policy turn every provider change into a policy change. Check that the same use case runs through an alternate driver or a test adapter without changing its rules.

<example>
`ChargeCustomer` depends on a `PaymentGateway` contract with `charge(amount, token)`, `HttpPaymentGateway` implements it, and a `FakeGateway` runs the same use case in tests.
</example>

When applying dependency inversion, identify what is protected and the concrete change it should absorb, and define only the operations that consumer needs, because a function, a callback, an existing protocol, or a small interface is often enough, while an interface per class or an adapter per function adds files that absorb no change. Check that source dependencies no longer require the protected code to know the replaceable implementation.

<example>
A report job that needs the current time takes `now: Callable[[], datetime]` as a parameter instead of a `Clock` interface with a `SystemClock` class.
</example>

When a thin application already works clearly through its framework, keep direct use where it creates no material coupling problem, and introduce separation at the affected boundary only when reuse, testing, replacement, or policy complexity gives a current reason, because a preferred architecture label is not evidence and each forwarding layer adds something readers must know. Check that the change reduces the knowledge a reader needs.

<example>
A 12-route admin tool keeps its handlers calling the ORM directly, while a pricing engine reused by two apps gets its own module with no framework imports.
</example>

## Composition and lifecycle

When selecting concrete implementations, assemble the application near its actual entry point or framework bootstrap, pass required collaborators explicitly, and keep container lookups out of business operations, because hidden lookups conceal dependencies and make an operation hard to run in isolation. Registration helpers may organize the wiring without moving runtime resolution into every module. Check that real startup constructs the intended graph and that a representative operation uses the expected implementations.

<example>
`main.py` builds `SmtpMailer` and `OrderService(mailer)`, and `OrderService` never calls `container.get("mailer")`.
</example>

When several processes or independently hosted applications share modules, let each host compose its own graph and let a library supply capabilities without taking over application startup, because a shared bootstrap that owns startup grows into a global mutable registry that ties the hosts' lifecycles together. Check the existing scope and cleanup rules before changing wiring, and check startup, request isolation, and shutdown through the host's supported lifecycle.

<example>
A shared `billing` package exposes `create_billing(config)`, and the web app and the worker each call it in their own startup code with their own database pool.
</example>

When choosing between explicit construction and a dependency-injection container, keep the existing supported mechanism if it stays clear, and use a container only for a demonstrated composition need, because dependency injection does not require a container and a container adds lifetime and resolution rules to learn. Check that registrations resolve with correct lifetimes and that explicit construction remains available.

<example>
A service with six collaborators built in `main()` stays explicit, while a framework that already ships a request-scoped container keeps using it.
</example>

## External dependencies

When selecting an external library or service, compare its capability with existing facilities and the cost of owning an alternative, and inspect compatibility promises, supported platforms, tests, transitive requirements, maintenance, licensing, and upgrade responsibility, because package popularity and a successful import do not establish long-term suitability. Check a representative integration using the project's supported versions.

<example>
Before adding `pdf-forge` to the export service, read its license, list its native transitive dependencies on the Windows build agent, and render one real invoice with the versions pinned in `requirements.txt`.
</example>

When a dependency becomes hard to replace, locate the leaked assumptions before proposing a wrapper and isolate only the assumptions the application should own, because a wrapper that mirrors the entire vendor API keeps the lock-in and adds maintenance. Check that the proposed alternative can satisfy that smaller contract, including the behavior that matters.

<example>
A search vendor's query DSL appears in 40 files, so the team defines `search(text, filters, page)` for what the app really uses and moves the DSL behind it, instead of wrapping every vendor class.
</example>

## Extension points

When adding extensibility, identify an observed variation, a committed requirement, an isolation need, or a real migration, and compare its construction and maintenance cost with the later refactoring it avoids, because imagined future variants make every current reader pay for flexibility nobody uses, while one current implementation can still justify a boundary. Check that the current consumer becomes clearer and the named variation fits without exposing implementation details.

<example>
A second tax regime committed for next quarter justifies a `TaxRule` boundary now, while "maybe other countries someday" does not.
</example>

When variations differ only in data, use data or an existing configuration mechanism instead of a plugin system, and when behavior varies, choose the language's simplest suitable composition mechanism, because a plugin system for what a table can express costs more than the table. Remove hooks that the final design made unnecessary. Check that adding the real variant changes its owner and no unrelated consumer.

<example>
Two notification channels that differ only in subject prefix and sender address become two rows in `channels.toml`, while a channel that needs retries and its own templates gets a handler class.
</example>
