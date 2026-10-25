# Styles and deployment

## Choose constraints before labels

When comparing architectures, identify the actual limiting condition and the qualities that must not regress, consider change effort, release independence, latency, consistency, availability, operating cost, and support capacity only where they are relevant, and compare each option against keeping the current design, because an advantage that comes from an architecture's name and not from constraints the team can sustain does not materialize. Check that each claimed advantage follows from those constraints.

<example>
Slow releases caused by a 6-hour test suite call for splitting the tests or the build targets first, which is cheaper than splitting the service in three.
</example>

When a decision rests on uncertain performance or cost, choose a small experiment that could disprove it, using representative load, failure conditions, and customer-visible behavior, compare a relevant baseline, and account for the added operational work, because one benchmark does not prove maintainability and an invented target proves nothing. Check that the measured gain does not violate another requirement.

<example>
Before moving image resizing to a queue worker, replay a day of real upload sizes through both paths and compare p95 latency together with the extra on-call surface of the queue.
</example>

## Modular monoliths

When one deployment remains acceptable but domain coupling makes changes hard, consider a modular monolith that keeps in-process collaboration while establishing responsibility, data ownership, and supported access points, because internal HTTP calls added to imitate a future service split pay network costs without gaining a deployment benefit. Check that actual cross-component calls obey those boundaries and that representative changes become more local.

<example>
`orders`, `inventory`, and `billing` stay one deployable, each exposing a `public/` module, and a test fails the build on any import of another component's internals.
</example>

When deciding whether to start with a monolith, assess the domain uncertainty and the need for independent delivery, because early in-process boundaries are cheaper to change while the domain is still unclear, whereas known subsystem boundaries and mandatory independent delivery can justify separate applications earlier. Check the decision against the team's actual constraints, since neither starting strategy guarantees later extraction or good modularity.

<example>
A product with an unsettled data model starts as one deployable, while a payment terminal gateway that a vendor requires on its own release cycle starts as a separate application.
</example>

## Separate deployment units

When independent release, scaling, fault isolation, or data isolation is a real requirement, evaluate a separate deployment unit and include network latency, partial failure, consistency, observability, deployment, and support costs, because those costs arrive immediately while the benefit exists only if the boundary really contains updates and failures. Check that a representative update and a representative failure can be contained without coordinated releases across every participant, and reconsider the boundary or the claimed independence if they cannot.

<example>
A video transcoder that needs GPU hosts and scales on its own qualifies as a service, but if every change to it also needs a coordinated release of `catalog`, the boundary is in the wrong place.
</example>

When extracting a component that currently shares transactions or mutable objects, redesign that collaboration for a remote boundary by defining ownership, exchanged data, and tolerated inconsistency before moving it, because a successful in-process interface is not automatically a suitable service interface. Check failure and compatibility scenarios with the existing consumers.

<example>
Before extracting `notifications`, replace the `Order` object passed in-process with an `OrderPlaced` event carrying `order_id` and the recipient, and decide that an email arriving a minute late is acceptable.
</example>

## Asynchronous collaboration

When long-running work must not occupy a request, consider a worker boundary with an explicit completion contract, because a caller that waits on slow work ties up connections and times out under load. Check delayed, repeated, and failed processing against the user's completion expectations.

<example>
PDF export returns `202` with a job id and a status endpoint, and a retried job reuses the same output file instead of producing a second one.
</example>

When independent consumers need to react to something that happened, evaluate events instead of synchronous knowledge of every consumer, and keep direct calls when an immediate result and simple sequencing fit better, because messaging moves coupling into contracts and time and does not eliminate it. Check that the events still make sense when delivered late, twice, or not at all.

<example>
`OrderPlaced` is published for the mailer and analytics to consume, while the price lookup that the checkout page needs immediately stays a direct call.
</example>
