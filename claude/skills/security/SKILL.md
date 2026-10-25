---
name: security
description: Secures code where untrusted input, identities, tenant data, secrets, dependencies, or LLM tools cross a trust boundary. Use for changes on such paths and for requested security reviews. Not for prose or formatting work.
---

# Security

These rules decide how code that crosses a trust boundary is traced, protected, and verified. The references hold the detailed checks for each kind of boundary.

Trace the operation from the actor's input to its final effects before choosing a control, and name the asset, the attacker-controlled values, each place where authority or interpretation changes, and one testable invariant. Include workers, caches, and downloads in the trace, reuse the controls the project already has, and read the installed version's documentation for every security API you rely on, because a control placed on a path the attacker does not use, or written from memory of another version, protects nothing.

<example>
A guest note on a Django hotel-booking site reaches `views.reserve`, a PostgreSQL insert, a staff review queue, and the front-desk page, so the trace names `guest_note` as attacker-controlled and states the invariant "a guest's text never runs as markup in a staff member's browser".
</example>

Keep validation, authorization, and sink protection as three separate controls, and deny the operation when a security check is missing or fails instead of falling back to a privileged path, because each control answers a different question and a pass on one says nothing about the others.

<example>
A parameterized `SELECT * FROM invoices WHERE id = $1` in a Go handler is safe to run, yet the handler still checks that the signed-in accountant may view that invoice, and when the role lookup returns an error, the handler responds 403 and does not continue as an admin.
</example>

For a requested fix, repair the boundary where the defect lives and every confirmed instance of the same cause, and keep to that scope, because a sweep into unrelated infrastructure turns a small change into one nobody can review. Run a complete audit only when the user asks for one with bounded targets, because a sensitive filename such as `config.yaml` is not a request to review everything.

<example>
Fixing an unescaped `<%= raw product.name %>` in `show.html.erb` also fixes the same raw output in `compare.html.erb` once it is confirmed there, while the rest of the template layer stays as it is.
</example>

Where tests exist, reproduce a known defect before fixing it, pair every negative check with a legitimate use of the same feature, and observe stored data, state, and outbound effects and not only the response wording, because a denied response can still hide a write that happened and a defense that blocks legitimate use is also a failure. Run the relevant existing checks and stop when the requested result passes.

<example>
For `PUT /warehouses/{id}/stock` the test first shows manager A changing manager B's stock counts with a 200, then after the fix asserts a 403 and an unchanged `stock.quantity`, and a second test shows A still updating their own warehouse.
</example>

## References

Choose the references that apply before the first edit and read each one, because each holds the checks for its boundary and one change often touches several. Leave the others unread so unrelated guidance stays out of context, and revisit the choice when the work reaches a new boundary.

- For threat modeling, audit scope, diff review, variants, misuse-resistant APIs, or native code, read [assurance](references/assurance.md).
- For authentication, sessions, tokens, objects, tenants, or jobs, read [identity and data](references/identity-and-data.md).
- For CSRF, CORS, HTML, or browser origins, read [browser and backend](references/browser-and-backend.md).
- For SQL, processes, paths, SSRF, uploads, or parsers, read [sinks](references/sinks.md).
- For secrets, cryptography, logging, caching, or private outputs, read [secrets and privacy](references/secrets-and-privacy.md).
- For packages, CI, build credentials, or artifacts, read [supply chain](references/supply-chain.md).
- For prompts, retrieval, memory, tools, or MCP, read [LLM and agents](references/llm-and-agents.md).

<example>
A password reset endpoint that emails a link and logs failures calls for identity and data, and secrets and privacy, but not supply chain.
</example>
