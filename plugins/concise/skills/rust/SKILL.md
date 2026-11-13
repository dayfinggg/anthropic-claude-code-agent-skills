---
name: rust
description: Current Rust practice (stable 1.100, edition 2024) for writing, reviewing, debugging and upgrading Rust code and Cargo projects. Use when working with .rs files, Cargo.toml, Cargo.lock, rust-toolchain.toml, .cargo/config.toml, clippy.toml or rustfmt.toml, running cargo build, check, test, clippy, fmt, fix, add, update or publish, fixing rustc, borrow checker or lifetime errors, choosing or raising rust-version (MSRV) or the toolchain, migrating to edition 2024, configuring lints, writing async code with tokio, async traits or async closures, writing unsafe code, FFI, static mut or Miri tests, or when asked which Rust version or std API is current or whether a crate is still needed.
---

## Read first

Do these steps now, in order, before anything else and whatever the task. The files hold the traps this skill depends on, and a skipped file or page is the usual cause of a wrong result.

1. Read `references/edition-2024.md` in full with the Read tool (Migration, Language, Standard library, Cargo, Rustdoc, Rustfmt).
2. Read `references/std-apis.md` in full with the Read tool (Stable std APIs by version).
3. Open https://blog.rust-lang.org/releases/latest/ (Current stable (the page redirects to its release post)) and compare it with the facts below.

## Check first

- Read `edition`, `rust-version`, `resolver` and `[lints]` in `Cargo.toml` and in the workspace root manifest. Read `rust-toolchain.toml`, `.cargo/config.toml`, `clippy.toml` and `rustfmt.toml` if present.
- Run `rustc -V` and `cargo -V`. The local toolchain is often newer than `rust-version`, so a clean local build proves nothing about the MSRV. Check the "since" version on the std docs page of any API you are not sure about.
- When raising the toolchain or `rust-version`, read each release post in between and the Compatibility Notes in its linked detailed release notes.
- Look up crate versions and each version's `rust_version` in the crates.io API (`crates.io/api/v1/crates/<name>`). It returns 403 without a User-Agent header.
- Facts verified 2026-11.

## Defaults

- Stable is Rust 1.100.0 (2026-11-12). A new stable ships every six weeks. Edition 2024 (Rust 1.85) is the newest edition. Start new crates with `edition = "2024"` and a `rust-version`.
- `edition = "2024"` implies `resolver = "3"`, which prefers dependency versions whose `rust-version` fits yours (Rust 1.84). A virtual workspace has no edition, so write `resolver = "3"` in its `[workspace]` table.
- Configure lints in `Cargo.toml` under `[lints.rust]`, `[lints.clippy]` and `[lints.cargo]`. Cargo lints are stable since 1.100 and include `unused_dependencies`. Write lint names with underscores, Cargo 1.99 warns on hyphens.
- Fail on warnings with `CARGO_BUILD_WARNINGS=deny` or `[build] warnings = "deny"` in `.cargo/config.toml` (1.97). `RUSTFLAGS=-Dwarnings` invalidates the build cache. For CI wiring see concise:github-actions.
- Opt into dependency cooldowns (1.100) in `.cargo/config.toml`. Take one newer version early with `CARGO_RESOLVER_INCOMPATIBLE_PUBLISH_AGE=allow cargo update <crate> --precise <version>`. `cargo install` ignores the cooldown.

```toml
[registry]
global-min-publish-age = "3 days"
```

- Prefer std over these crates and idioms when `rust-version` allows:

| Instead of | Use | Since |
|---|---|---|
| `once_cell`, `lazy_static` | `std::sync::LazyLock`, `OnceLock`, `std::cell::LazyCell` | 1.80 |
| `cfg-if` | `cfg_select! { unix => {..} _ => {..} }` | 1.95 |
| `scopeguard` | `std::mem::DropGuard::new(value, closure)`, cancel with `DropGuard::dismiss(guard)` | 1.100 |
| `itoa` | `let mut buf = NumBuffer::new()`, then `n.format_into(&mut buf)` | 1.98 as `core::fmt`, 1.99 as `std::fmt` |
| `fs2`, `fs4` file locks | `File::lock`, `try_lock`, `lock_shared`, `unlock` | 1.89 |
| `filetime` | `std::fs::set_times`, `set_times_nofollow` | 1.99 |
| `os_pipe` | `std::io::pipe` | 1.87 |
| `home`, `dirs` for the home directory | `std::env::home_dir`, no longer deprecated | 1.87 |
| `allocator-api2` for `Vec` and `Box` | `std::alloc::Allocator`, `Vec::new_in`, `Box::new_in` | 1.100 |
| `assert!(matches!(..))` | `use std::assert_matches;` then `assert_matches!(v, pat)` | 1.96 |
| `as_any()` methods for downcasting | `trait Foo: Any`, then upcast `&dyn Foo` to `&dyn Any` | 1.86 |
| `Captures<..>` or `+ 'a` tricks on `impl Trait` | `+ use<'a, T>`, or no bound in edition 2024 | 1.82 |
| closures returning `async move {}` | `async` closures with `impl AsyncFn(X) -> T` bounds | 1.85 |
| `#[allow(lint)]` | `#[expect(lint, reason = "..")]` | 1.81 |
| `addr_of!`, `addr_of_mut!` | `&raw const x`, `&raw mut x` | 1.82 |
| `(0..n).map(f).collect::<Vec<_>>()` | `Vec::from_fn(n, f)` | 1.100 |
| `s.strip_prefix(p).unwrap_or(s)` | `s.trim_prefix(p)`, `trim_suffix` | 1.100 |

- Use let chains `if let Some(x) = a && x > 0` in `if` and `while` (1.88, edition 2024 only) and `if let` guards on `match` arms (1.95).
- Name `!` anywhere, for example `Result<T, !>` (1.100). `Infallible` is now an alias of `!`.
- Infer const generic arguments with `_`, as in `[false; _]` (1.89). Define C variadic functions as `unsafe extern "C" fn f(mut args: ...)` (1.99).
- `core::range::{Range, RangeFrom, RangeInclusive}` (1.96) are `Copy` and can live in `Copy` structs. Range syntax still builds the legacy types. Accept `impl RangeBounds<T>` in public APIs.

## Gotchas

- Rust 1.100 changed never type fallback from `()` to `!` on all editions, not only 2024. `f()?;` where `f` is generic over its `Ok` type, `run(|| panic!())` against a trait bound, and `if c { Default::default() } else { return }` now fail. Write the type: `f::<()>()?`, `() = f()?;` or `|| -> () { panic!() }`.
- Sorting (1.81), `derive(PartialOrd)` next to `Ord` (1.98), `BTreeMap::append` (1.96) and `Iterator::min`/`max` (1.100) rely on consistent `Ord`, `PartialOrd` and `Eq` impls and may panic or return different elements otherwise. With a manual `Ord`, implement `partial_cmp` as `Some(self.cmp(other))`.
- `[workspace.lints]` is not inherited. Each member needs `[lints] workspace = true`, and Cargo's `missing_lints_inheritance` lint warns when it is missing.
- A lint group and a single lint at the same priority apply in undefined order. Write groups as `pedantic = { level = "warn", priority = -1 }`. Clippy's `lint_groups_priority` check skips inherited workspace lints.
- Clippy's `msrv` defaults to `rust-version`. Without `rust-version` it suggests the newest std APIs. Enable `clippy::incompatible_msrv` to flag std items newer than the MSRV.
- `cargo::unused_dependencies` only reports when every target that could use the dependency is built, and never for dev-dependencies. Run `cargo check --all-targets` before trusting a clean result.
- With `resolver = "3"` or `incompatible-rust-versions = "fallback"`, the resolver silently picks older crates for a low `rust-version`. tokio 1.54 needs Rust 1.85, so `rust-version = "1.80"` resolves tokio to 1.53.x. When no matching version fits the MSRV it picks an incompatible one without an error. Verify with `cargo +<msrv> check --all-targets`.
- In edition 2024, `{ workspace = true, default-features = false }` was an error on Rust 1.85 to 1.98 and overrides the workspace value since 1.99. Older editions ignore it. Features still unify across members built together.
- Lockfile v4 (default since 1.83) cannot be read by toolchains before 1.78. Multi-line inline tables and other TOML 1.1 syntax in `Cargo.toml` (1.94) raise the development MSRV.
- Rust 1.100 changed the build-dir layout and it stays unstable. Locate artifacts through `cargo build --message-format=json` or `CARGO_BIN_EXE_<name>` (readable at runtime since 1.94), not through paths under `target/`.
- Linker failures on `x86_64-unknown-linux-gnu` after 1.90 can come from LLD becoming the default. Opt out with `-Clinker-features=-lld`. Since 1.97, v0 symbol mangling is the default and old profilers or debuggers may fail to demangle.
- `fn items(&self) -> Iter<T>` warns with `mismatched_lifetime_syntaxes` (1.89). Write `Iter<'_, T>`.
- `std::i32::MAX` style module constants are fully deprecated (1.99) and `std::char` constants and functions are deprecated (1.97). Use `i32::MAX`, `char::MAX`, `char::from_u32`.
- `pin!(x)` with `x: &mut T` yields `Pin<&mut &mut T>` since 1.97. Use `Pin::new(x)` when the target is `Unpin`.
- `async fn` in a public trait gives callers no way to require a `Send` future (`async_fn_in_trait` lint). Declare `fn run(&self) -> impl Future<Output = T> + Send` instead of allowing the lint or adding `#[async_trait]`. Implementations may still write `async fn run(&self) -> T`. The `trait-variant` crate generates a `Send` and a local variant.
- Adding any field, even a private one, to a public struct whose fields are all public breaks callers, and so does a new variant of a public enum. Mark such types `#[non_exhaustive]` before their first release, because adding the attribute later also breaks callers. `cargo semver-checks` reports these changes before a publish.
- Traits with `async fn` or `-> impl Trait` methods are not dyn compatible. For `dyn` dispatch keep `async-trait` or return `Pin<Box<dyn Future<Output = T> + Send + '_>>`.
- `AsyncFn*` bounds cannot require a `Send` future, because return type notation is still unstable, and `AsyncFn*` traits are not dyn compatible. For spawned callbacks use `F: Fn(X) -> Fut, Fut: Future<Output = T> + Send + 'static`.
- Use `std::sync::Mutex` or `parking_lot` for plain data in async code. Use `tokio::sync::Mutex` only when the guard must live across `.await`, mainly for IO resources.
- In `loop { tokio::select! { .. } }` the losing branch futures are dropped. `read_exact`, `read_to_end`, `read_to_string` and `write_all` lose data, and `Mutex::lock`, `RwLock::read`, `Semaphore::acquire` and `Notify::notified` lose their queue place. Use cancel-safe calls such as `mpsc::Receiver::recv`, `read` and `StreamExt::next`, or pin the future before the loop and poll `&mut fut`.
- `spawn_blocking` tasks cannot be aborted once started and runtime shutdown waits for them. Use `std::thread::spawn` for long-lived blocking loops. Bound CPU-heavy work with rayon or a `Semaphore`, because the blocking pool limit is very large.
- tokio LTS lines are 1.51.x (until March 2027) and 1.53.x (until September 2027), both MSRV 1.71. Pin one with `tokio = { version = "~1.53", ... }`.
- Edition 2024 requires `unsafe extern "C" { .. }` and `#[unsafe(no_mangle)]`, `#[unsafe(export_name = "..")]`, `#[unsafe(link_section = "..")]`. Inside `unsafe extern`, declare `pub safe fn` for items that are sound to call without `unsafe`.
- A reference to a `static mut`, written as `&X` or created implicitly by a method call or `println!`, is a deny-by-default error in edition 2024 and is undefined behavior when it aliases, even unused. Use atomics, `Mutex`, `LazyLock`, `OnceLock`, or pass `&raw mut STATIC` to FFI.
- `std::env::set_var` and `remove_var` are `unsafe` in edition 2024. Call them only before any other thread starts. The `unsafe {}` wrapper that `cargo fix` inserts does not make the call sound.
- A panic escaping an `extern "C"` function aborts the process (1.81). Use `extern "C-unwind"` when unwinding must cross the boundary.
- Do not free memory from `Box::leak` by rebuilding a `Box` from the leaked reference (discouraged since 1.99). Use `Box::into_raw` or `Box::into_non_null`, then `Box::from_raw` or `Box::from_non_null`.
- Create a zero-sized value in unsafe code with `std::mem::conjure_zst::<T>()` (1.100), not by transmuting `()` or `MaybeUninit::uninit().assume_init()`. `T` must be inhabited.
- `slice::from_raw_parts` and `from_raw_parts_mut` need a non-null, aligned pointer even for a zero-length slice. C code often passes `(NULL, 0)` for an empty buffer, so check for null first and use `NonNull::dangling()` or `ptr::dangling()` (1.84) instead.
- Matching a union field together with other values in one pattern can read the union before the tag is checked, which is undefined behavior. Match the tag first, then read the field.
- Run unsafe code under Miri with `cargo +nightly miri test` after `rustup +nightly component add miri`. Miri has no FFI or networking, so mark such tests `#[cfg_attr(miri, ignore)]`. Vary addresses and thread schedules with `MIRIFLAGS="-Zmiri-many-seeds=0..16"`. On Windows add `--target x86_64-unknown-linux-gnu`. A pass covers only the executions it tried, so a `// SAFETY:` comment must argue the invariant rather than cite Miri, fuzzing or sanitizers.
- rand 0.9 renamed `thread_rng()` to `rng()`, `gen` to `random` and `gen_range` to `random_range`. rand 0.10 (current 0.10.3, MSRV 1.85) renamed the `Rng` trait to `RngExt` and `OsRng` to `SysRng`.
