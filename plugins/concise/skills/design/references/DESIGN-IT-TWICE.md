This procedure compares alternative interfaces for a module that you deepen or design. It follows "Design It Twice" from Ousterhout, because the first idea is rarely the best. Compare bounded alternatives yourself for a small decision. Use independent agents when the user requests them or the size and independence of the design work justify them under the delegation skill and runtime rules. It uses the vocabulary of [SKILL.md](../SKILL.md).

<process>
<step_1_frame_the_problem_space>
Before comparing designs, establish the problem space for the module. It covers three things.
- The constraints that any new interface must satisfy.
- The dependencies it relies on, and the category of each from [DEEPENING.md](DEEPENING.md).
- A rough code sketch that makes the constraints concrete. It illustrates them and is not a proposal.

Use this context in the comparison and proceed to step 2 without an extra approval when the requested scope is clear.
</step_1_frame_the_problem_space>

<step_2_spawn_sub_agents>
Produce genuinely distinct interfaces. If delegating, choose the number of agents from the independent alternatives and the user's allocation rather than a fixed minimum. Give each a fresh context and a distinct design constraint. Otherwise evaluate the applicable alternatives yourself.

Give each sub-agent its own technical brief, built on the problem space from step 1. The brief holds file paths, coupling details, the dependency category, and what sits behind the seam. Include the vocabulary of this skill, and the vocabulary of `GLOSSARY.md` if the project has one. Each sub-agent then names things in the architecture language and the project's domain language.

Each sub-agent gets a different design constraint.
- Agent 1 gets "Minimize the interface, with 1-3 entry points at most. Maximize leverage per entry point."
- Agent 2 gets "Maximize flexibility, and support many use cases and extension."
- Agent 3 gets "Optimize for the most common caller, and make the default case trivial."
- Agent 4, where it applies, gets "Design around ports and adapters for dependencies that cross the seam."

Each sub-agent returns five items.
1. The interface, with types, methods, and parameters, plus invariants, ordering, and error modes.
2. A usage example that shows how callers use it.
3. What the implementation hides behind the seam.
4. The dependency strategy and adapters, as [DEEPENING.md](DEEPENING.md) describes them.
5. The tradeoffs, which show where leverage is high and where it is thin.
</step_2_spawn_sub_agents>

<step_3_present_and_compare>
Present the designs one at a time, so the user can absorb each one. Then compare them in prose by depth, locality, and seam placement. Depth here means leverage at the interface, and locality means where change concentrates.

After the comparison, recommend the design you think is strongest, and say why. If elements from different designs combine well, propose a hybrid. Give a clear opinion, because the user wants a strong read and not a menu.
</step_3_present_and_compare>
</process>
