# System design

Apply a rule here only where its condition holds. A script or an internal tool with a handful of users needs few of them, and the table near the end names the cases where a rule is overkill.

## Order of decisions

Write down what the system has to do and for whom, then the qualities it has to keep (reliability, scalability, maintainability), each with a number where you can, such as requests per second, the response time that 99% of requests stay under, and the downtime the business accepts. Pick the simplest structure that meets those numbers, name what you gave up, and record the decision as an ADR when it is costly to reverse.

## Reliability

- Set a timeout on every remote call, and on calls across processes on the same host too, because a slow dependency otherwise holds threads and connections until the caller fails as well.
- Retry only idempotent operations, with capped exponential backoff and jitter, at one layer of the stack, because retries at every layer multiply the load on a dependency that is already failing. An idempotency key makes an operation with side effects safe to retry, and concise:backend-api has the mechanics.
- Let each component detect a failure, degrade and recover without a person, through health checks, restarts by the supervisor, and redundancy for anything whose loss stops the system.
- Test recovery on purpose by killing the process, cutting the dependency and restoring the backup, because a recovery path that never ran is an assumption.
- Start fast, and on SIGTERM stop taking new work and finish or hand back the work in flight.

## Scalability

- Keep processes stateless. Session data, uploads and locks live in a backing service, not in process memory or on local disk, so the system scales out by adding instances with no sticky sessions.
- Hand work to a queue where the caller does not need the result at once, which keeps coordination between services low.
- Find the bottleneck by measuring latency, traffic, errors and saturation before you change the design. Measure before you add a cache, a replica or a partition too, because each adds a consistency problem and an operating cost that stay after the load is gone.

## Data

- Another module gets data through the owner's interface or its events, not through a join on the owner's tables.
- Choose the consistency each operation needs. Money and stock need a transaction in one database, while a search index or a report can lag.
- A change that spans two stores cannot be atomic. Write to one store and publish from it with a transactional outbox, and make every consumer idempotent, as concise:backend-api describes.
- Keep each schema change compatible with the release before it, so old and new code run side by side during a deploy. Migrations and locks are in concise:database.

## Interfaces

- With enough consumers, every observable behavior of an interface is depended on by somebody (Hyrum's law). Keep the surface small and treat a change in observable behavior as a breaking change.
- Version a public contract and deprecate it with notice, as concise:backend-api describes for HTTP. An internal entry point changes in one pass together with all its callers.

## Operations

- Give each user-facing path a service level objective, a target for a measured indicator such as 99.9% of checkout requests succeeding within 1 s over 30 days, and alert on the objective rather than on every possible cause.
- Write logs as an event stream to stdout and let the platform route them, and build logs, metrics and traces into the first version, set up as concise:containers-iac describes.
- Keep configuration that varies between deploys in the environment, not in the code.
- Make every deploy reversible with one command that returns to the previous release, and keep the database compatible with it.

## Changing an existing system

- Replace a legacy system one use case at a time behind a facade that routes each request to the old or the new code (strangler fig), rather than rebuilding all of it at once.
- Prove the module boundaries inside the monolith before you extract a service, and split along a line where one team can own, deploy and run each side (Conway's law).

## When a rule is overkill

| Rule | Skip it when |
| --- | --- |
| Bounded contexts and context maps | One team works on one small model |
| Ports and adapters | The code behind the port is your own database with one implementation |
| Service level objectives | A batch job or an internal tool has no user waiting on it |
| Stateless scale-out | Load is fixed, and one instance with a restart policy meets the availability the business accepts |
| Strangler fig | The system is new |

## Sources

[Timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/), [The Twelve-Factor App](https://12factor.net/), [Azure design principles](https://learn.microsoft.com/en-us/azure/architecture/guide/design-principles/), the [AWS reliability pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/design-principles.html), the Google SRE book on [simplicity](https://sre.google/sre-book/simplicity/), [monitoring](https://sre.google/sre-book/monitoring-distributed-systems/) and [service level objectives](https://sre.google/sre-book/service-level-objectives/), [Designing Data-Intensive Applications](https://dataintensive.net/), the [DDD Reference](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf), [Hyrum's law](https://www.hyrumslaw.com/), [StranglerFigApplication](https://martinfowler.com/bliki/StranglerFigApplication.html), [MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html) and [How Do Committees Invent?](https://www.melconway.com/Home/Committees_Paper.html).
