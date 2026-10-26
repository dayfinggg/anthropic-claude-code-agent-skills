# Backend sources and sinks

## Parse the representation the application will use

When external data enters an operation, define the accepted types, required fields, lengths, ranges, collection sizes, and semantic relationships, validate the parsed representation once at the boundary, pass typed values downstream, and bound work before expensive parsing where possible, because later code that reads the raw text again can see something different from what was validated. Avoid globally stripping punctuation or silently turning invalid security data into a default, and handle fields that affect authority or interpretation explicitly, though compatibility may permit irrelevant unknown fields. Check missing and null values, duplicate parameter ambiguity, unexpected nested structures, and oversized input. Valid syntax still needs object authorization and a safe final sink.

<example>
The Go handler defaults an absent `page` to 1, otherwise requires exactly one `page` value that `strconv.Atoi` turns into a number from 1 to 500, and answers 400 for anything else, so `?page=abc`, `?page=1&page=2`, and `?page=99999999999` are rejected and do not turn into page 1.
</example>

When data from outside the trust boundary reaches a deserializer, XML parser, or template engine, choose a data-only format and the parser's safe mode, leave object construction, external entities, and DTDs off, and keep user text out of template source, because native deserialization and template evaluation run logic chosen by the sender. Check a type-tagged payload, an external-entity reference, and a template expression in a user field with an inert marker, and confirm each stays plain data.

<example>
The settings import calls `yaml.safe_load`, and an uploaded document with `!!python/object/apply:os.system ["echo MARKER"]` raises a constructor error and prints no `MARKER`.
</example>

## Separate query data from query structure

When data reaches SQL, bind values using the driver or ORM's parameter API, keep table, column, operator, and sort choices fixed or mapped to application-owned choices, and inspect raw fragments and dynamic SQL inside reached stored procedures, because parameterizing a procedure call does not secure SQL concatenated inside it. A bound query still needs tenant scoping and field authorization. Check metacharacters as literal values, an unknown sort option, and an existing foreign object identifier, and assert both the query's result scope and the absence of unauthorized mutation.

<example>
A psycopg query runs `SELECT id, name FROM products WHERE tenant_id = %s AND name ILIKE %s` with bound values, and `?sort=` goes through `{"price": "unit_price", "name": "name"}.get(sort, "name")` before it reaches `ORDER BY`.
</example>

## Avoid command interpreters and dangerous argument semantics

When a feature needs an operating-system operation, prefer its library API, and otherwise choose a fixed executable with separate arguments and no command interpreter, validate which operands and options the executable accepts, set execution limits, and restrict privileges, because a single argument can still select an output file, plugin, configuration, or additional network target, and an option terminator works only for programs that support it. Check leading option characters, spaces, and metacharacters through a harmless stub executable, and assert the exact arguments and intended destination and not merely that shell injection failed.

<example>
A Node thumbnail job calls `execFile('magick', [inputPath, '-resize', '800x', outputPath])` with both paths built by the server, and the stub test asserts that `argv` holds exactly those four items for an upload named `-write evil.txt`.
</example>

When targeting Windows, verify whether the selected runtime invokes an interpreter for batch files, and prefer a native executable or library when operands are untrusted, because a process API's shell setting is not a universal guarantee for `.bat` or `.cmd`, and Unix quoting does not apply to Windows command parsing. Check the platform-specific launch path with inert arguments and a controlled fixture, and demonstrate parsing behavior with harmless payloads and not destructive ones.

<example>
A Node script on Windows that starts `build.cmd` with a user-supplied tag is tested with the inert argument `a&echo MARKER` in a temp directory to see whether `echo MARKER` runs, and the fix launches `node.exe build.js` directly with the tag as an argument.
</example>

## Enforce filesystem containment during use

When users select stored files, prefer an authorized opaque identifier mapped to a server-owned path, and if paths are required, resolve against the intended root and compare complete path components under the target platform's rules, accounting for absolute paths, alternate separators, drive or network roots, symlinks, junctions, and archive entries, because repeated decoding or removing `..` is not containment. Check traversal, an absolute path, a sibling whose name shares the root prefix, and a valid file, and use a harmless outside-root marker to prove that no unintended read or overwrite occurred.

<example>
`GET /files/31` looks up `files.stored_name` and opens `ROOT / stored_name`, and where a name is accepted, the code serves the file only when `(ROOT / name).resolve().is_relative_to(ROOT)` holds, so `/srv/data/uploads-old/x.pdf` fails for the root `/srv/data/uploads`.
</example>

When an attacker can modify containing directories, use rooted or handle-relative operations that enforce containment and link policy during access, and otherwise keep every containing directory outside attacker control, because canonicalization followed by a later open leaves a race window, and exclusive creation prevents overwriting an existing leaf but does not secure attacker-controlled parent directories. Check a link escape and, where supported, a controlled link-swap race, and verify that the actual opened object stays within the authorized root. If a required guarantee is unavailable, state that boundary and avoid claiming that a string check solves it.

<example>
On a shared host where users can create symlinks inside `uploads/`, the cleanup script opens files relative to a directory handle on the uploads root, and a test swaps `uploads/tmp` for a link to a marker folder between the check and the open.
</example>

## Restrict where the backend may connect

When an input selects an internal integration, accept an application-owned destination identifier and not an arbitrary URL. For required URL input, parse with the same URL semantics the client uses, enforce the permitted scheme, hostname, port, and credentials policy, avoid suffix and substring matching, and disable redirects unless needed, validating every destination otherwise, because an allowed host can still contain an open redirect, and CORS is irrelevant to server-side fetch authorization. Check user-info confusion, lookalike hostnames, alternate ports, unsupported schemes, and redirect escape with a local fake transport.

<example>
An "add integration" form takes `integration=acme-crm` and the Java code maps it to a fixed `https://api.acme-crm.example/v2/`, and a custom-URL variant compares `URI.create(url).getHost()` with an exact allowlist, so `https://api.acme-crm.example@evil.test/` and `https://api.acme-crm.example.evil.test/` are rejected.
</example>

When arbitrary public destinations are required, use a vetted HTTP client or controlled egress layer that enforces address policy at connection time, covers all resolved IPv4 and IPv6 addresses, retries, and redirected connections, keeps TLS hostname verification intact, and prevents credential forwarding across destinations, because resolving and validating a hostname before an ordinary fetch leaves a second-resolution race. Block loopback, private, link-local, and other prohibited destinations according to deployment policy, and bound response bytes, decompression, and total duration independently of destination validation. Check DNS rebinding and mixed allowed and prohibited answers through a controlled resolver.

<example>
A link-preview fetcher for pasted URLs connects through an egress proxy that refuses `127.0.0.1`, `10.0.0.0/8`, and `169.254.169.254` after resolution, follows at most three redirects with the same check, and stops reading at 2 MB.
</example>

## Validate before publishing uploaded content

When accepting files, authorize upload and retrieval separately, stage files under generated names outside executable web content, validate supported extensions and the actual format with maintained parsers, and publish only after the required checks succeed, because neither a client MIME header nor a magic-byte check proves the entire file safe. If policy requires malware scanning, a scan failure is not permission to publish. Check spoofed MIME types, polyglot content, overwrite attempts, and requests during validation, and confirm that no rejected file becomes retrievable or executable, even briefly.

<example>
A tenant's logo upload lands in `/var/uploads/incoming/<random>.tmp`, is decoded and re-encoded by Pillow, and only then moves to `static/logos/`, so `shell.php.jpg` sent with `Content-Type: image/jpeg` is never served from a folder where the web server executes scripts.
</example>

When uploads are rendered, transformed, or unpacked, treat the parser and the resulting content as separate boundaries, limit expanded bytes, entry counts, nesting, CPU, and duration using the format library's supported controls, apply path containment to every extracted entry, and isolate risky converters from credentials and unnecessary network access, because safe storage alone does not prevent browser execution or parser compromise. Content reconstruction and scanning depend on the supported formats and are not a universal mandatory service. Check an oversized expansion, an outside-root archive entry, a parser timeout, and an active document viewed by another user.

<example>
An import of a ZIP of product images checks each entry name against the destination folder, stops at 200 entries and 100 MB expanded, and serves SVG files with `Content-Disposition: attachment` so a stored `<script>` never runs on the store origin.
</example>
