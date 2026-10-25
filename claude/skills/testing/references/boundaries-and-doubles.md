# Boundaries and doubles

## Choose scope by the missing guarantee

When choosing a test boundary, name the fault it must detect and the dependencies it must exercise, then use the narrowest reliable scope that still contains that fault, because a wider test is slower and harder to diagnose while a narrower one can miss the fault entirely. Read the actual construction and substituted dependencies instead of trusting the directory name, since an in-process test is not automatically a unit test and a browser test does not cover the whole system. Check by listing which real components the test starts.

<example>
A bug that depends on the `orders` table's unique constraint is tested through the repository against a real database container, not through `OrderService` with a mocked repository.
</example>

| When the risk concerns | Exercise | Reject as sufficient proof | Verify |
|---|---|---|---|
| Decisions or transformations | Public module API with relevant real logic | Private-helper tests that bypass the caller | Distinct outcomes and state transitions |
| Query semantics, serialization, routing, or transactions | A narrow real integration | A fake implementing the behavior being questioned | Actual response or durable result |
| Compatibility between independently changing services | Real consumer code and provider verification | A consumer mock or schema alone | Both sides accept the used message contract |
| Application assembly or a critical user journey | The relevant execution chain | Unit tests with every connection replaced | The complete caller-visible outcome |

## Keep fidelity where it matters

When an adapter depends on database or protocol semantics, run it against an isolated instance of the real technology with the configuration features that matter to the risk, because an in-memory substitute does not reproduce SQL dialects, constraints, isolation levels, or provider-specific behavior. When persistence is the promise, read the result outside the ORM's tracked object cache, because a cached object can show data that was never stored.

<example>
A test for `UserRepository.upsert()` runs against a throwaway Postgres container and then reads the row with a fresh session, not with the object the session still holds.
</example>

When the risk is a shared service contract, exercise the real client's request construction and response handling and verify those interactions against the provider with the project's existing contract mechanism, because hand-built requests test the test and not the client, and a contract response says nothing about persistence. Check provider side effects in separate functional integration tests, and publish contracts or change shared brokers only when the request asks for it, because other teams' pipelines consume them.

<example>
The `BillingClient` contract test calls `client.create_invoice()` against the contract mock and the provider verification replays it on `billing-api`, while the check that the invoice row exists lives in a separate integration test.
</example>

## Choose the least misleading double

When a collaborator is fast, deterministic, and simple to construct, keep it real, and when construction is awkward, first reach for existing factories or fixtures, because mocking every class only to isolate the current method leaves a test that mirrors the implementation. Check that the test still runs all the logic responsible for the promised result.

<example>
An `OrderService` test uses the real `PriceCalculator` and a fixture-built `Cart`, and doubles only the `PaymentGateway`.
</example>

When repeated stateful interactions make the real dependency too costly, use a maintained fake that honors the required contract, and when only one indirect input or one rare failure is needed, use a focused stub, because a stub is the cheapest way to supply a single answer and a fake is cheaper than many stubs. Make the fake reject operations it does not support and compute results without copying the disputed algorithm, because a fake that silently accepts everything or reuses the algorithm confirms its own bugs. Check the fake against the real implementation, preferably with conformance cases that run against both.

<example>
An `InMemoryBlobStore` raises `NotImplementedError` for `list_versions()` and passes the same `blob_store_contract_tests` as the S3 adapter, while a retry test stubs `put()` to raise `TimeoutError` once.
</example>

When the external interaction itself is the guarantee, observe it with a spy or a narrow mock expectation and assert only the arguments, counts, and ordering the caller depends on, because assertions on incidental helper calls break on harmless refactors. Make assertions raised in background work reach the test runner, verify the final mock expectations, and await completion before the test ends, because an assertion that runs after the test finishes reports nothing.

<example>
A notification test asserts that `mailer.send` was called once with `to="ann@example.com"` and awaits the queue drain before returning.
</example>

When a double replaces a paid, destructive, or unavailable third party, state the fidelity gap, and add an authorized sandbox check when the gap matters to completion, because live charges or deletions cannot be undone for the sake of realism. Check that the local test configuration cannot select production credentials or endpoints.

<example>
Payment tests run against a stub `PaymentGateway`, the report says that 3-D Secure flows were not exercised, and `conftest.py` forces `PAYMENT_API_KEY` to a sandbox value.
</example>
