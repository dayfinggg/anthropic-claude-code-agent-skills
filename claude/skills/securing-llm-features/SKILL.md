---
name: securing-llm-features
description: Secures LLM features and coding agents against prompt injection, excessive agency, unsafe output, and secret leaks. Use when code calls an LLM API or builds tools, agents, MCP servers, RAG, or memory.
---

# Securing LLM features

Anything in the model's context can steer it. That includes retrieved pages, tool results, repository files, and other agents' messages. Enforce every rule that must hold in code outside the model.

## Design check

Mark which of these the feature has.

- It reads untrusted input.
- It reaches sensitive data or private systems.
- It changes state or sends data out.

Having all three needs a redesign or a human approval at the step that combines them.

## Tools

- Expose narrow tools such as `get_service_status(service)`, not a shell, raw SQL, or arbitrary fetch.
- Each tool's credentials allow only its operation. The model never sees keys or tokens.
- User, tenant, and session come from the authenticated request, never from model arguments.
- Each tool has a JSON Schema with enums, length limits, and `additionalProperties: false`. The handler validates again.
- Destructive, irreversible, financial, outbound, and permission-changing actions wait for human approval.
- The approval binds the exact arguments, expires, and is consumed once.
- A tool without a risk rating needs approval.

## Output

- Model output is untrusted input to its sink. Render Markdown without raw HTML, under a CSP.
- Structured output passes a schema validator and never reaches `eval`, `exec`, or a template source.
- Generated code runs only in an isolated container or VM without credentials or open network.
- Third-party content reaches the model in `tool_result` blocks, never in the system prompt.
- System prompts and documents carry no credentials or internal URLs.

## Limits

Each agent run has step, token, cost, deadline, and delegation depth limits. Each tool call has a timeout.

## Reference files

- [reference/owasp-llm-and-agentic.md](reference/owasp-llm-and-agentic.md) when reviewing a feature against OWASP risks.
- [reference/rag-memory-agents-mcp.md](reference/rag-memory-agents-mcp.md) for RAG, memory, MCP, multi-agent, coding agents, logging, or tests.
- [examples.md](examples.md) for safe Markdown, approval-gated delete, tenant-scoped retrieval, and agent budgets.
