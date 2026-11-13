## Where ES2025 to ES2027 features run

Baseline dates are when the last major browser shipped the feature (web-features, November 2026). Vite 8's default target covers only features Baseline before mid-2023, so everything below needs a polyfill or a raised target for browsers.

| Feature | Spec | Baseline | Node.js |
|---|---|---|---|
| Iterator helpers (`map`, `filter`, `take`, `drop`, `flatMap`, `reduce`, `toArray`, `Iterator.from`) | ES2025 | 2025-03 | 22 |
| Set methods (`union`, `intersection`, `difference`, `symmetricDifference`, `isSubsetOf`, `isSupersetOf`, `isDisjointFrom`) | ES2025 | 2024-06 | 22 |
| `Promise.try(fn, ...args)` | ES2025 | 2025-01 | 23 |
| `RegExp.escape` | ES2025 | 2025-05 | 24 |
| `Float16Array`, `Math.f16round` | ES2025 | 2025-04 | 24 |
| Import attributes and JSON modules | ES2025 | 2025-04 | 20.10 |
| RegExp modifiers `(?i:abc)` | ES2025 | 2025-09 | 23 |
| Duplicate named capture groups | ES2025 | 2024-08 | 23 |
| `Array.fromAsync` | ES2026 | widely available | 22 |
| `JSON.rawJSON`, `JSON.parse` reviver `context.source` | ES2026 | 2025-03 | 21 |
| `Uint8Array.fromBase64`, `fromHex`, `toBase64`, `toHex`, `setFromBase64`, `setFromHex` | ES2026 | 2025-09 | 25 |
| `Map` and `WeakMap` `getOrInsert`, `getOrInsertComputed` | ES2026 | 2026-02 | 26 |
| `Iterator.concat` | ES2026 | 2026-03 | 26 |
| `Math.sumPrecise` | ES2026 | 2026-04 | not in 26 |
| `Error.isError` | ES2026 | no, missing in Safari | 24.3 |
| `using`, `await using`, `DisposableStack` | ES2027 | no, missing in Safari | 24 |
| `Temporal` | ES2027 | no, missing in Safari | 26 |
| `Iterator.zip`, `chunks`, `includes`, `join` | ES2027 | no | not in 26 |

Bun 1.4 and Deno 2.7 or later ship `Temporal`, and Bun 1.4 also has `Iterator.zip` and `includes`.

## TypeScript types for them

- `lib: ["es2025"]` covers the ES2025 rows. TypeScript 6.0 and 7.0 type `Array.fromAsync`, `Error.isError`, `Uint8Array` base64, `getOrInsert`, `using` and `Temporal` only under `esnext`.
- TypeScript 7.0 has no types for `Math.sumPrecise`, `Iterator.concat` or `JSON.rawJSON` even under `esnext`. They arrive with 7.1 (`es2026`).
- TypeScript and Oxc lower `using` for older targets, but the output still needs `Symbol.dispose` at run time, and TypeScript's helper throws "Symbol.dispose is not defined" without it.

## Traps

- Iterator helpers live on iterators, not arrays. Write `arr.values().map(f).toArray()`. They are lazy and single-use, so iterating the same helper twice yields nothing the second time.
- Set methods take a Set-like argument with `size`, `has` and `keys`. `set.union([1, 2])` throws a `TypeError`, so wrap arrays in `new Set()`.
- `Array.fromAsync(items, asyncFn)` awaits one element at a time. Use `Promise.all(items.map(asyncFn))` when the calls may run concurrently.
- Import assertions (`assert { type: 'json' }`) are a syntax error in Node.js 24, and TypeScript 6 rejects them. Write `with { type: 'json' }`.
- `Uint8Array.fromBase64` and `toBase64` replace `atob` and `btoa` for binary data without the Latin-1 string detour. Node.js 24 lacks them, so use `Buffer.from(text, 'base64')` there.
- `Error.isError(value)` detects errors from other realms (iframes, `vm` contexts) where `instanceof Error` fails. Feature-detect it while Safari lacks it.
- Use `Temporal` through `temporal-polyfill` or `@js-temporal/polyfill` in browsers. Vitest 5 fake timers and `vi.setSystemTime` also mock `Temporal` when it is present.
- `str.length` and `str.slice()` count UTF-16 units, so truncating user-visible text can split an emoji or a combining mark. Truncate by graphemes from `new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(str)`, Baseline widely available.
- Standard decorators (stage 3) run natively nowhere. TypeScript compiles them, Vite 8's Oxc does not lower them, and Node.js type stripping rejects them. `experimentalDecorators` stays the legacy form that NestJS, Angular and TypeORM use.
