# Isolation and flakiness

## Isolate data, not the behavior being tested

When tests mutate state, give each test or worker an isolated namespace, database, account, directory, or browser context, and seed only the data its behavior needs through setup paths that keep the relevant constraints, because a test that depends on an earlier test or a shared mutable fixture fails when order or parallelism changes. Run the test alone, after its relevant neighbors, and under the project's normal parallel execution.

<example>
Each test in `tests/test_uploads.py` writes to `tmp_path` and a per-worker schema named `test_gw0`, so both `pytest -n 4` and `pytest -k test_upload_rename` pass.
</example>

When a resource needs cleanup, register the cleanup right after each successful acquisition using the existing fixture facilities, and keep the cleanup running when later setup, assertions, or another cleanup fails, because a failure halfway through setup otherwise leaks the resources already acquired. Leave teardown errors visible and do not wrap them in a catch-all, because a swallowed error can bury the test's own failure. Check that resources and background workers are released on both success and failure.

<example>
A fixture creates a temp database and then starts a worker, registering `drop_db` right after the first step and `worker.stop` right after the second, so a failed worker start still drops the database.
</example>

When using transaction rollback for isolation, confirm that the exercised code runs inside that transaction, and use a separate test database or targeted cleanup when real commit behavior matters, because independently committed effects and separate connections survive an outer rollback and leak into the next test. Read persisted state through a fresh connection, and check that the next test starts from its declared baseline.

<example>
An `export_job` test opens its own connection and commits rows that the test's rollback never undoes, so it runs against a database recreated for each test module.
</example>

## Control the right kind of time

When testing expiry, scheduled work, or retries, use the project's controllable clock and timer facilities and tell fixed wall time apart from advancing timers and elapsed time, because a fixed sleep makes the test slow and flaky, and a frozen clock breaks any performance measurement that reads it. Check the boundary instants, the expected callbacks, and the asynchronous completion after advancing time.

<example>
A token that expires after 15 minutes is tested by advancing a fake clock to `14:59` and `15:00` and asserting `valid` and then `expired`, with no `sleep(900)`.
</example>

When applying fake timers, install them before creating the timers they must control, restore them through fixture cleanup, and await the relevant pending work, because a timer created earlier keeps running on real time and a leaked fake clock changes later tests. Keep real and fake timing apart unless the installed tool supports mixing them on purpose. Check a fresh run for leaked timer or clock state.

<example>
In a Jest suite, `jest.useFakeTimers()` runs in `beforeEach` before the debounced handler is created, and `jest.useRealTimers()` runs in `afterEach`.
</example>

## Exercise concurrency deliberately

When the defect depends on overlapping work, identify the interleaving it needs and the safety or liveness guarantee at stake, and coordinate entry, release, and completion with barriers, events, or a supported controlled scheduler, because sleeps only hope for the overlap, and serializing the contested operation or mocking its shared resource removes the race being tested. Join the participating tasks with a bounded timeout and assert that none is still running before asserting on the observable result, because a join that times out returns without an error and a deadlocked task would otherwise pass unnoticed.

<example>
Two `withdraw(80)` calls on a balance of `100` wait on a shared `threading.Barrier` before touching the account, and the test joins both threads with `timeout=5`, asserts that neither `is_alive()`, and then asserts a single success.
</example>

When using scheduler exploration, identify which operations the scheduler actually controls, capture a failing schedule, and replay it from a fresh state, because I/O, OS threads, and unsupported primitives can run outside its control and a claim of exhaustive coverage would then be false. Keep any remaining uncontrolled timing as a stated confidence limit.

<example>
An exploration of `Cache.get` and `Cache.evict` finds a failing schedule, which is saved as `schedule-17` and replayed from an empty cache, and the report states that the disk reads were not controlled.
</example>

## Diagnose intermittent results

When an unchanged revision both passes and fails, keep the failure before retrying, record inputs, seed, test order, worker count, environment, and relevant timings, and compare the smallest pair of runs that isolates the suspected cause, because a retry that passes does not show the test is at fault and discards the evidence.

<example>
A failure in CI run 4812 is saved with its log, `--randomly-seed=1234`, and `-n 4` before the job is triggered again.
</example>

When a test fails only after particular neighbors or only in parallel, replay that order or give each worker its own names and resources, inspect the leaked state or the true overlap, and verify both orderings, independent execution, and the normal worker configuration, because deleting the neighbor or serializing the whole suite hides the shared state without removing it.

<example>
`test_export` fails after `test_import` and under `pytest -n 4` because both write to one `/tmp/acme.csv`, so each test gets its own `tmp_path` and the fix is verified in both orders and with `-n 4`.
</example>

When a test fails near asynchronous completion, trace the order of the action, the event, and the assertion, and wait for a bounded event or an observable state, because a longer sleep only moves the failure to a slower machine and leaves the race in place.

<example>
A `test_sync` that asserted after `sleep(2)` waits for the `sync_done` event with a 10-second timeout and then asserts the row count.
</example>

When a generated input cannot be replayed, reset the external state and capture every source of randomness, then replay the same input from a fresh state, because suppressing the flaky error leaves an unexplained defect that returns with the next seed.

<example>
A failing run saves its seed and the fixture data it loaded, and the replay starts from a newly created database with both and fails the same way.
</example>

When the result differs with the environment or load, compare resources, versions, and configuration, and verify the fix in an equivalent environment or state the remaining gap, because weakening a product guarantee to pass the test hides a defect that real users meet.

<example>
A test that passes on a 16-core laptop and fails on a 2-CPU runner is compared on core count and time zone first, and the final answer says that the runner's memory limit was not reproduced.
</example>

When retries or quarantine are requested as a temporary mitigation, keep the original failure and a named owner for the follow-up, and distinguish the mitigation from a causal correction, because a silently skipped test or a failure converted to success removes the signal the suite exists to give. Check that the unaffected regression signal still works.

<example>
A `@pytest.mark.flaky(reruns=2)` on `test_sync` ships with ticket `QA-231` and a sentence in the pull request description that the cause is still unknown.
</example>
