# Design It Twice

When a chosen deepening candidate has several plausible interfaces, or the user wants to explore alternatives, use this parallel sub-agent pattern. Based on "Design It Twice" (Ousterhout): your first idea is unlikely to be the best.

Uses the vocabulary in [SKILL.md](SKILL.md): **module**, **interface**, **seam**, **adapter**, **leverage**.

## Process

### 1. Frame the problem space

Before spawning sub-agents, write down the problem space for the chosen candidate:

- The constraints any new interface would need to satisfy
- The dependencies it would rely on, and which category they fall into (see [DEEPENING.md](DEEPENING.md))
- A rough illustrative code sketch to ground the constraints, not a proposal, just a way to make the constraints concrete

Keep it for the final answer and proceed to Step 2 without stopping.

### 2. Spawn sub-agents

Spawn 3+ sub-agents in parallel with the Agent tool (`subagent_type: "Explore"`, "do not edit files" in the brief, `model` and `effort` taken in turn from the entries of the `architect runners` row of the Models table in the **poteto-mode** skill). Each must produce a **radically different** interface for the deepened module.

Prompt each sub-agent with a separate technical brief (file paths, coupling details, dependency category from [DEEPENING.md](DEEPENING.md), what sits behind the seam). The brief is independent of the user-facing problem-space explanation in Step 1. Give each agent a different design constraint:

- Agent 1: "Minimize the interface: aim for 1–3 entry points max. Maximise leverage per entry point."
- Agent 2: "Maximise flexibility: support many use cases and extension."
- Agent 3: "Optimise for the most common caller: make the default case trivial."
- Agent 4 (if applicable): "Design around ports & adapters for cross-seam dependencies."

Include both [SKILL.md](SKILL.md) vocabulary and GLOSSARY.md vocabulary in the brief so each sub-agent names things consistently with the architecture language and the project's domain language.

Each sub-agent outputs:

1. Interface (types, methods, params, plus invariants, ordering, error modes)
2. Usage example showing how callers use it
3. What the implementation hides behind the seam
4. Dependency strategy and adapters (see [DEEPENING.md](DEEPENING.md))
5. Trade-offs: where leverage is high, where it's thin

### 3. Present and compare

Compare the designs in prose, one short paragraph per design, by **depth** (leverage at the interface), **locality** (where change concentrates), and **seam placement**. A table fits when several designs are compared across these attributes.

Then give your own recommendation: which design is strongest and why. If elements from different designs combine well, propose a hybrid. Be opinionated: the user wants a strong read, not a menu. When this runs inside an autonomous task rather than on the user's request to compare designs, take the recommended design and continue, and put the comparison in the final answer.
