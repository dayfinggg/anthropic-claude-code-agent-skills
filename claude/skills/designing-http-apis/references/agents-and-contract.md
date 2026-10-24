# Agent consumers and the contract

## Agent consumers

- Apply these tool-design rules from Anthropic to any API wrapper or MCP surface an agent calls.
- They are not HTTP standards.
- Name parameters unambiguously, such as `user_id` instead of `user`.
- Describe what each parameter value means.
- Return only high-signal fields.
- Offer a concise or detailed response option.
- Write error messages that tell the caller what to do next.

## Contract

- Keep the OpenAPI spec in version control.
- For a new spec, use the newest OpenAPI version the toolchain supports.
- Generate or validate code against the spec.
- Review spec changes as API changes.
