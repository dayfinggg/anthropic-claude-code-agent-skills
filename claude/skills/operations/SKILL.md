---
name: operations
description: Handles how software is set up, built, shipped, and kept running, from project bootstrap and dependencies to CI/CD, environments, deployments, monitoring, and recovery. Use for such changes and for build or deployment failures.
---

# Operations

These rules cover how a project is set up, built, delivered, and kept running, on any developer machine and on the servers, runners, and managed platforms it ships to. The references hold the detailed checks for each branch.

Start from the repository guidance, working changes, manifests, lockfiles, installed versions, and the actual state of the environment, and let that evidence outrank generator defaults and vendor examples, because a default describes a fresh project and silently overrides the conventions this one already has.

<example>
Before changing how a Rails booking app deploys, read `Gemfile.lock`, run `git status --short`, and run `fly status -a booking-app`, then keep the `fly deploy` flow the app already uses.
</example>

Reuse the current stack, and add Docker, Kubernetes, a cloud service, or a process document only when the task needs it, because every new layer needs an owner, updates, and a way to recover it, and a routine change rarely pays for that.

<example>
Updating a NuGet package in a payroll job that runs as a Windows service changes `Payroll.Job.csproj` and `packages.lock.json` and adds no `Dockerfile`.
</example>

Before a push, publication, deployment, service restart, migration, access change, or rollback, confirm that the target is the intended one, that the request covers this exact action, and that the live state matches what you last observed, because a stale SSH alias, cloud profile, or cluster context, a request that only asked to prepare the change, or another operator's rollout in progress turns a correct command into damage on a shared system that is hard to undo. For a deployment, restart, migration, or rollback, check the host name, the running revision, and the service state with a read-only command immediately before the mutating one, and for a push check the remote and branch.

<example>
Asked to deploy `inventory-api`, run `kubectl config current-context && kubectl -n inventory get deploy inventory-api -o wide` and compare the output with the intended cluster and image tag before the deploy.
</example>

Treat a request to prepare a migration file or a deploy script as complete when the file is written and reviewed, because running it is a separate mutation of a shared system that the user has to ask for.

<example>
A request to write `0042_add_bin_location.sql` ends when the file is written and reviewed, and running it against the `inventory` database waits for its own request.
</example>

When a safety check fails or the state is uncertain, stop that action, fix the cause, and rerun the check while independent work continues, because a force flag, a skipped step, or a widened permission removes exactly the protection the check provided.

<example>
When the `pg_dump` backup step before a migration fails with a password authentication error, fix the `.pgpass` entry and rerun the backup instead of running the migration without it.
</example>

Confirm that a credential is present by its name or length and never by printing its value, because command output lands in transcripts, CI logs, and shell history where it outlives the task.

<example>
`[ -n "$STRIPE_API_KEY" ] && echo "set, ${#STRIPE_API_KEY} characters"` in a POSIX shell, or `if ($env:STRIPE_API_KEY) { "set, $($env:STRIPE_API_KEY.Length) characters" }` in PowerShell, answers whether the payment key is configured without showing it.
</example>

Reproduce a failure safely, change the narrow cause, and rerun the affected path against the real artifact or service, because a green build does not prove that the deployment, the restart, or the recovery works.

<example>
After fixing a route in a `Caddyfile`, `caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy` is followed by `curl -sI https://booking.example.com/` from another machine, since a passing validation says nothing about what is served.
</example>

Hand credential and trust-boundary design to `security`, engine-level restore and migration mechanics to `database`, and reports of a broken live service to `triage`, because this skill covers the delivery path and those skills hold the detailed checks.

<example>
A restore drill for the `ledger` database into a scratch copy follows the recovery reference here, while the engine-level checks of the dump format and replication settings go to `database`.
</example>

## References

Choose the references that apply before the dependent work and read each one, because each holds the checks for its branch and the core rules do not replace them. Leave the others unread so unrelated guidance stays out of context, run the checks that challenge the guarantee the change touches and not every check in a reference, and revisit the choice when the work changes.

- For project creation, official generators, target folders, or shell differences, read [project bootstrap](references/project-bootstrap.md).
- For adding, upgrading, removing, or investigating dependencies, read [dependency lifecycle](references/dependencies.md).
- For builds, configuration, secrets, or existing containers, read [builds and environments](references/builds-and-environments.md).
- For pipelines, runner trust, credentials, or artifacts, read [CI and supply chain](references/ci-and-supply-chain.md).
- For versions, promotion, compatibility, rollout, or rollback, read [releases and deployment](references/releases-and-deployment.md).
- For locating a build or deployment failure, instrumentation, SLOs, alerts, or health checks, read [diagnostics and observability](references/diagnostics-and-observability.md).
- For restores, failover, rollback targets, or existing runbooks, read [recovery](references/recovery.md).

<example>
A CI job that fails because `uv sync --locked` rejects `uv.lock` calls for dependency lifecycle and CI and supply chain, and the recovery reference stays unread.
</example>
