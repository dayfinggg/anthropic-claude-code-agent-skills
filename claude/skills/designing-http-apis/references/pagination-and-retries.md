# Pagination, retries, and evolution

## Pagination

- Adding pagination later breaks clients.
- Cursors are opaque URL-safe strings that clients never parse or build.
- Set a default and a maximum page size.
- The server lowers a larger request to the maximum.
- A negative or invalid page size is a client error.
- Return a `next` link and omit it on the last page.

## Retries and idempotency

- PUT and DELETE are idempotent.
- POST and PATCH are not guaranteed to be idempotent.
- Clients and agents retry after network failures.
- Accept `Idempotency-Key` on creating or state-changing POST and PATCH where a duplicate costs money or data.
- The client generates the key, for example a UUID v4.
- The key holds no personal data.
- Reusing a key with different parameters returns an error, never the stored response.
- Requests that fail validation before running are not stored.
- Keys expire after a documented period.
- The header is the IETF draft draft-ietf-httpapi-idempotency-key-header.
- It is not yet an RFC.

## Evolution and concurrency

- Run old and new versions side by side under one versioning scheme.
- Signal retirement with the `Deprecation` header from RFC 9745 and the `Sunset` header from RFC 8594.
- Add a `Link` to the migration guide.
- Updatable resources return an `ETag`.
- Updates where lost writes matter require `If-Match`, and a failed match returns 412.
- GET supports `If-None-Match` with 304.
- Omitted fields and `null` follow one documented rule.
