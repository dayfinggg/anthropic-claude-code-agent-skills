---
name: delegation
description: Selects providers, models, and effort, assigns bounded work, supervises agents, and verifies results. Use before delegating or parallelizing, when asked to run agents or choose their models, and when coordinating, redirecting, or accepting their work across providers.
---

<when_to_delegate>
A subagent starts without your conversation, re-explores, and reports back, so each one costs time and tokens. Delegate when the payoff clearly exceeds that cost. A fork is the exception, because it inherits your context and model. Use a fork only when the task needs this conversation.
- Delegate large reading or search work whose raw output you will not need again.
- Delegate independent, sizeable tracks that can run in parallel, such as unrelated modules or a wide audit.
- Delegate work the user asked to run on a specific provider, model, or agent.
- Delegate a fresh-context check of a risky change, as the `review` skill describes.

Do the work yourself when a few tool calls finish it, or when phases share context. The same holds when the task needs back-and-forth with the user. Also keep it when you do not yet know what is broken, or when agents would edit the same files.
</when_to_delegate>

<runtime>
Find out what the runtime offers before you choose a model. Never pick from memory or from a list in this skill.
- In T3 Code, the T3 orchestration instructions and tools are in your context. Follow them. Call the capabilities tool once per thread, and choose only from the providers, models, and options it returns.
- Outside T3 Code, use only the native subagent tool, such as `Agent` in Claude Code or `spawn_agent` in Codex. Choose only among the models its schema or the session lists.
- When the user names a provider or model that the runtime does not offer, say so. Do not switch to another one unasked.

Before launching, identify how this runtime delivers progress, accepts corrections, cancels work, and resumes a waiting worker. Keep the IDs it returns. A new top-level thread is not a substitute for a subagent. Follow runtime-specific routing and waiting rules rather than assuming that native agents, delegated sessions, and background jobs share a lifecycle.
</runtime>

<model_and_effort>
Match the model tier and effort to the task, and set the model explicitly. An omitted model falls back to the runtime's default, often the parent's model, which can be the most expensive one. Set effort where the runtime offers it, by each tool's own rules.
- Lookups, search, log reading, and summaries go to the fastest, cheapest tier at its default effort, because a mistake there is cheap to spot. A misread search result still sends the parent after the wrong file, so ask for exact paths and quotes, and keep code edits and judgement calls off this tier.
- Work with a clear spec and a check that proves it goes to the middle tier, and so does a well-defined task you run often, such as a review. Use medium or high effort there.
- Judgement-heavy, long-horizon, or ambiguous work goes to the strongest tier, starting at medium effort and rising to high.
- When a result falls short, first make sure the agent has a check it can run, then raise effort one level, then move up one tier and start there at a lower effort than the smaller model used. Past high effort the next tier up can cost no more than another effort level, and effort does not fix a wrong approach.
- Use the user's named model and settings when the user gives them.

The brief rules below follow current Claude guidance, so a brief to a Claude subagent needs no further reading. Before the first brief of a session to a model of another provider, read that provider's current prompting guidance, such as OpenAI's at https://developers.openai.com for GPT models, and apply it to the brief.
</model_and_effort>

<brief>
The agent sees only the brief, so give the whole task once and precisely. Write it in English unless the task needs another language. Every brief covers these parts.
1. Goal and acceptance. Name the requested outcome and the check that proves it, with the required cases and target revision. A partial check does not close a larger requirement.
2. Context. Give exact paths, the relevant facts you already know, and what you ruled out. Pass long material as file paths, not pasted text. State the agent's own task in your words, because the user's message addresses you and can mislead the agent. Quote the user's wording only where the agent must judge against it, such as a spec, and then once, without a translation.
3. Scope and ownership. Name the allowed files or modules, hosts or datasets when applicable, and whether the task permits reading, editing, running checks, or publishing. State exclusions and preserve the user's counts and deadlines. A count limits all agents launched for that allocation unless the user explicitly means simultaneous agents. Name dependencies and their owners. The worker reports an out-of-scope dependency instead of changing it or starting another worker.
4. Rules. An agent that runs under this plugin already has the working rules, which include the rules for delegated work, a native subagent through its task and a separate session through its system prompt, so the brief does not repeat or reword them. A separate session has the writing rules too, and a native subagent has a short report contract in their place. For a native subagent that will write a document or a message for people, name the writing rules at `../../instructions/style.md`, relative to this skill, as an absolute path. For an agent of another provider, name that file, the working rules at `../../instructions/work.md`, and the report contract at `../../instructions/report.md` the same way. Name the skills that fit the task, and add only the limits that this task sets, such as the hosts and data the agent may change.
5. Evidence. Require the check to run, its actual result, and the files or artifacts needed to inspect it. A worker resolves ordinary setup and command failures before returning. A genuine blocker identifies the missing prerequisite and affected outcome.
6. Checkpoints and stopping conditions. For long or shared work, name when the lead needs an update, such as the first concrete finding, a changed assumption, or a shared-resource operation, and name the channel that carries it while the worker runs, such as the runtime's message tool and the lead's address. A worker's text between tool calls reaches the lead only where the runtime delivers it, and a worker that ends its turn to send an update hands back unfinished work, so ask for checkpoints only where such a channel exists. State which actions require approval and which the worker can continue without waiting. Destructive or external actions need authorization covering that action, and a deliberate denial of access is reported rather than bypassed. The lead cannot grant permission the user withheld. Keep checkpoints proportional to risk, without turning every edit into an approval. Give a cap only when the task or runtime supplies one, and name who accepts the result.
7. Return contract. Request the result, supporting evidence, and integration-relevant side effects in the user's language, unless another report language is explicitly needed. State the length you need, because the worker's own rules otherwise cap the report at a short default. Omit routine non-actions. Say only what this task adds to the existing report rules. Long artifacts belong at the specified path rather than in the report body.

Keep the brief at the level of goals and checks. Overly specific steps or "stop for review" lines make current models end early or over-ask.
</brief>

<parallel_work>
Run parallel agents only on independent tracks, and split them along file boundaries. Send all parallel spawns in one message so they run together. Give each agent that writes code its own checkout, such as a worktree, when the runtime offers one. Keep spawn counts low, and use one agent when one is enough.

The `shared_systems` block binds the whole team. Before choosing how much work to run on one host or service, inspect capacity and existing jobs. Assign one owner for heavy operations and one shared coordination method. Include browser runs, broad scans, builds, and indirect database writes in the same budget. The lead's own jobs count too. Broadcast a newly found shared hazard to affected workers before they reach it. Keep file ownership distinct and transfer ownership explicitly when another worker must take over.

One worker on a short task needs no record beyond the conversation. With two or more workers, or work long enough to outlast one context, keep a team record of each task's ID, owner, scope, dependencies, last checkpoint, outstanding check, and acceptance state. Use the session's task list where it has one and one file in the session scratchpad otherwise. Update it when those facts change, so the state survives compaction. Do not infer completion from an agent becoming idle or its message being labelled completed.
</parallel_work>

<supervision>
The lead remains responsible while workers run. Use the runtime's progress events, checkpoint messages, or permitted incremental activity reads to inspect actual actions and results. A final report alone arrives too late to correct expensive drift. If the runtime offers no intermediate visibility, split long work at useful checkpoints rather than assigning an opaque unbounded task. When the user requests scheduled supervision and the runtime supports it, use that mechanism and read only activity since the last check. Never replace a runtime prohibition on polling with a sleep loop or a different watcher.

At a checkpoint, compare the next action and observed result with the assigned scope and acceptance check. Look for changes outside ownership, a different target, repeated failing commands, foreground waiting, overlapping heavy work, leaked secrets, weakened checks, or a completion claim ahead of evidence. Inspect the relevant command or artifact instead of trusting a progress summary alone.

Correct a deviation promptly with the observed action, the boundary it crosses, and the next allowed action. Ask one focused question when a missing fact changes the method. Stop affected work before a dangerous or conflicting action, then verify that the identified job stopped before replacing it. If an out-of-scope edit already happened, inspect its diff and ownership before assigning a repair. Do not order a blanket revert of shared files that may contain another person's work. Keep independent work moving. A correction is complete only when a later action or result shows the worker followed it. Record recurring failures and change the approach or reassign the remaining bounded work within the user's allocation. Do not keep sending the same reminder to an unchanged failing process.
</supervision>

<waiting>
Keep doing independent work between supervision events and follow the runtime's instructions for completion notices. Do not poll status, sleep, or send repeated progress requests while a notification is pending. Send a correction when evidence calls for one, and cancel a worker you no longer need with the runtime's cancellation tool.

A completion notice says that the agent's turn ended, and the agent's last message says whether the work did. When that message reports a wait or a next step, the task is still open. Wait for the next notice where the runtime wakes the agent by itself, and tell the agent to continue where it does not.

End a scheduled supervisor when its assigned workers and required follow-up work are settled. Keep it active while its supervision is still needed.
</waiting>

<results>
Accept a result only when its artifact and executed check cover the assigned requirement at the current revision. A partial result remains open. Resolve contradictions between a report, command output, and diff before using the report. Do not rerun a still-valid check merely to reproduce the worker's result. Check integration across workers and run the checks the combined changes require. Confirm that owned jobs, shared allocations, and temporary artifacts are settled. Tell the user the established outcome and necessary next action, with material blockers only where they remain. Do not append a roster of routine non-actions or pass an avoidably unchecked report on to the user.
</results>
