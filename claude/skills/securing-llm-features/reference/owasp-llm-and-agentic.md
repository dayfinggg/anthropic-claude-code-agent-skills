# OWASP LLM and Agentic risks mapped to code rules

Risk names follow the OWASP GenAI Security Project. The LLM names were checked against the official site. The Agentic names come from secondary write-ups and were not checked against the primary document. Apply every row the feature touches.

## Contents

- OWASP Top 10 for LLM Applications 2025
- OWASP Top 10 for Agentic Applications 2026
- OWASP cheat sheets
- MCP security rules
- Sources

## OWASP Top 10 for LLM Applications 2025

| Risk | Code rules |
|---|---|
| LLM01 Prompt Injection | Treat the model as an untrusted user. Handle privileged functions in code and give the application its own API tokens. Validate output formats with deterministic code. Require human approval for high-risk actions. Separate and label untrusted content. Test with adversarial inputs. |
| LLM02 Sensitive Information Disclosure | Give the model only the data the task needs. Redact or tokenize confidential content before it enters a prompt. Return errors that leak no configuration or data. |
| LLM03 Supply Chain | Take models and datasets only from verifiable sources and check signatures or hashes. Keep models and APIs on maintained versions. Keep an inventory of components and licenses. |
| LLM04 Data and Model Poisoning | Record the provenance of data for fine-tuning, embeddings, and retrieval. Version datasets. Keep user-supplied knowledge in a vector store you can correct without retraining. |
| LLM05 Improper Output Handling | Validate model responses before they reach backend functions. Encode output for its context. Sanitize output before it builds file paths or email templates. Use a strict CSP. Log and monitor outputs. |
| LLM06 Excessive Agency | Minimize the tools, the functions in each tool, and each tool's permissions. Avoid open-ended tools such as shell execution. Run tools in the user's context with least-privilege scopes. Enforce authorization downstream, not in the model. |
| LLM07 System Prompt Leakage | Keep secrets and sensitive data out of system prompts. Do not rely on the prompt for strict behavior control. Enforce privilege separation and authorization outside the model. Inspect output with guardrails outside the model. |
| LLM08 Vector and Embedding Weaknesses | Use permission-aware vector stores. Partition data so tenants and user groups cannot retrieve each other's content. Accept sources only from verified providers and audit the index for tampering. Keep tamper-resistant retrieval logs. |
| LLM09 Misinformation | Ground answers in retrieved, trusted sources. Validate key outputs automatically in high-stakes flows and route them to human review. Label AI-generated content and state its limits. Review generated code before it ships. |
| LLM10 Unbounded Consumption | Limit input size. Rate-limit per user or source. Cap queued and total actions. Set timeouts on expensive operations. Restrict the model's network and internal access. Monitor resource use and react to anomalies. |

## OWASP Top 10 for Agentic Applications 2026

| Risk | Code rules |
|---|---|
| ASI01 Agent Goal Hijack | Treat all natural-language input as untrusted. That covers documents, emails, invites, browsing output, and peer-agent messages. Apply the LLM01 controls. Keep system prompts under version control and change them through review. Pause when the agent proposes actions outside the original task. Log goal state and tool sequences. |
| ASI02 Tool Misuse and Exploitation | Give each tool a least-privilege profile. The profile sets scopes, a maximum rate, and an egress allow-list. Require authentication on each call. Require confirmation for destructive actions, with a dry-run or diff preview. Validate intent and arguments in a policy check before execution. Use fully qualified tool names with version pins. Fail closed on ambiguous resolution. |
| ASI03 Identity and Privilege Abuse | Issue short-lived, task-scoped credentials per agent. Isolate identity and memory per session and wipe state between tasks. Re-check authorization on each privileged step. A delegated agent never inherits its caller's full permissions. |
| ASI04 Agentic Supply Chain Vulnerabilities | Allow-list and pin dependencies, models, prompts, tool definitions, and MCP servers. Use a hash or commit where possible. Verify provenance before activation and scan for typosquats. Sign and verify inter-agent messages. Keep a way to disable a compromised component everywhere at once. |
| ASI05 Unexpected Code Execution | Apply LLM05 handling to generated code. Ban `eval` in production agents. Run code in sandboxed containers as non-root, with network limits and a dedicated working directory. Separate generation from execution with a validation step. Scan generated code statically and log every run. |
| ASI06 Memory and Context Poisoning | Encrypt memory in transit and at rest. Scan writes for malicious or sensitive content. Segment memory by user session and domain. Accept memory only from authenticated, curated sources with source attribution. Do not re-ingest the agent's own output into trusted memory. Expire unverified memory. |
| ASI07 Insecure Inter-Agent Communication | Use encrypted channels with mutual authentication and per-agent credentials. Sign messages and validate payload and context. Use nonces, session IDs, and timestamps against replay. Pin protocol versions and reject downgrades. Use typed message schemas and reject invalid messages. |
| ASI08 Cascading Failures | Assume any model, agent, or source can fail or be compromised. Validate high-impact tool calls against policy. Separate planning from execution. Put checkpoints or human review before outputs propagate. Add quotas, progress caps, and circuit breakers between planner and executor. |
| ASI09 Human-Agent Trust Exploitation | Require explicit confirmation before sensitive data access or risky actions. Show a plain-language risk summary that the model did not write. Show a preview and block state-changing calls until the user confirms. Keep tamper-proof records of queries and actions. |
| ASI10 Rogue Agents | Keep signed, immutable audit logs of actions, tool calls, and inter-agent messages. Run agents in restricted environments with least-privilege scopes. Provide kill switches and credential revocation. Declare each agent's expected tools and block calls outside the declaration. Never expose signing keys to agents. |

## OWASP cheat sheets

Rules the other skill files do not already cover.

- **LLM Prompt Injection Prevention.** Labels between instructions and data do not enforce the boundary. The cheat sheet filters are illustrative layers, not a complete defense. Check output for leaked system prompts and keys before returning it. Detect Base64, hex, and Unicode smuggling.
- **AI Agent Security.** Scope each tool to read or write and to named resources, with no wildcards. Fail closed for unknown tools and missing approval requirements. Check and consume approvals atomically. Require step-up authentication for critical actions. Check the integrity of long-term memory. Limit retries and tool chaining. Log the risk class and policy version for high-risk actions. Give inter-agent messages a unique ID and a bounded validity window.

## MCP security rules

From the MCP specification pages on tools and security best practices. Server items are MUST rules and client items are SHOULD rules.

- Clients validate tool results before passing them to the model, set timeouts, and log tool usage.
- State handles come from a secure random generator and are bound server-side to the user from the verified token.
- Route server-supplied URL fetches through an egress proxy and validate every redirect hop. Do not parse IP ranges by hand, because encodings such as octal, hex, and IPv4-mapped IPv6 defeat custom parsers.
- Clients reject `javascript:` and `file:` in authorization URLs and open no URL through a shell.
- Scopes grow progressively from least privilege, without wildcard or omnibus scopes.

## Sources

- OWASP Top 10 for LLM Applications, https://genai.owasp.org/llm-top-10/
- OWASP Top 10 for Agentic Applications, https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
- LLM Prompt Injection Prevention Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html
- AI Agent Security Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html
- MCP tools, https://modelcontextprotocol.io/specification/latest/server/tools
- MCP security best practices, https://modelcontextprotocol.io/specification/latest/basic/security_best_practices
- Mitigate jailbreaks and prompt injections, https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks
- Claude Code permissions, https://code.claude.com/docs/en/permissions
