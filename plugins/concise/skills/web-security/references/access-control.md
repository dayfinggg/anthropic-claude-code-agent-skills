# Access control, object checks and tenant isolation

## The question to answer

- For every resource, ask whether user A, knowing the ID of an object of user B or of tenant B, can read, change, delete, list, export or count it. Trace the ID from where it enters (path, query, body, header, job payload) to the query that fetches the data, and list every check in between, base classes, middleware, managers and decorators included.
- Take the census by side effect, not by HTTP verb or route prefix. Name the internal function that does the harm and find every handler that reaches it, GET routes included, because a guard on `/x/approve` does not protect `/x`.

## Where object checks go missing

- Lookups by ID alone, such as `Model.objects.get(pk=...)`, `findUnique({ where: { id } })`, `find($id)`, `findById(id)` or `repository.find(id)`, need the owner or tenant in the query, or a check on the fetched object before any use.
- A child resource fetched by its own ID under a checked parent escapes the check, as in `/projects/{p}/files/{f}` that verifies `p` and loads `f` without confirming it belongs to `p`, and so does a route that authorizes on its path but acts on a body field such as `target`, `repo` or `url`.
- List, search, export, count, autocomplete and bulk endpoints often skip the per-object check that the detail route has.
- GraphQL `node(id:)` and other global lookups, batch loaders, and `include`, `expand` or `fields` parameters can pull related objects past the resolver's check.
- File downloads by storage key or path, pre-signed URL generation and predictable object-storage keys skip it too.
- WebSocket and subscription channels named by an ID are often checked only at connect time, or not at all.
- Background jobs, webhooks and queue consumers take an ID from the payload and run with system privileges.
- Unguessable IDs such as UUIDs and hashids are not authorization, because they leak through URLs, logs, referrers and exports.

## Property-level checks

- Writes that take ownership or privilege fields from the request body are mass assignment, such as ORM calls with `data: req.body`, `Object.assign(entity, body)`, `Model(**request.json)`, and framework shortcuts that accept every field, such as DRF `fields = '__all__'`, Rails `permit!` and Laravel `$guarded = []`. Owner, tenant, role and `is_admin` come from the session.
- Reads that return whole entities expose fields the caller may not see, such as password hashes, tokens, internal flags and other tenants' foreign keys, so return an explicit response schema per role.

## Tenant isolation

- A tenant taken from the URL, a header or a subdomain must be checked against the caller's memberships on every request, not only at login.
- Tenant context stored in `threading.local` inside an asyncio app, or in a module-level variable, is shared between concurrent requests on the same thread. Use `contextvars` in Python and `AsyncLocalStorage` in Node.
- Jobs, cron tasks, management commands and event handlers often run with no tenant set, so automatic scoping does nothing or the query is unscoped.
- Escape hatches bypass automatic scoping, such as unscoped managers, `withoutGlobalScopes()`, raw SQL, `.unscoped` and admin-only repositories reused by public code.
- Caches, search indexes, rate-limit buckets, file prefixes and message topics keyed without the tenant or user leak across tenants, and a CDN that caches an authenticated response without `Cache-Control: private` or `no-store` serves it to the next visitor.
- Globally unique constraints and lookups (email, slug) reveal that a record exists in another tenant.

## Gates that do not gate

- A gate counts only if it compares the caller with the owner. Read the body of every helper named owner, guard, policy or permission, because an authentication check, model-level permissions, an app-token check or a lookup that the record exists do not stop a non-owner.
- Role checks that compare against a deny value pass when the value is missing, as with `role != 'banned'` or `!user.isBlocked`, so compare against an allow value.
- Authorization done in the frontend, in a GraphQL directive that some resolvers lack, or in a gateway that another route bypasses protects nothing on the paths without it. A route guard (TanStack `beforeLoad`, a layout) protects the page, not the server functions it calls, which are endpoints anyone can call directly.
