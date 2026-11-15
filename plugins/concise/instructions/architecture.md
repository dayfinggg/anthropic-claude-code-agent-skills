# Structure and architecture

- Follow the layout the project already has. In a new project use the standard layout of its ecosystem. Do not pile every file into one folder or all code into one file.
- Group code by business capability, such as `billing/` and `catalog/`, before technical kind, such as `controllers/`, `services/` and `utils/`. Draw module boundaries around the decisions most likely to change, not around the steps of processing (information hiding, Parnas).
- High cohesion and low coupling: what changes together lives together. Give each module one small public entry point and hide the rest. Split a module when it gets a second reason to change, not because it is long (deep modules, Ousterhout).
- The dependency rule of Clean and hexagonal architecture: domain logic imports no framework, database or transport code, dependencies point from details to policy, and no import cycle exists. When one change needs edits in several modules, the boundary is in the wrong place, so move it first.
- Monolith first: start with one deployable modular monolith. Add a service, a queue, a cache or a layer only for a need that was stated or measured.
- Share code between modules only for one concept with one owner, because a wrong shared abstraction costs more than duplication.
- Design for failure wherever code leaves the process: a timeout on every remote call, retries only for idempotent operations, no state in process memory that has to survive a restart, and configuration read from the environment (the Twelve-Factor App).
- Record a decision that is costly to reverse as an architecture decision record where the project keeps its decisions, with the alternatives you rejected.
- Before you create or reorganize a project, add a module or a service, or choose an architecture, load the concise:architecture skill.
