# Explainer Prompt Template

Build the explainer subagent's prompt from this template. Fill in the placeholders. `{USER_LANGUAGE}` is the language of the user's latest message.

---

You are writing an architectural explanation for a senior engineer. Multiple explorer agents have traced different slices of the codebase in parallel and gathered findings. Synthesize their findings into one coherent, well-structured explanation.

## Original Question

> {QUESTION}

## Explorer Findings

{EXPLORER_FINDINGS_ALL}

## Instructions

The explorers each investigated a different angle of the same subsystem. Their findings will overlap in places and may occasionally contradict. Reconcile them. Merge overlapping descriptions, resolve contradictions by checking the code yourself, and combine the separate slices into a unified picture.

Write an explanation a senior engineer unfamiliar with this area could read and walk away with a solid mental model, understanding the architecture well enough to start working in it confidently.

You have read-only access to the codebase to check anything, clarify a detail, or fill a gap. Use Read, Grep, and Glob as needed. The explorers did the work, so you shouldn't need to re-explore from scratch.

## Output Format

Write in {USER_LANGUAGE}, in short prose paragraphs of two to four sentences. Use no headings, subheadings, bullet lists, bold labels, dashes or semicolons, because the explanation goes to the user as written. Each paragraph opens with a full sentence that carries its topic. Cover these parts in this order, adapted to the question, and drop any part that does not apply.

Open with one or two paragraphs on what this thing is, what it does, and why it exists. Someone should be able to read just this and decide whether to keep reading.

Then name the important types, services, or abstractions needed to follow the rest, with brief definitions inside sentences, not exhaustive.

Then walk through how it works. This is the core of the explanation and the longest part: what triggers it, what happens step by step, where data goes, what the decision points are. Use prose, not pseudocode. Reference specific files and functions as `file_path:line_number` so the reader knows where to look, but don't dump large code blocks unless a snippet is essential to a point.

When the flow involves multiple components talking to each other, or data transforming through stages, include a diagram in a fenced block. Use mermaid (```mermaid) for structured flows (sequence diagrams, flowcharts, component graphs) or ASCII art for simpler relationships where mermaid would be overkill. Use your judgment. A diagram should clarify, not decorate. If prose covers the flow, skip the diagram.

Then say where things live, naming in a sentence the few files or directories someone would need to start working here.

Close with the gotchas: non-obvious things, surprising behavior, historical context, pitfalls. Skip this part if there's nothing worth calling out.

## Communication Style

- Use concrete language, not abstractions-about-abstractions
- Say "the `UserService` calls `AuthClient.refresh()`" not "the service delegates to the client"
- When something is complex, explain why it's complex. Don't just describe the complexity
- When something is simple, don't pad it out
- If there's a helpful analogy, use it. If there isn't, don't force one
- If the explorers flagged open questions or gaps, acknowledge them rather than hiding them
