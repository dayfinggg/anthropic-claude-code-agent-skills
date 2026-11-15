# Framework behavior that hides or blocks vulnerabilities

Check the framework version in the lockfile first. Each item below names the documented default, so a finding can cite it.

## Django and Django REST Framework

- A `ModelForm` with `fields = '__all__'` or with `exclude` accepts every model field not listed, including fields added later and an editable primary key, which lets a user change which object is updated. Django's docs call this much less secure than listing fields.
- DRF `ModelSerializer` with `fields = '__all__'` has the same effect. Only `editable=False` fields and `AutoField` are read-only by default, so ownership and role fields need `read_only_fields`.
- DRF runs `has_object_permission` only when the view calls `get_object()` or `check_object_permissions()`. It does not run for list views, for creates, or when a view fetches with `Model.objects.get` itself. List views need a filtered queryset, and creates need a check in the serializer or `perform_create()`.
- Of the built-in DRF permission classes, only `DjangoObjectPermissions` implements object-level checks. `IsAuthenticated` and the others never compare the caller with the owner.
- Setting `permission_classes` on a view replaces `DEFAULT_PERMISSION_CLASSES` instead of adding to it. With no default configured the policy is `AllowAny`.

## FastAPI

- The `response_model` or the return type annotation filters the response to the declared fields. A route that uses its input model, or the ORM model, as the response type returns every field it holds, password hashes included. Declare a separate output model.

## Flask, Jinja and Go templates

- Jinja's `Environment()` and `Template()` default to `autoescape=False`. Use `select_autoescape()` when building an environment.
- Flask enables escaping only through `render_template` for `.html`, `.htm`, `.xml`, `.xhtml` and `.svg` templates, and through `render_template_string`. A template with another extension, or one rendered through a bare Jinja environment, is not escaped. `Markup()` and the `|safe` filter switch escaping off for that value.
- Go's `text/template` does not escape. `html/template` has the same interface and escapes by context.

## Express

- `app.set('trust proxy', true)` takes `req.ip` from the left-most `X-Forwarded-For` entry, which the client controls unless the last trusted proxy overwrites the header. IP allowlists, rate limits and audit logs can then be spoofed. Trust only the real proxy addresses or a hop count.
- With trust proxy enabled, `req.hostname` comes from `X-Forwarded-Host`, so URLs built from it point wherever the client says.

## Next.js

- A Server Action (Server Function) is reachable by a direct POST request, not only through the UI that renders it. A page or layout check does not extend to the actions defined in it: each action must check authentication and ownership itself.
- Encrypted action IDs and the removal of unused actions at build time reduce exposure but are not access control.

## Rails

- `params.permit!` marks every parameter as permitted with no filtering, so any attribute, `admin` included, reaches mass assignment. The guide recommends `params.expect(user: [:name, ...])`, which also returns 400 when the root key is missing.

## Laravel

- `protected $guarded = [];` makes every attribute mass assignable. `forceFill()` fills attributes while ignoring `$fillable` and `$guarded`. Either one fed from `$request->all()` is mass assignment.

## Symfony

- `#[IsGranted('ROLE_USER')]` checks a role only. Object checks need a subject, as in `#[IsGranted('edit', 'post')]` or `denyAccessUnlessGranted('edit', $post)`, backed by a voter.
- An `EntityType` form field whose `query_builder` is `null` (the default) loads every entity of the class as a choice, so the form lists, and accepts, rows of other users. Scope the `query_builder` to the current user.

## Spring

- `@PreAuthorize`, `@PostAuthorize`, `@PreFilter` and `@PostFilter` do nothing unless method security is on with `@EnableMethodSecurity`.
- Method security works through proxies. A call from one method to another method of the same bean (`this.delete(id)`) skips the proxy, so the annotation on the called method never runs.
- `@ModelAttribute` binds request parameters through the constructor and through setters by default, so any property with a setter can be set from the request. Bind to a web-specific object, use constructor binding only, or set `allowedFields` in an `@InitBinder`.
