# Streaming and backpressure

## Couple production to receiver capacity

When responses are large or continuous, avoid collecting the entire result before sending it, use the framework's demand, awaited-write, or drain mechanism, and bound application queues, prefetch, transform concurrency, and message size, because transport flow control does not bound work queued elsewhere in the application. Smaller buffers reduce peak memory but can lower throughput, and more prefetch helps latency only while memory and downstream capacity remain bounded. Check a very slow receiver, oversized records, and a transform that expands input, and verify memory stops growing and the producer eventually pauses instead of accumulating background promises.

<example>
A Next.js route returns the export service's body with `return new Response(upstream.body)`, so bytes flow before a 60-second proxy idle timeout and the full file is never held in memory.
</example>

For Node streams, stop writing when `write` returns false until `drain`, remember that `highWaterMark` is a threshold and not a strict memory cap and that object-mode thresholds count objects and not bytes, and use each other runtime's documented controls instead of copying Node's values, because a producer that ignores the false result keeps buffering in process memory and the thresholds do not transfer between runtimes.

<example>
A CSV export loop `for (const row of rows) res.write(line)` becomes `await pipeline(Readable.from(rows), toCsv, res)`, which handles `drain` itself.
</example>

## Coordinate both directions and resource ownership

When streaming calls can be cancelled, connect cancellation to the producer and release the owned readers, cursors, sockets, and child tasks, while leaving shared resources that belong to other work open, and check what the library closes automatically and what the handler owns, because a detached producer survives the disconnect and consumes resources even when nobody receives its results. Explicit lifetime handling costs coordination. Check disconnect while blocked on a write and cancellation during a read, and verify no leaked task or occupied connection remains.

<example>
A Spring MVC handler returning an `SseEmitter` registers an `onCompletion` callback that cancels its upstream stock-level subscription, and it leaves the shared database pool open.
</example>

For duplex streams, maintain progress in both directions and prefer existing streaming primitives over a homemade pair of unbounded queues, because with manual flow control both peers writing without reading can deadlock. Check by filling both directions simultaneously and verify no deadlock remains.

<example>
A Go WebSocket gateway reads client frames in one goroutine and writes telemetry readings in another, so a client flooding input cannot stop the server from draining its own output.
</example>

## Define partial results and reconnect behavior

When a stream can fail after sending data, define what makes the logical result complete, and after HTTP final headers are sent use supported stream termination or application framing instead of appending an unrelated JSON error or a second final status, because a successful write or local finish is not proof that the remote application consumed it, and clients must tell truncation from completion. Check failure mid-record and disconnect after the last data item but before completion, and confirm clients detect truncation and cannot mistake partial output for a complete successful result.

<example>
An SSE endpoint streaming a CSV import's progress ends a good run with `event: done` and a failure with `event: error`, because the HTTP status is already `200` after the first event.
</example>

If reconnect or resume is required, define a stable sequence or checkpoint, replay horizon, and duplicate handling, reauthorize the resumed request, and restart the stream from the beginning only when its effects and replayed records support that, because a position token is not permission to retrieve the underlying records. Resume state and terminal framing add protocol complexity, and for a simple immutable download, failing clearly and restarting may be sufficient. Check resume at an expired checkpoint.

<example>
A client reconnects with `Last-Event-ID: 412`, the server confirms the session still owns the subscription and replays events from 413 out of a 5-minute buffer, and an expired ID gets a `reset` event telling the client to reload.
</example>
