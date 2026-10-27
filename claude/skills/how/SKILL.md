---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions (\"where should this live\", \"which package owns this\", \"is this the right layer\"). Explains subsystem architecture, runtime flow, onboarding mental models. Use why for motivation."
---

# How

Explore the codebase to answer "how does X work?" questions. Produce architectural explanations at the level of a senior engineer onboarding onto a subsystem, enough to build a working mental model, not so much that it reads like annotated source code.

Every spawn is an Agent subagent with `subagent_type: "Explore"` and "do not edit files" in its brief. Explorers use the `how explorer` row of the Models table in the **poteto-mode** skill, and every explainer uses the `how explainer` row. Set `model` and `effort` from that row, and leave `model` unset when the value is `inherit`. If the Agent tool rejects a value, use the nearest value it accepts and say so. Pick each subagent's effort for the job, per the Subagents section of the **poteto-mode** skill.

## 1. Assess complexity

If the scope is ambiguous, state your interpretation and explore. The user can redirect.

- **Simple** (a single module, a small utility, a narrow question such as "how does function X work"): no explorers. Spawn one explainer that explores and explains in one pass, built from `references/explainer-prompt.md` without the explorer-findings section. Go to step 4.
- **Complex** (a subsystem spanning multiple files or services, a cross-cutting feature, a full architectural overview): go to step 2.

When in doubt, take the simple path.

## 2. Explore (complex only)

Decompose the question into 2 to 4 angles, each a distinct slice of the subsystem. Spawn all explorers in a single message, each with `references/explorer-prompt.md` and its angle filled in.

## 3. Synthesize (complex only)

Once all explorers have returned, spawn one explainer with `references/explainer-prompt.md` and every explorer's findings filled in.

## 4. Present

Present the explainer's output as your answer. Light edits for clarity, for context from the conversation, or to fit the session's output style are fine. Do not substantially rewrite it.

## Output format

The explanation follows the session's output style: short prose paragraphs in the user's language, no headings, bullet lists or bold labels. It covers the content defined in `references/explainer-prompt.md` in that order, dropping any part that does not apply: what the thing is and why it exists, the key concepts, how it works, where things live, and the gotchas.
