## The question to answer

- For every resource: if user A knows the ID of user B's object, or of an object in tenant B, can A read, change, delete, list, export or count it? Trace from where the ID enters (path, query, body, header, job payload) to the query that fetches the data, and list every check in between, including base classes, middleware, managers and decorators.
- Census by side effect, not by HTTP verb or route prefix. Name the internal function that does the harm and find every handler that reaches it, GET routes included. A guard on `/x/approve` does not protect `/x`.

## Where object checks go missing

- Lookups by ID alone: `Model.objects.get(pk=...)`, `findUnique({ where: { id } })`, `find($id)`, `findById(id)`, `repository.find(id)`. The owner or tenant must be part of the query, or a check must run on the fetched object before any use.
- Child resources fetched by their own ID under a parent that was checked: `/projects/{p}/files/{f}` that verifies `p` and then loads `f` without confirming it belongs to `p`. Likewise a route that authorizes on its path but acts on a body field such as `target`, `repo` or `url`.
- List, search, export, count, autocomplete and bulk endpoints, which often skip the per-object check that the detail route has.
- GraphQL `node(id:)` and other global lookups, batch loaders, and `include`, `expand` or `fields` parameters that pull related objects past the resolver's check.
- File downloads by storage key or path, pre-signed URL generation, and predictable object-storage keys.
- WebSocket and subscription channels named by an ID, checked at connect time or not at all.
- Background jobs, webhooks and queue consumers that take an ID from the payload and run with system privileges.
- Writes that take ownership or privilege fields from the request body (mass assignment): Django forms and DRF serializers with `fields = '__all__'`, Rails `permit!`, Laravel `$guarded = []` or `forceFill`, ORM calls with `data: req.body`, `Object.assign(entity, body)`, `Model(**request.json)`. Owner, tenant, role and `is_admin` must come from the session.
- Unguessable IDs (UUIDs, hashids) are not authorization. They leak through URLs, logs, referrers and exports.

## Tenant isolation

- A tenant taken from the URL, a header or a subdomain must be checked against the caller's memberships on every request, not only at login.
- Tenant context stored in `threading.local` inside an asyncio app, or in a module-level variable, is shared between concurrent requests on the same thread. Use `contextvars` in Python and `AsyncLocalStorage` in Node.
- Jobs, cron tasks, management commands and event handlers often run with no tenant set, so automatic scoping does nothing or the query is unscoped.
- Escape hatches bypass automatic scoping: unscoped managers, `withoutGlobalScopes()`, raw SQL, `.unscoped`, admin-only repositories reused by public code.
- Caches, search indexes, rate-limit buckets, file prefixes and message topics keyed without the tenant or user leak across tenants. A CDN that caches an authenticated response without `Cache-Control: private` or `no-store` serves it to the next visitor.
- Globally unique constraints and lookups (email, slug) reveal that a record exists in another tenant.

## Framework traps

- Django REST Framework: `has_object_permission` runs only when the view calls `get_object()`. It does not run for list views, for creates, or when the view fetches with `Model.objects.get` itself. Setting `permission_classes` on a view replaces `DEFAULT_PERMISSION_CLASSES` instead of adding to it, and with no default configured the policy is `AllowAny`.
- A gate counts only if it compares the caller with the owner. Read the body of every helper named owner, guard, policy or permission: `IsAuthenticated`, model-level permissions, an app-token check or a lookup that the record exists do not stop a non-owner.
- Symfony: `#[IsGranted('ROLE_USER')]` checks a role only. Object checks need a subject (`#[IsGranted('edit', 'post')]`) or `denyAccessUnlessGranted('edit', $post)` with a voter. An `EntityType` field without a user-scoped `query_builder` lists, and accepts, every row.
- Role checks that compare against a deny value pass when the value is missing: `role != 'banned'`, `!user.isBlocked`. Compare against an allow value.
- Authorization done in the frontend, in a GraphQL directive that some resolvers lack, or in a gateway that another route bypasses, protects nothing on the paths without it. A route guard (TanStack `beforeLoad`, a layout) protects the page, not the server functions it calls, which are endpoints anyone can call directly.
