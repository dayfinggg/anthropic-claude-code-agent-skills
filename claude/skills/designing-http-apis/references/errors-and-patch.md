# Errors and partial updates

## Problem details

Use RFC 9457 problem details with `application/problem+json`.
Members are `type` as a URI, a stable `title`, `status`, `detail`, and `instance`.
Add extension members such as the invalid fields.
Clients ignore extension members they do not know, so adding members is not breaking.
Clients do not fetch the `type` URI automatically.
A missing `type` means `about:blank`.

```http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://api.example.com/problems/validation-error",
  "title": "Request body is invalid",
  "status": 422,
  "detail": "2 fields failed validation",
  "instance": "/v1/orders",
  "errors": [
    {"field": "items[0].quantity", "message": "must be at least 1"},
    {"field": "customerId", "message": "is required"}
  ]
}
```

## Other operations

- Model a rare non-CRUD operation as an action endpoint, such as `POST /orders/{orderId}/cancel`.
- Search that needs a body uses QUERY from RFC 10008 when the stack supports it.
- Otherwise use POST for that search and document it as read-only.
- PATCH with `application/merge-patch+json` fits resources without nullable fields or array edits.
- With merge patch, a null deletes the field and arrays are replaced whole.
- Use `application/json-patch+json` when a field can hold an explicit null.
- Also use `application/json-patch+json` when array elements need edits.
