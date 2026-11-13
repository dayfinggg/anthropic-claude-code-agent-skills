---
name: planning
description: Turning a software request into an approved design, an implementation plan and tracker tickets with blocking edges. Use when the user asks to plan, design, spec, scope, break down or think through a feature, says "grill me", "interview me", "write a spec", "make tickets" or "create issues for this", hands over a PRD, SPEC.md, design doc, epic or issue to split, asks how to approach or sequence work, when a request is too vague or too large to start, when a wide rename, retype or migration must be split into tickets or sequenced across PRs, or when work will span several sessions or branches.
---

## Read first

Do these steps now, in order, before anything else and whatever the task. The files hold the traps this skill depends on, the pages tell you whether its versions are still current, and a skipped file or page is the usual cause of a wrong result.

1. Fetch https://docs.github.com/api/article/body?pathname=/en/issues/tracking-your-work-with-issues/using-issues/creating-issue-dependencies (Issue dependencies) with `curl -sL` or WebFetch and compare it with the facts below. Where the page shows a newer version than this skill names, follow the page.

## Check first

- Find where this project keeps plans and tickets: a tracker or plan folder named in `CLAUDE.md` or `AGENTS.md`, existing `docs/`, `specs/` or ADR files, and open issues (`gh issue list`).
- For GitHub tickets, run `gh --version`. Native blocking edges and sub-issues need gh 2.94.0 or later: `gh issue create --blocked-by N --blocking N --parent N` and `gh issue edit N --add-blocked-by N --add-sub-issue N`. On GitHub Enterprise Server, sub-issues need 3.17 and blocking relationships 3.19 or later. Without them, write the edges as a "Blocked by" section in each body.
- Facts verified 2026-11.

## Defaults

- When the user asked for a plan or design, stop at the approved document. When they asked for the work itself, the plan is a step of that work: write it and continue, stopping only for decisions that change what gets built.
- Look facts up yourself (an Explore subagent for wide lookups) and ask the user only for decisions. State each call you make yourself, with its reason, so the user can correct it.
- When the goal behind the request is unclear and would change the design, ask about it first, as one open question with no options attached. Options steer the answer away from the user's own intent.
- After that, ask in rounds. A round holds every open decision whose prerequisites are settled. Number each question, give your recommended answer, and word it so "yes" accepts the recommendation. A question that depends on another open one waits for the next round. One the user leaves unanswered takes your recommendation, recorded as an assumption in the plan.
- For a design beyond a few lines, show 2 or 3 real approaches with their trade-offs and your pick, and wait for the choice. Drop options the existing code or the user's goal rules out. When only one approach fits, say why in one line and continue.
- Size the design to the work. A small change gets a few lines. A project gets a written design that also names non-goals, constraints, the rejected approaches, and what is left to the builder.
- Before handing over a project design, brief a fresh subagent as a builder who cannot talk to the author and must plan from the document. It returns only the questions where a wrong guess changes the plan. Write already-answered ones into the doc, settle minor ones yourself and mark them as your calls, and bring the rest to the user in one message.
- A plan holds the decisions the implementer cannot make alone: the files per task, exact signatures, what each task consumes from earlier tasks and produces for later ones, the spec's values copied verbatim, test names with their assertions, and each verification command with the output that means pass.
- Open the plan with the spec's project-wide constraints copied verbatim: version floors, limits, naming and copy rules. Every task inherits them.
- In the design and plan documents, present first the decisions the user is most likely to change: data model, interfaces, user-visible behavior. Mechanical refactoring goes last. This is reading order. Execution order follows the blocking edges.
- A task is the smallest unit with its own test cycle that a reviewer could reject while approving its neighbor. Each task passes its checks before any later task exists, and a task that adds an interface also adds its first caller. Fold setup, config and docs steps into the task that needs them.
- List the inputs the spec implies but no task's tests exercise (empty, huge, duplicate, concurrent, malformed). Add a test for each to the task that owns the code. The spec's silence is not permission for that input to break the program.
- Slice tickets vertically: each one a narrow path through every layer (schema, API, UI, tests), demoable on its own and sized for one fresh context window. Prefactoring tickets come first.
- Give every ticket its blocking edges. The frontier is every open ticket whose blockers are all closed, and that is what runs next.
- A wide refactor (one mechanical change whose blast radius breaks many call sites at once) gets expand-contract instead of slices: an expand ticket that adds the new form beside the old, migrate tickets in batches per package or directory each blocked by the expand, and a contract ticket blocked by every batch. If a batch cannot stay green alone, run the batches on one integration branch that ends in an integrate-and-verify ticket. For schema changes, see concise:database.
- A ticket that may wait days describes behavior, interfaces, acceptance criteria and what is out of scope. File paths and line numbers go stale, so leave them out. A prototype snippet that pins a decision (a type, a reducer, a state machine) may stay.
- Work too large for one session gets a map: one issue or file that is only an index. Sections: Destination (what done looks like), Decisions so far (one line and a link per resolved ticket), Not yet specified, Out of scope. Each decision lives in exactly one ticket.
- Make a ticket for a question once you can state it precisely, even while it is blocked. Leave it under Not yet specified until then. By default resolve one decision ticket per session, so each starts with a fresh context, and claim it (assign it) before starting, since other sessions may run in parallel.
- When implementation waits for a later session, start it fresh from the spec, the plan and `git log`, not from the planning conversation. Mark each task done in the plan as it lands, with any discovery the next session needs, and check the plan's claims against the tree before continuing. To run the tasks through subagents, use concise:orchestration.

## Gotchas

- A plan longer than the code it describes has written the code. Replace bodies with signatures, test names and assertions. A line that decides nothing ("TBD", "handle edge cases", "add validation", a type no task defines) is a gap, not a step.
- Names drift between tasks, such as `clearLayers()` in task 3 and `clearFullLayers()` in task 7. Check every consumed name and type against the task that produces it, and every spec requirement against a task that implements it.
- "Sounds good" to an idea is not approval of a design you have not shown. Approval covers only what the user saw.
- A spike is throwaway. Keeping its code is a new request that goes back through design.
- A request that turns out to be several independent projects gets split. Agree on an order and plan one project at a time.
- In GitHub text, `#3` links to issue 3 of the repository. Create every ticket first, blockers first, then wire the edges and cross-references in a second pass with the real numbers. Call draft tickets T1, T2 until then.
- The session scratchpad belongs to one session, and the next session gets another. Keep plans that span sessions in the tracker or in a repository path the user agreed to.
- Decisions and boundaries stated only in conversation can vanish at compaction, including a "don't push" that auto mode enforces from the transcript. Write each decision into the spec as it lands, and use a deny rule for a hard limit.
- When the user says "just do it" or "skip the questions", stop asking. State any significant choice of platform, language or library in one line and proceed.
