# Evolution

## Establish the compatibility obligation

When changing a contract, identify its actual consumers and whether their upgrades are controlled together, and tell an internal implementation detail apart from a supported package, API, configuration, event, or persisted format, because versioning machinery for consumers that move together is wasted work, while a missed external consumer breaks silently. Apply coordinated internal changes directly when all consumers can safely move together. Check source, wire, and behavioral compatibility using real consumer assumptions.

<example>
In a plugin platform, changing the signature of a hook that third-party plugins call needs a deprecation period because each installation upgrades on its own schedule, while renaming a private helper used only inside the platform is a plain edit.
</example>

When a change is described as additive, check required fields, defaults, enum handling, serialization, and generated clients, and when renaming or moving an exported symbol, inspect import paths as well as wire compatibility, because an unchanged signature or a new optional field does not by itself prove compatibility. Check that an old representative client still builds and behaves correctly.

<example>
Adding `"refunded"` to an order status enum is not additive for a client with an exhaustive `switch`, so run the old generated client against a payload that contains the new value.
</example>

When refactoring internals, keep supported behavior distinct from implementation details and test the component through the same supported entry points its consumers use, because tests tied to internals break on every restructure and say nothing about whether consumers are still served. Change a test only after establishing that its expectation is wrong, and do not keep brittle tests just to preserve the old arrangement. Check that a structural change does not require rewriting behavioral expectations.

<example>
Splitting `OrderService` into two classes leaves the `POST /orders` test untouched, while a test that asserts a private `_apply_discounts` call is rewritten once it is confirmed to check arrangement and not behavior.
</example>

## Replace components without losing control

When a replacement cannot happen atomically, establish a seam around the interactions the first consumer slice needs, keep the old implementation working while the new one satisfies the same contract, and expand only as later consumers need it, because a universal abstraction over the whole legacy system delays the first benefit and encodes guesses. Check both implementations against the applicable behavior before moving that slice.

<example>
To replace a legacy report generator, wrap only `generate(report_id)` for the dashboard, run the old and new versions on the same ten report ids, and then switch the dashboard.
</example>

When implementations coexist, identify who owns effects and persisted state, compare read-only results where safe, and run only one implementation for writes, sends, and charges, because running both duplicates emails and payments. Check that switching avoids duplicate effects and that rollback can read the replacement's data, since a code switch alone does not establish a reversible migration.

<example>
The old and new pricing engines both compute quotes for comparison, but only the new engine's `send_confirmation()` is enabled for migrated accounts, and the new store writes a schema the old reader still parses.
</example>

When a broad change spans ownership or build boundaries, choose slices that stay independently buildable and testable, and check both current and transitional dependencies before applying the next slice, because a mixed state covered only by the replacement's own tests breaks consumers unnoticed. Prefer in-place evolution when the migration cost of a replacement outweighs its gain. Check the mixed state through the affected consumers.

<example>
Moving 30 services from `config.yaml` to environment variables goes five services at a time, each slice building and passing `make test`, with a loader that reads either source until the last slice lands.
</example>

## Finish the transition

When deprecating a component, identify the remaining users, who owns their migration, and the evidence needed for removal, checking static references and relevant runtime use where it is observable, because unknown external consumers treated as absent break the day the component is deleted. State a deletion date or a complete removal only when the evidence covers those consumers.

<example>
A search finds no callers of `/v1/export` in the repository, but the access logs show three partner keys calling it weekly, so the endpoint is marked deprecated with a migration contact and stays.
</example>

When the supported consumers have moved and removal is authorized, delete the obsolete implementation and the migration seam, use existing checks to block new dependencies on the retired path, and clean up the configuration and dependencies it leaves unused, because compatibility code with no obligation behind it still costs maintenance. Keep compatibility machinery only while its named obligation remains. Check builds and representative behavior after the removal.

<example>
After the last site moved to `render_v2`, delete `render_v1`, the `USE_V2_RENDER` flag, and its two environment entries, and add a lint rule that rejects imports of `render_v1`.
</example>
