# Monetary and temporal values

## Represent exact money deliberately

When values require exact monetary arithmetic, keep amount and currency together and use the project's decimal representation or scaled integers with explicit units and range, because binary floating-point cannot represent most decimal fractions exactly, and minor units are not universally two decimal places. Give fractional rates more precision than settlement amounts need.

<example>
A Node.js checkout adds `1999` and `1` minor units instead of `19.99 + 0.01`, and `JPY` amounts carry no decimals while `KWD` carries three.
</example>

Set rounding mode, rounding boundary, allocation remainder, and conversion policy from the business contract, and put repeated monetary behavior in the existing value type instead of scattered endpoint formatting, because an invented conversion rate or a silent sum of different currencies produces amounts nobody agreed to. Check equal allocation of `10.00` among three recipients with the total preserved, then mixed currencies, fractional rates, refunds, and rounding at the actual settlement boundary and not display formatting.

<example>
Splitting `10.00` three ways gives `3.34`, `3.33`, `3.33` by the documented remainder rule and an assertion that the parts sum to `10.00`, while adding an `EUR` line to a `USD` total throws.
</example>

Check numeric limits end to end for JSON clients, and review compatibility before changing a public numeric field to a string, because integers outside `[-(2**53)+1, (2**53)-1]` are not exactly interoperable across common implementations. Scaled integers simplify addition but need an agreed scale and overflow handling, and decimal strings preserve wire precision but require explicit parsing. Check large amounts through the real client serializer.

<example>
A Next.js client running `JSON.parse('{"ledger_id": 9007199254740993}')` receives `9007199254740992`, so the server sends that ID as a string after the compatibility review.
</example>

## Separate instants from civil-time intent

When an API carries time, identify whether it means an instant, date, local appointment, recurrence, duration, or interval, define precision and units, and use the established offset-bearing representation for an instant, because RFC 3339 timestamps identify instants and not complete scheduling rules. Check milliseconds mistaken for seconds, equal instants with different offsets, precision round trips, and interval endpoint inclusion against the business rule.

<example>
A response field named `timeout_ms: 1500` is documented with its unit, because an iOS client that reads it as seconds would wait twenty-five minutes.
</example>

When a business rule means a local time in a place, keep the named zone and civil-time intent, and decide how nonexistent and repeated local times behave, because a UTC offset alone cannot express future daylight-saving changes. RFC 9557 adds zone information to fixed timestamps but does not define recurring-schedule semantics, so add its suffix format only when clients support it. Normalizing to UTC simplifies instant comparison but can discard scheduling intent, while preserving zones needs rule-version and ambiguity handling. Check a daylight-saving gap and overlap.

<example>
A Ruby appointment-reminder service stores "every day at 08:30" with `Europe/Berlin` and computes the next UTC instant when it schedules the send, so the reminder holds 08:30 across clock changes, and a nonexistent local time runs right after the gap by the documented rule.
</example>

## Use the right clock for waiting and ordering

When measuring elapsed time or enforcing a local retry budget, use a monotonic clock, and give a persisted business deadline an explicit wall-clock interpretation, because monotonic values are not portable across hosts or process lifetimes and a serialized local timestamp means nothing to a remote reader. Check a backward wall-clock adjustment during a timeout and confirm waiting stays bounded.

<example>
A Node.js worker times a carrier API call with `performance.now()` and a Python worker uses `time.monotonic()`, while the stored `expires_at` is a UTC wall-clock value.
</example>

When events require causal or per-object order, use the platform's sequence or version contract, because wall-clock timestamps alone cannot establish that order under clock skew, and the sequence tracking costs less than silently reordering dependent changes. Check two dependent events with reversed timestamps and confirm the business order still holds.

<example>
Order events carry a per-order `version` integer, so the consumer applies `paid` after `created` even when `occurred_at` from two servers says the opposite.
</example>
