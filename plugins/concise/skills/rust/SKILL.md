---
name: rust
description: Stable Rust, edition 2024 and Cargo, covering Rust code, Cargo.toml and workspaces, lints, MSRV, async with tokio and unsafe code. Use when writing, reviewing, debugging or upgrading .rs files or Cargo projects, running cargo build, test, clippy, fmt, fix or update, fixing borrow checker or lifetime errors, raising rust-version or the toolchain, migrating to edition 2024, or deciding whether std replaces a crate. Property and mutation testing belong to the testing skill.
---

# Rust

This skill matches Rust 1.100 (released 2026-11-12), edition 2024 and Cargo 1.100. See what is installed with `rustc -V` and `cargo -V`. Where the installed release is newer, its release notes and the std docs are right.

## References

- Read [references/std-apis.md](references/std-apis.md) before you add a crate that std may replace, such as `once_cell`, `lazy_static`, `cfg-if`, `scopeguard`, `itoa`, `fs2`, `filetime` or `allocator-api2`, and when you write or review code against a specific `rust-version`.
- Read [references/edition-2024.md](references/edition-2024.md) before you migrate a crate to edition 2024 or fix errors that appear after an edition change.
- Read [references/async.md](references/async.md) before you write or review async code, tokio `select!`, spawned tasks, async traits or async closures.
- Read [references/unsafe-ffi.md](references/unsafe-ffi.md) before you write or review `unsafe` code, FFI, `static mut`, raw pointers or unions, or run Miri.

## Check first

- Read `edition`, `rust-version`, `resolver` and `[lints]` in `Cargo.toml` and in the workspace root manifest, and `rust-toolchain.toml`, `.cargo/config.toml`, `clippy.toml` and `rustfmt.toml` if present.
- The local toolchain is often newer than `rust-version`, so a clean local build proves nothing about the MSRV. Check with `cargo +<msrv> check --all-targets`, and check the "since" version on the std docs page of any API you are not sure about.
- When raising the toolchain or `rust-version`, read the Compatibility Notes of every release in between in `RELEASES.md` of rust-lang/rust.
- Look up crate versions and each version's `rust_version` in the crates.io API (`https://crates.io/api/v1/crates/<name>/versions`), which returns 403 without a `User-Agent` header.

## Toolchain and Cargo

- Edition 2024 needs Rust 1.85 and is the newest edition. Start new crates with `edition = "2024"` and a `rust-version`.
- `edition = "2024"` implies `resolver = "3"`, which prefers dependency versions whose `rust-version` fits yours. A virtual workspace has no edition, so write `resolver = "3"` in its `[workspace]` table.
- Configure lints in `Cargo.toml` under `[lints.rust]`, `[lints.clippy]` and `[lints.cargo]`. Cargo's own lints are stable since 1.100 and include `unused_dependencies`. Write lint names with underscores, because Cargo 1.99 warns on hyphens.
- Fail on warnings with `CARGO_BUILD_WARNINGS=deny` or `[build] warnings = "deny"` in `.cargo/config.toml` (1.97), because `RUSTFLAGS=-Dwarnings` invalidates the build cache.
- In a new workspace, or when the user asks for one, set a dependency cooldown (1.100) in `.cargo/config.toml` with `[registry] global-min-publish-age = "3 days"`. Versions already in `Cargo.lock` stay usable, and `cargo install` ignores the setting. Take one newer version early with `CARGO_RESOLVER_INCOMPATIBLE_PUBLISH_AGE=allow cargo update <crate> --precise <version>`.

## Language

- Use let chains `if let Some(x) = a && x > 0` in `if` and `while` (1.88, edition 2024 only) and `if let` guards on `match` arms (1.95).
- Write `#[expect(lint, reason = "...")]` instead of `#[allow(lint)]` (1.81), so the attribute warns once the lint no longer fires.
- Name `!` anywhere, for example `Result<T, !>` (1.100). `Infallible` is now an alias of `!`.
- Infer const generic arguments with `_`, as in `[false; _]` (1.89).
- `core::range::{Range, RangeFrom, RangeInclusive}` (1.95 and 1.96) are `Copy` and can live in `Copy` structs, but range syntax still builds the legacy types. Accept `impl RangeBounds<T>` in public APIs.

## Code

- Release builds wrap integer overflow silently. Use `checked_*` where overflow is an expected case, `strict_*` (1.91, panics in every profile) where it is a bug, or `overflow-checks = true` in `[profile.release]` for code that handles money or sizes.
- `as` truncates and wraps without a warning. Convert with `From` or `TryFrom` and, in new crates or when the user asks, turn on `clippy::cast_possible_truncation` and `cast_sign_loss` for arithmetic on sizes or offsets.
- In a new crate, or when the user asks for hardening, put `#![forbid(unsafe_code)]` on crates that need no unsafe, and where unsafe is needed enable `clippy::undocumented_unsafe_blocks` so every block carries a `// SAFETY:` argument.
- Take `&str`, `&[T]` or `impl AsRef<Path>` and return owned values. Before a `.clone()` that only quiets the borrow checker, check whether a borrow or `std::mem::take` fits.
- `HashMap`'s default SipHash resists collision attacks but is slow. Use a faster hasher (`foldhash`, `rustc-hash`) only for keys an attacker cannot choose.
- Pass `Vec::with_capacity(n)` or `Vec::from_fn(n, f)` (1.100) when the length is known, and measure with `cargo build --release` or a bench harness, not with a debug build.

## Gotchas

- Rust 1.100 changed never type fallback from `()` to `!` on all editions. `f()?;` where `f` is generic over its `Ok` type, `run(|| panic!())` against a trait bound, and `if c { Default::default() } else { return }` now fail to compile. Write the type, as in `f::<()>()?`, `() = f()?;` or `|| -> () { panic!() }`.
- Sorting (1.81), `derive(PartialOrd)` next to `Ord` (1.98), `BTreeMap::append` (1.96) and `Iterator::min` and `max` (1.100) rely on consistent `Ord`, `PartialOrd` and `Eq` impls and may panic or return other elements otherwise. With a manual `Ord`, implement `partial_cmp` as `Some(self.cmp(other))`.
- `[workspace.lints]` is not inherited. Each member needs `[lints] workspace = true`, and Cargo's `missing_lints_inheritance` lint warns when it is missing.
- A lint group and a single lint at the same priority apply in undefined order. Write groups as `pedantic = { level = "warn", priority = -1 }`.
- Clippy's `msrv` defaults to `rust-version`, and without `rust-version` it suggests the newest std APIs. Enable `clippy::incompatible_msrv` to flag std items newer than the MSRV.
- `cargo::unused_dependencies` checks only the dependency tables that the selected targets fully cover and skips `[dev-dependencies]`. Run `cargo check --all-targets` before trusting a clean result.
- With `resolver = "3"` the resolver silently picks older crates for a low `rust-version`. tokio 1.54 needs Rust 1.85, so `rust-version = "1.80"` resolves tokio to 1.53.x, and when no version fits the MSRV it picks an incompatible one without an error.
- Since 1.99, a member on edition 2024 can turn off an inherited dependency's default features with `{ workspace = true, default-features = false }`. Older editions ignore that key with a warning. Features still unify across members built together.
- Lockfile v4 (default since 1.83) cannot be read by toolchains before 1.78. TOML 1.1 syntax in `Cargo.toml`, such as multi-line inline tables (1.94), raises the development MSRV.
- Rust 1.100 changed the build directory layout and it stays unstable. Locate artifacts through `cargo build --message-format=json` or `CARGO_BIN_EXE_<name>` (readable at runtime since 1.94), not through paths under `target/`.
- Linker failures on `x86_64-unknown-linux-gnu` since 1.90 can come from LLD becoming the default. Opt out with `-Clinker-features=-lld`. Since 1.97 v0 symbol mangling is the default and old profilers or debuggers may fail to demangle.
- `fn items(&self) -> Iter<T>` warns with `mismatched_lifetime_syntaxes` (1.89). Write `Iter<'_, T>`.
- `std::i32::MAX` style module constants are fully deprecated (1.99) and `std::char` constants and functions are deprecated (1.97). Use `i32::MAX`, `char::MAX`, `char::from_u32`.
- `pin!(x)` with `x: &mut T` yields `Pin<&mut &mut T>` since 1.97. Use `Pin::new(x)` when the target is `Unpin`.
- Adding any field, even a private one, to a public struct whose fields are all public breaks callers, and so do a new variant of a public enum and a `#[non_exhaustive]` added later. Mark such types `#[non_exhaustive]` before the first release, and run `cargo semver-checks` before a publish.
- rand 0.9 renamed `thread_rng()` to `rng()`, `gen` to `random` and `gen_range` to `random_range`. rand 0.10 (MSRV 1.85) renamed the `Rng` trait to `RngExt` and `OsRng` to `SysRng`.

Related skills: concise:testing for proptest and cargo-mutants, concise:debugging for crashes and failing tests, concise:codebase-analysis for `cargo tree` and wide mechanical changes, concise:github-actions for CI wiring.
