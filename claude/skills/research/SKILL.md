---
name: research
description: "Investigate a question against high-trust primary sources in a background agent and write the cited findings to a Markdown file. Use when a task depends on facts that need real reading beyond a quick lookup: an unfamiliar API or library, version-specific behavior, a specification, or a comparison of options."
---

Spin up a **background agent** with the Agent tool (`subagent_type: "general-purpose"`, `run_in_background: true`) to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it where the repo already keeps such notes and match the existing convention. If the repo has none, save it in the session scratchpad, so research started on the agent's own judgment adds no files to the repo.

When it finishes, check its sources yourself before you relay anything. Answer the user in prose by the session's output style: the main findings first, then the file path.
