# ECMAScript features, where they run, and Temporal

## Where ES2025 to ES2027 features run

The Baseline column is the date the last of the major browsers shipped the feature, from the web-features data (version 3.46). Vite 8's default target is Baseline Widely available as of 2026-01-01 (browsers released in the first half of 2023), so every row needs a polyfill or a raised target for browsers. On 2026-11-19 Safari 27.2 was the shipped release and 27.3 was in beta.

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
| `Error.isError` | ES2026 | no, Safari is partial | 24.3 |
| `using`, `await using`, `DisposableStack` | ES2027 | no, not in Safari 27.2 | 24 |
| `Temporal` | ES2027 | no, not in Safari 27.2 | 26 |
| `Iterator.zip`, `chunks`, `includes`, `join` | ES2027 | no | not in 26 |

`Temporal` also runs in Chrome 144, Firefox 139, the Safari 27.3 beta, Deno 2.7 and Bun 1.4, and Bun 1.4 also has `Iterator.zip`, `chunks`, `includes` and `join`. `Intl.DurationFormat` is Baseline since 2025-03.

## TypeScript types for them

- `lib: ["es2025"]` covers the ES2025 rows. TypeScript 6.0 and 7.0 type `Array.fromAsync`, `Error.isError`, `Uint8Array` base64, `getOrInsert`, `using` and `Temporal` only under `esnext`, and `Temporal` also as `esnext.temporal`.
- TypeScript 7.0 has no types for `Math.sumPrecise`, `Iterator.concat` or `JSON.rawJSON`, even under `esnext`. TypeScript 7.1, in beta on 2026-11-19, moves all ES2026 rows into `lib: ["es2026"]` and adds `Iterator.zip`, `chunks`, `join`, `includes` and `Promise.allKeyed` to `esnext`.
- TypeScript and Oxc lower `using` for older targets, but the output still needs `Symbol.dispose` at run time, and TypeScript's helper throws "Symbol.dispose is not defined" without it.

## Traps

- Set methods take a Set-like argument with `size`, `has` and `keys`, so `set.union([1, 2])` throws a `TypeError`. Wrap arrays in `new Set()`.
- `Array.fromAsync(items, asyncFn)` awaits one element at a time, so use `Promise.all(items.map(asyncFn))` when the calls may run concurrently.
- Import assertions (`assert { type: 'json' }`) are a syntax error in Node.js 24, and TypeScript 6 and 7 reject them. Write `with { type: 'json' }`.
- `Uint8Array.fromBase64` and `toBase64` replace `atob` and `btoa` for binary data without the Latin-1 string detour. Node.js 24 lacks them, so use `Buffer.from(text, 'base64')` there.
- `Error.isError(value)` detects errors from other realms (iframes, `vm` contexts) where `instanceof Error` fails. Safari's implementation returns `false` for `DOMException`, so feature-detect it.
- `str.length` and `str.slice()` count UTF-16 units, so truncating user-visible text can split an emoji or a combining mark. Truncate by graphemes from `new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(str)`.

## Temporal

These rules follow the Temporal guides of Chrome's Modern Web Guidance.

- Feature-detect with `typeof Temporal === 'undefined'` and only then load `temporal-polyfill` (about 15 KB min+gz) with a dynamic `import()`. Importing it does not set the global, so assign `globalThis.Temporal = module.Temporal` when code relies on the global. In a bundled app, import the npm package rather than a CDN URL.
- Vitest 5 fake timers and `vi.setSystemTime` also mock `Temporal` when it is present.
- Use `Temporal.Instant` for timestamps recorded by a server, database or log, with nanosecond precision. Parse with `Temporal.Instant.from(iso)`, sort with `Temporal.Instant.compare` and test equality with `a.equals(b)`, because `new Date(iso)` truncates to milliseconds and makes sub-millisecond events collide.
- Use `Temporal.ZonedDateTime` with an IANA zone (`America/New_York`) for an event in a place, such as a meeting or a renewal, and convert it with `.withTimeZone()`. `PlainDateTime` carries no zone and cannot follow DST, so it does not fit such events.
- Use `PlainDate` for birthdays and billing dates, `PlainTime` for store hours and alarms, `PlainYearMonth` for card expiry and `PlainMonthDay` for yearly dates. Convert a `PlainMonthDay` to a `PlainDate` with `.toPlainDate({ year })` before doing arithmetic.
- Build values with methods rather than interpolated ISO strings, as in `Temporal.PlainDate.from(date).toPlainDateTime(time).toZonedDateTime(tz)`.
- `ZonedDateTime` `since()` and `until()` default to `largestUnit: 'hour'`. Pass `largestUnit: 'day'`, `'month'` or `'year'` for a human-scale result, and `smallestUnit` to round away seconds.
- `Temporal.Duration.compare(a, b, { relativeTo })` needs `relativeTo` when either duration has years, months or weeks, or crosses a DST change. Check expiry with `duration.sign < 0`.
- `plainDate.add({ months: 1 })` defaults to `overflow: 'constrain'`, which turns Jan 31 into Feb 28 or 29. Pass `{ overflow: 'reject' }` to get a `RangeError` instead.
- `ZonedDateTime.from()` defaults to `disambiguation: 'compatible'`, which resolves skipped or repeated DST hours silently. Use `'reject'` to detect such a time and warn the user.
- Format durations for people with `duration.toLocaleString(locale, { style })`, which uses `Intl.DurationFormat`, and use `duration.toString()` only for ISO 8601 output such as `<time datetime>`.
- `duration.total('nanoseconds')` returns a `Number` and loses precision for spans over about 104 days, so keep intervals as durations.
- In browsers `Temporal.Now.instant()` is clamped for timing-attack protection, so measure client intervals with `performance.now()`.
- Temporal objects are immutable, so `add`, `subtract`, `round` and `with` return new objects.
- For non-Gregorian calendars, use `withCalendar()`, identify months by `monthCode` in lunisolar calendars (Hebrew, Chinese), read `monthsInYear` and `daysInMonth` instead of assuming 12 and 31, and compare with `Temporal.PlainDate.compare`.
