# Situations

## How much architecture

Spend indirection where the business logic is.

| Situation | Default |
|---|---|
| Script, prototype, thin CRUD | Use the framework directly. Keep rules in plain functions. |
| Service with real rules | Separate domain and use cases from the framework. Add ports only for I/O that tests must fake. |
| Large or long-lived system | Group modules by business capability, such as orders and billing, with the layers inside each. |
| CRUD-heavy features with little shared logic | Consider vertical slices per feature. Keep the dependency rule inside each slice. |
| Existing codebase | Keep its architecture. Move one feature at a time and never rewrite unasked. |

## Legacy and external systems

- Replace legacy parts gradually with the Strangler Fig pattern, usually behind a facade.
- Keep legacy and external models out of the core with an Anti-Corruption Layer.
- The Anti-Corruption Layer only translates. It holds no business rules or orchestration.
- Validate and sanitize input at that layer, because it joins systems with different trust levels.

## Modules

- Keep classes that change together in one component.
- The component graph has no cycles. Break one with dependency inversion or a new shared component.
- Start as a well-layered monolith. Extract a service only after its module boundary is stable.
- Name top-level folders for what the system does, not for the framework.
- Record a new module boundary with the recording-architecture-decisions skill.

## Tests

- Test domain and use cases with in-memory fakes.
- Test adapters against the real technology.

## Keeping the rules across sessions

- Agents drift toward infrastructure code in the application layer, rules copied across entry points, and duplicate abstractions.
- This skill loads only when triggered. Copy the hard rules into CLAUDE.md or AGENTS.md so they apply to every change.
