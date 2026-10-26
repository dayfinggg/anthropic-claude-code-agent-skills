# Releases and deployment

## Identify the release before moving it

When preparing a release, follow the project's version policy, tag format, registry, and release tooling, and determine the intended source revision and compatibility impact before choosing a version, because not every repository uses SemVer or conventional commits. Check the release contents and the version that already exists at the destination. Preparing a release is not a request to publish it or to move an existing tag, because a published artifact or a moved tag changes what other people already depend on.

<example>
`git tag -l` shows whether the project uses `v1.4.2` or `release-14`, the new tag is created locally in that pattern, and `git push origin v1.5.0` waits for the user's request.
</example>

When promoting a tested build, keep its artifact identity and configuration revision, and prefer the tested bytes over a rebuild with freshly resolved inputs, because a rebuild can differ from what was tested. Where environment-specific substitution forces distinct artifacts, check the actual artifact for each target instead of claiming that all environments received identical bytes.

<example>
The `sensor-fw-2.3.1.bin` that passed on the staging devices is the file published to the production update channel, and `shasum -a 256 sensor-fw-2.3.1.bin` matches the hash recorded at build time.
</example>

Immediately before a deployment the user requested, recheck the destination identity, live revision, configuration, schema state, pending operations, and any open incident on the same service, adding the account, region, host, cluster, or namespace only where they apply, because a concurrent rollout can invalidate earlier observations. Stop instead of overwriting another operation or relying on a local production default.

<example>
Before `./deploy.sh prod`, run `curl -s https://booking.example.com/version` and `aws deploy list-deployments --application-name booking --deployment-group-name prod --include-only-statuses InProgress Queued` to learn the live revision and whether another deployment is already running.
</example>

## Choose a rollout the system can evaluate

For an existing staged deployment, define the candidate, control, critical user path, stop signal, and observation window before advancing, and pick traffic and metric windows that fit the stage, because a small canary limits impact but low traffic can produce no evidence, and missing data is not success. Check both candidate-relative behavior and absolute service health, since a shared backend can damage both groups.

<example>
A 5 percent canary on a booking API with 40 requests per hour sees about two requests, so the stage holds until a scripted request has exercised `POST /bookings` and the canary's 5xx count in the load balancer's access log is compared with the control.
</example>

When the system cannot split traffic, use the supported deployment method with preflight checks, sufficient serving capacity, a compatible recovery target, and explicit downtime expectations, and avoid introducing orchestration to imitate a large provider, because simpler delivery costs less but has a larger failure domain. Check readiness, request handling, and recovery before claiming a zero-downtime rollout.

<example>
A single IIS host deploys by pointing the site at a new release folder with `Set-ItemProperty 'IIS:\Sites\Catalog' -Name physicalPath -Value 'D:\releases\1.5.0'` so the application pool restarts on the new files, and the team expects a short gap and checks `(Invoke-WebRequest https://catalog.example.com/health -UseBasicParsing).StatusCode` afterwards.
</example>

For asynchronous workers, observe completed work and backlog and not only process health, using an observation window that covers meaningful work duration, because faster promotion shortens delivery but hides delayed failures. Check expected outputs, retries, duplicate effects, and queue behavior for the affected workflow.

<example>
After `docker compose up -d --no-deps worker` replaces the container, `docker compose ps` shows `Up`, but the checks that matter are that queue depth falls and the failed-job count stays flat while the slowest job type finishes.
</example>

## Prove compatibility in both directions

When versions coexist, test protocol, configuration, schema, stored-data, and queued-message compatibility, and separate preparation from activation for a format transition, because a rollback after activation can meet data that the older version cannot read. The extra stage delays delivery but preserves a compatible recovery target. Check that every required reader is prepared, since a healthy-instance threshold alone does not prove it, and test mixed operation and downgrade with representative data in a safe environment. Keep compatibility until stored data and dependent work no longer need it, and treat an application rollback as separate from a schema downgrade, because the first does not authorize the second.

<example>
Moving `orders.status` from a number to a string takes two releases. The first reads both forms and still writes the number, the second writes the string, and a rollback of the second lands on the first, which still reads every row.
</example>

| Release state | Reads | Writes | Recovery implication |
| --- | --- | --- | --- |
| Original | A | A | Cannot read newly written B. |
| Prepared | A and B | A | Must reach all required readers before activation. |
| Activated | A and B | B | Can return to Prepared, not automatically Original. |

## Advance only on evidence

When executing an approved rollout, use the existing plan or diff and the deployment gates, and monitor the affected service and the relevant upstream and downstream effects, giving resource, configuration, and feature-flag changes the same risk assessment as binaries, because a longer observation catches slow failures but delays delivery. Choose the window from actual traffic, jobs, and recovery needs.

<example>
Turning the `instant-booking` feature flag on for all tenants gets the same staged error-rate and request check as a code deploy, and its observation window covers the longest nightly sync job.
</example>

After a timeout or lost connection, inspect the operation's real status before retrying, because a faster retry can duplicate or collide with a change still in progress. Continue only after identifying what completed and whether the next operation is safe.

<example>
When `terraform apply` loses its connection while creating a database instance, run `terraform plan` and check the cloud console for the instance before applying again.
</example>

When gates fail, stop advancement and roll back only to a verified compatible target within the granted authority, and check the consequences before any recovery that would downgrade schema, restore data, replace resources, or lose writes, because a rollback replayed from old command history can destroy data that the new version already wrote.

<example>
A failed gate after the migration ran leads to asking whether reverting the application release is enough, and an old `alembic downgrade -1` found in shell history stays unrun.
</example>

After execution, verify the deployed revision, a real user path, telemetry, and affected background work, because command success proves only that command's result.

<example>
`gcloud run services describe booking-api --region us-central1 --format='value(status.latestReadyRevisionName)'` names the released revision, `curl -sI https://booking.example.com/login` returns 200, and `gcloud run services logs read booking-worker --region us-central1 --limit 20` shows the worker consuming messages again.
</example>
