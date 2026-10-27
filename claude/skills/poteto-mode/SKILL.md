---
name: poteto-mode
description: "Default procedure for any non-trivial software engineering task that changes or ships code in a project: fixing a bug, building or changing a feature, refactoring, performance work, prototyping, driving a pull request to merge, or a long autonomous run toward a checkable goal. Picks a playbook, runs it to verified completion without stopping for reversible decisions, and delegates to subagents. Skip it for a one-line edit, a question about how or why code works (the how and why skills cover those), or work outside a code project."
---

# Poteto mode

Bundled skills live at `../<name>/SKILL.md` from this file, in `~/.claude/skills/`. When a step names a bundled skill, invoke it with the Skill tool, or Read its SKILL.md and follow it where the Skill tool is unavailable, as in some subagents. Put this file's absolute path in every `poteto-agent` prompt.

## House rules

This copy of pstack is adapted to this user's Claude Code setup. The session's system prompt and output style come from the user's own mod and outrank every line of pstack. When a step conflicts with them, keep the step's intent and follow the session rule. These are the conflicts that come up.

- **Reply.** Write the final answer by the session's output style: the result first, short prose paragraphs in the user's language, no headings, lists, bold labels, dashes or semicolons, and a table only to compare items across attributes. A playbook's **Reply** line lists what the answer must contain, not its layout. Do not narrate the process or list the principles you applied. Name a principle only when it explains a choice the user would otherwise question.
- **Questions.** Before starting, ask once with AskUserQuestion only about a point that changes the result and that only the user can settle, as the session rules describe. After that, never stop for a reversible decision. Settle an observable fact by experiment (the Prototype playbook), apply a sensible default to a preference call, and report each default with what the user could ask for instead.
- **Scope.** Deliver the scope the user asked for. A related bug, a broken skill, a flaky check or drift found along the way gets one sentence in the answer, or a proposed separate session when the app offers one, unless it blocks the task. Principles that remove or reshape code apply inside the code the task touches.
- **Comments.** Code carries no comments, docstrings or TODO notes. Only a directive a tool needs, such as a shebang, `# noqa`, `type: ignore` or `eslint-disable`, stays, and only when required. Existing comments in an edited file stay unless the change makes them false.
- **Task list.** Track the playbook in the session's task list (`mcp__ccd_turn__update_plan` in the Claude desktop app, the built-in task tools elsewhere), one short step per playbook step, written in the user's language.
- **Commits, pushes and PRs.** Make them only when the user's request asks for them (commit, open a PR, ship, land, merge, autopilot). Otherwise finish with verified changes in the working tree, and in the desktop app let the wrap-up offer the commit or PR. Never add attribution lines. A force-push to a shared branch, a deploy, data deletion and a message sent to people always wait for the user's explicit yes.
- **Waiting.** Wait for background agents and commands through their completion notification, not through `/loop`, sleep loops or schedules. Use `/loop` or a scheduled wakeup only when a playbook's long run needs a periodic audit or the user asks for recurring work. In the Claude desktop app the app watches a PR's CI and review comments through its `ccd_pr` tools and Auto-fix, so never poll them with loops, schedules or a `gh` watch there. Use Monitor only for an event you must act on.
- **Shell and files.** Use the primary shell the environment names, and the Read, Edit, Write, Glob and Grep tools for local files. Run a POSIX script through Bash only when no equivalent exists in the primary shell. Write scratch artifacts, logs and decision trails to the session's scratchpad unless the user or the playbook needs them in the repo, and remove temporary files when done.

Claude Code names. Spawn subagents with the Agent tool: `subagent_type: "poteto-agent"` for playbook delegates, `"general-purpose"` for other writers, `"Explore"` for read-only work (its brief says "do not edit files"), `isolation: "worktree"` for a worker that needs its own checkout of a named branch or commit, and `run_in_background: true` for parallel work. Set `model` and `effort` from the Models table. Cursor Automations, Cursor cloud agents, custom modes and Cursor's PR tool do not exist here. Skip a step that needs one and say so in one sentence. Review-bot comments on a GitHub PR, Bugbot included, are ordinary review threads. Where pstack names Cursor-only skills, use these instead: the built-in `simplify` skill for `deslop`, the built-in browser tools or the `run` skill for `control-ui`, the shell for `control-cli`, and the Authoring a skill playbook for `create-skill`. Session transcripts live in `~/.claude/projects/<slug>/<session>.jsonl`, where the slug is the workspace path with every `\`, `/`, `:` and `.` changed to `-`.

## Models

Every skill in this pack reads its subagent model here. A panel row lists one entry per subagent, so its length sets the fan-out.

| Role | Model and effort |
|---|---|
| feature, refactoring | opus high |
| bug-fix | opus high |
| perf-issue | opus high |
| hillclimb | opus high |
| judgment and prose | opus xhigh |
| hardest tasks | opus xhigh |
| how explorer | sonnet high |
| how explainer | opus xhigh |
| why investigators | sonnet high |
| why synthesizer | opus xhigh |
| arena runners | opus xhigh, sonnet xhigh |
| arena cross-judge pool | opus xhigh, sonnet xhigh |
| swarm workers | sonnet high |
| architect runners | opus xhigh, sonnet xhigh |
| interrogate reviewers | opus xhigh, sonnet xhigh |

Use only the opus, sonnet and haiku models. Sonnet carries the wide parallel reading and verification and is the second, different voice in every panel. `inherit` as a model means omitting `model` so the subagent runs on the session's model. If the Agent tool rejects a value, use the nearest value it accepts and say so.

## Non-negotiables

The Principles section below grounds every trigger. Read the leaf SKILL.md of each principle you apply.

Remaining triggers:

- Nontrivial change, architecture decision, or "are we sure?" → the **how** skill.
- About to ask the user on a "which approach", "how should I", or "what should this do" fork → classify it before you ask. If the answer is a fact you could observe by running something (behavior, timing, layout, output, perf, even whether an eval separates), it is not the human's to answer. Sketch it via the Prototype playbook (`playbooks/prototype.md`) and let the result decide. If the task is a read-only Investigation whose deliverable is a cited answer, stay in it and answer from the evidence rather than building a sketch. Reserve the question for a genuine product or preference call no experiment can settle, and ask it before the work starts, per House rules. Under a full-autonomy grant, decide a call the grant covers, act on it, and report it. For a call only the operator can make, apply a default, report it with a full explanation, and say in plain words what the operator could tell you to do instead. Gates the operator named and the Always-pause list in Autonomy still need the operator.
- Any code → name the data shape first, and choose its organizing structure per **principle-model-the-domain**.
- Code crossing a function boundary → the **architect** skill, parallel design exploration before implementing. The **codebase-design** skill is its vocabulary for module depth, seams and interfaces.
- A hard bug or performance regression, one with no confirmed cause after a first look → the **diagnosing-bugs** skill's loop inside the Bug fix or Perf issue playbook.
- Parallel fan-out → the **swarm** skill for coverage matrices, races, gauntlets, and exploration partitions. Use **arena** for design or code bakeoffs with base selection and grafting.
- Contested design → the **interrogate** skill (multi-model adversarial) before shipping.
- Nontrivial multi-step → write the throughput checkpoint (Feature step 3).
- Any prose surface → the **unslop** skill. Agent-facing prose also follows the Authoring a skill playbook.
- Docs, RFCs, readmes, PR descriptions, or commit messages → the **technical-writing** skill.
- Before commit → the built-in `simplify` skill over the diff.
- Before review or before declaring code work done → check that the diff adds no comments, docstrings or TODO notes, per the Comments house rule.
- Shipping UI, desktop or CLI behavior → drive it the way a user does: the project's own verification skill when it has one (see **create-verification-skill**), the built-in browser tools for web UIs, the shell for CLIs and TUIs. For bug fixes, reproduce first on the same surface yourself. Hand to the user only under the narrow Bug fix step 1 exception.
- Running a benchmark, measuring perf yourself, or reporting a speedup or regression you measured → the **benchmark-checklist** skill before you report or act on the number.
- Any PR-status request ("babysit this", "get it green", "address the review comments", and most often "check on PR X" or "anything outstanding on X") → the **Babysit** playbook (`playbooks/babysit.md`). Never triggered by merely opening a PR. Declare its mode before acting. The playbook's step 1 owns the request-to-mode mapping.
- Asked to land or ship a green stack → the **Shipping** playbook (`playbooks/shipping.md`). Green is not safe. Nothing gets merged before an independent per-PR verdict, and only the contiguous verified run from the root lands.
- A review bot (Bugbot, Copilot, CodeRabbit, a security review) commented → skeptical posture. They catch real bugs and also file non-issues and nitpicks, so assess each on its merits and dismiss noise with a concrete reason instead of churning code. Triage fix / dismiss / ask per `references/bugbot-triage.md`.
- Broken skill mid-task → work around it in the open and say so in one sentence in the answer. Never silently.
- Long, autonomous, or multi-phase work, or any task the user steps away from to review later ("going to bed", "trust it when i'm back", "run until X") → a decision trail via the **show-me-your-work** skill.

## Principles

The session's own rules already require the smallest change that solves the task, code a reader understands at once, validation at trust boundaries, verification on the real artifact, complete deletion instead of compatibility shims, and no stopping for reversible decisions. This index lists only the principles they leave out. Read the leaf skill in full for any principle you apply. Each leaf is the **principle-<title>** skill, with the title in kebab case, unless the entry gives its name.

**Design**

- **Model the Domain.** Writing stateful logic, or code that branches a lot or repeats a shape assumption across files. Encode the domain in a structure (state machine, typed model, table or registry, reducer, the right collection) instead of scattered conditionals.
- **Type System Discipline.** Designing types or a signature in any typed language. Make illegal states unrepresentable, brand primitives, parse external data at boundaries.
- **Make Operations Idempotent.** Designing commands, lifecycle steps, or loops that run amid crashes and retries. Converge to the same end state.
- **Separate Before Serializing Shared State.** Concurrent actors might write the same file, branch, key, or object. Eliminate the sharing first.

**Verification**

- **Fix Root Causes.** Debugging. Trace each symptom back to the first place the system went wrong and fix it there. A guard is a fix only when the state it handles is legitimate.
- **Attack the Premise.** Two or more fixes that share one premise have failed the same gate. Write the premise down and test it directly before you write another fix that assumes it.
- **Sequence Work into Verifiable Units** (**principle-sequence-verifiable-units**). Multi-step work (sweeps, migrations, runs of similar edits) and how you stack commits and PRs. Break work into small units that each end in a check, verify each before the next, and order delivery so the sequence proves itself.
- **Test Behavior, Not Implementation.** Writing, changing, or keeping a test. Assert what the code's users can observe, so the test fails when that behavior breaks and keeps passing when only the internals change.

## Autonomy

**Just do it.** Reversible local work proceeds without asking: editing code, running tests and builds, spawning subagents, creating branches and worktrees. Anything that leaves the machine or speaks for the user (team chat, ticket updates, PR comments, emails) needs the user's request or explicit yes.

**Always pause** for irreversible writes: force-push to shared branches, deploys, data deletion, customer messages.

**Session overrides:** "Don't stop" / "going to bed" / "run until done" / "be fully autonomous" → keep going.

**No is an acceptable answer.** Asked whether to do something, invited to add scope, or shown an approach, reply with your real judgment. Decline, push back, or say "this doesn't earn its place" when true. A recommendation is a judgment, not a validation. Agreement is not the default, candor over sycophancy.

## Subagents

**Use `subagent_type: "poteto-agent"` for any subagent you spawn inside a playbook step** (code-writing delegates, ad-hoc helpers). The chat that runs this skill runs the playbook. Never spawn a `poteto-agent` to run the playbook itself. Routed workflow skills (`how`, `why`, `interrogate`, `swarm`) set their own `subagent_type`. Respect what the skill prescribes, don't override to `poteto-agent`.

**Defaults for every Agent call.** `run_in_background: true` when you do not need the result before your next step, file pointers instead of inlined context, and `model` and `effort` from the role's row in the Models table. Each code playbook reads its own row (`feature, refactoring`, `bug-fix`, `perf-issue`, or `hillclimb`). The hardest changes (cross-cutting design, gnarly concurrency, subtle algorithms) read `hardest tasks`. Prose and judgment read `judgment and prose`.

**Match the effort to the job.** Start from the role's row. Raise the effort one step, up to `max`, for the hardest or subtlest work. Lower it one step for routine judgment and two steps for mechanical edits. Verification stays on the `swarm workers` row. Change only the effort and keep the model the row names, so a diverse panel stays diverse.

You own every subagent's work. Review the diff and write your own summary, don't pass through what it said. A second opinion is the same prompt against a different model. Agreement is high-signal.

**Fresh subagents by default.** Give new work to a fresh subagent with consolidated scope, meaning the original brief, every later directive, and the prior agent's report and branch. This holds for a fix round, a follow-up, a retry, and the next queue item. Continue an existing subagent with SendMessage only when the new work strictly needs state that lives in that agent and is costly to move: its worktree, its uncommitted changes, or a process it still runs, such as a dev server or a simulator. A stop or hold order to a running agent is not reuse. A role such as a PR owner outlives its agent. Once that agent returns, a fresh agent takes the role's next round.

## Writing the answer

The House rules set the layout. These rules set the content.

- **Frame impact for the consumer and the maintainer.** Say who the work is for and what changes for them before any implementation detail, then what the next engineer who owns this code inherits.
- **Terse is not an excuse to drop content.** Every item the playbook's Reply line names stays: details, tradeoffs, choices, open decisions.
- **Never fabricate a link, citation, or transcript reference.** Link only artifacts you produced or read this session. Link a PR as a markdown link with its full URL.
- **Every claim carries its evidence or its label in the same sentence.** Measured, inferred, or guess. A prediction or an unseen cause is a guess. Never hand the human a check you could run.

## Code and scripts

Code follows the Comments house rule. A verify or test script documents its steps in assertion and log strings, as in `assert(ok, 'persisted across restart')`, never in comments. This applies to every file you produce, including a delegate's diff.

## Playbooks

Match the task to a playbook below, Read its full steps at `playbooks/<title>.md` (title in kebab case, hyphens kept and other punctuation dropped, unless the entry gives its file), and open the task list with one short step per playbook step before any task-specific steps. Follow each step as the file writes it. Leave out a step you choose not to do, and mention it in the answer only when the user would care.

A large or cross-cutting effort (a migration across many call sites, an ambitious multi-part change), or work the user steps away from to trust later, routes to the **figure-it-out** skill even when a narrower playbook like Feature fits. Use **figure-it-out** whenever no bundled playbook fits. It designs a bespoke, rigorous playbook for the task. A standing project-scale program (multi-day, many stacked PRs, a fleet of subagents under one coordinator) routes to **Orchestrate** instead. figure-it-out designs one bespoke run, orchestrate runs the program.

- **Investigation.** Read-only question: how does X work, why was Y built this way, are we sure about Z, should we do X or Y.
- **Bug fix.** A reported defect to reproduce, root-cause, and fix with runtime evidence.
- **Perf issue.** A measured slowness to trace and improve against a baseline.
- **Hillclimb.** Sustained, scientific improvement of one metric against a target: loop hypotheses with before/after measurement, a decision log, and one commit per accepted win. Distinct from Perf issue, which is a one-off fix.
- **Runtime forensics.** Diagnose a runtime symptom (leak, idle-CPU spin, glitch) from live instrumentation. The deliverable is a diagnosis, not a fix.
- **Trace forensics.** Diagnose a captured profiling artifact (cpuprofile, trace, spindump, heap snapshot) handed to you after the fact. The deliverable is a diagnosis, not a fix.
- **Feature.** New or changed behavior, built from a named data shape.
- **Refactoring.** A behavior-preserving change to structure or shape (rename, extract, inline, dedupe, move).
- **Prototype.** A throwaway sketch to make a design or behavioral decision cheaply, or to settle an empirical fork by observing it instead of asking the human ("prototype", "mock it up", "try this layout", "sketch it to decide").
- **Visual parity.** Pixel-exact UI equivalence: matching two implementations or migrating a styling system.
- **Authoring or modifying a skill.** Writing or editing a SKILL.md. File: `playbooks/authoring-a-skill.md`.
- **Eval.** Testing how a skill, structure, or prompt change affects agent behavior before promoting it.
- **Babysit.** Driving a PR or a stack to merge-ready: conflicts, review threads, CI.
- **Shipping.** The half after Babysit. Independently verifying a green stack, then landing the contiguous verified run bottom-up through `gh`.
- **Autonomous run.** A long task to drive to completion without stopping ("run until done", "keep going until X").
- **Orchestrate.** A standing project handed to one coordinator chat: multi-day, many stacked PRs, dozens to hundreds of subagents, minimal human turns ("run this whole project", "own this migration until it lands"). Distinct from Autonomous run, which drives one task to a predicate. Work one agent could finish inside the session's budget routes there, not here, however program-shaped the phrasing sounds.
- **Autopilot-full.** A queue of independent PRs run to merged with full autonomy. One owner per PR carries build through merge, and the root swarm-verifies each PR before its owner merges ("autopilot this queue", "full autopilot", one-owner-per-PR programs).
- **Autopilot-stack.** A queue of changes built and verified with full autonomy, delivered as one linear reviewed base-branch stack the operator lands ("autopilot-stack", "stack them, don't ship", "build the stack, I'll land it").
- **Session pickup.** Resuming or taking over a prior agent's in-flight work from a transcript, another session, or a pushed branch.
- **Pause safely.** Suspending in-flight work cleanly so it can be resumed, on an explicit pause, going offline, an app restart, or imminent context compaction. The complement to Session pickup.
- **Multi-phase or multi-PR plan.** Work that spans phases or stacked PRs. File: `playbooks/multi-phase-plan.md`.
- **Worktree and simulator cleanup.** Reclaiming local disk by pruning merged or abandoned git worktrees and stale iOS simulators ("what's using my disk", "clean up worktrees", "prune safe-to-prune worktrees", "free up space", "delete old simulators"). File: `playbooks/worktree-cleanup.md`.
- **Opening a PR.** The last step of any playbook whose task asked for a commit, a PR, shipping or landing.
