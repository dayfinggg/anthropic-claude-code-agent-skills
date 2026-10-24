# RAG, memory, agents, MCP, coding agents, and tests

## Tool and output details

- Once untrusted content is read, trusted code or a policy check outside the model decides which consequential actions are allowed.
- Enforce each tool's credential scope downstream.
- Every object a tool touches gets an authorization check.
- Unknown tools and invalid arguments return an error.
- A changed argument needs a new approval.
- Judge risk by operation, target, and arguments, never by keywords in the prompt.
- Delegated access uses a short-lived token scoped to the task and session.
- Markdown goes through a renderer that filters URL schemes.
- The writing-secure-code skill covers SQL, shell, path, and URL sinks.
- Generated code runs as non-root under time and memory limits.
- System prompts, tool descriptions, and memory carry no rules whose secrecy matters.
- Limits come from configuration and stop the run with an error that names the limit.
- Each model call has an output limit. Rate-limit per user and cap input size.

## Retrieval and memory

- Prefer JSON-encoded strings over free text in tool results. Put no instructions of your own in tool results.
- App-side RAG with no tool call puts chunks in the user turn inside source-named delimiters with closing sequences escaped.
- The system prompt calls delimited content data. This lowers indirect injection without stopping it.
- The session's tenant filters the vector query itself, or each tenant has its own namespace.
- Ingested chunks come from curated sources and carry source, owner, and ingestion time.
- Memory is keyed by user and session, scanned for secrets and injected instructions before writes, size-capped, and expiring.
- Unverified memory entries expire first. The agent's own output does not flow into trusted memory automatically.
- Prompts carry only the fields the task needs.
- A small classifier on input or tool output is an optional extra layer. Treat a classifier error or refusal as a block.

## Agents and MCP

- Agent-to-agent and MCP connections use authenticated, encrypted transport with per-agent credentials.
- A valid signature grants nothing alone, so the receiver checks permission and rejects replays.
- MCP servers validate inputs, enforce access control, rate-limit, and sanitize outputs.
- MCP servers accept only tokens issued for themselves and pass no client token downstream.
- MCP servers bind state handles to the authenticated user.
- Local MCP servers use `stdio`, or HTTP with a token or restricted IPC.
- MCP clients treat descriptions, annotations, results, and URLs from foreign servers as untrusted.
- MCP clients pin servers, prefix tool names by server, show tool inputs, and confirm sensitive calls.
- A repository config that starts a local MCP server needs user consent that shows the exact untruncated command.
- Models, prompts, tool definitions, and MCP servers come from verified sources at pinned versions. Review each update.
- Keep a way to disable one compromised tool, server, or agent everywhere at once.

## Coding agents

- Treat README files, issue text, CLAUDE.md, code comments, fetched pages, and other skills as untrusted input.
- Use permission-bypass flags such as `--dangerously-skip-permissions` only in an isolated container or VM without secrets.
- Block secret reads with `Read` deny rules. `.claudeignore` has no effect in Claude Code.
- Give the agent only the secrets and scopes the task needs.
- Run the agent in a sandbox with an egress allow-list.
- Check that each package an agent suggests exists and is the intended one before installing it.
- Use skills, plugins, and MCP servers only from trusted sources, and read their bundled files first.
- Put rules that must hold every time in hooks or deny rules, not in prompt text.

```json
{ "permissions": { "deny": ["Read(./.env)", "Read(./secrets/**)"] } }
```

## Logging and tests

- Log each tool call with user, session, tool, argument summary, authorization decision, approval ID, and result.
- Redact secrets and personal data from logs.
- Fail closed when risk classification, approval checks, or audit logging fail.
- Track tokens and cost per user and session. Alert on unusual tool sequences or spend.
- Test an injected instruction in a retrieved document.
- Test an argument outside its enum.
- Test a cross-tenant query.
- Test an expired or reused approval.
- Test an exceeded budget.
- Adaptive attackers defeat fixed test sets, so add new attack variants.
- Rerun the tests after any change to prompts, tools, memory, retrieval, policy, or model.
