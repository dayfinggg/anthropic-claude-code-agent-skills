---
name: planning
description: Load when asked to plan, design, spec, scope or break down a feature, to interview the user before building, to split a PRD, spec or epic into GitHub issues with blocking edges, to sequence a wide refactor or migration across PRs, or when work will span several sessions. ADRs and spec formats belong to architecture.
---

# Planning

This skill covers the path from a request to an approved design, a plan an implementer can follow without asking, and tickets with blocking edges. It matches gh 2.104 and GitHub issue dependencies and sub-issues on github.com. Run `gh --version` before creating tickets. Where the installed gh is newer, `gh issue create --help` is right about flags.

## Check first

- Find where the project keeps plans and tickets: a tracker or plan folder named in `CLAUDE.md` or `AGENTS.md`, existing `docs/`, `specs/` or ADR files, and open issues (`gh issue list`).
- Blocking edges and sub-issues from the command line need gh 2.94.0 or later. On GitHub Enterprise Server, sub-issues need 3.17 and blocking relationships 3.19. Without them, write the edges as a "Blocked by" section in each ticket body.

## Approval and questions

- When the user asked for a plan or design, stop at the approved document. When they asked for the work itself, the plan is a step of that work: write it and continue, stopping only for decisions that change what gets built.
- When the goal behind the request is unclear and would change the design, ask about it first, as one open question in the reply text with no options, in place of the AskUserQuestion format. Options steer the answer away from the user's own intent.
- After that, ask in rounds through AskUserQuestion. A round holds every open decision whose prerequisites are settled, each with your recommended option first. A question that depends on another open one waits for the next round. An unanswered question takes your recommendation, recorded as an assumption in the plan.
- For a design beyond a few lines, show 2 or 3 real approaches with their trade-offs and your pick, and wait for the choice. Drop options the existing code or the user's goal rules out. When only one approach fits, say why in one line and continue.
- When the user says "just do it" or "skip the questions", stop asking. State any significant choice of platform, language or library in one line and proceed.

## Design documents

- Size the design to the work. A small change gets a few lines. A project gets a written design that also names non-goals, constraints, the rejected approaches and what is left to the builder.
- Put first the decisions the user is most likely to change: data model, interfaces, user-visible behavior. Mechanical refactoring goes last. This is reading order. Execution order follows the blocking edges.
- Before handing over the design of a project that will take several sessions, brief a fresh subagent as a builder who cannot talk to the author and must plan from the document alone. It returns only the questions where a wrong guess changes the plan. Write already-answered ones into the document, settle minor ones yourself and mark them as your calls, and bring the rest to the user in one round of questions.

## Plans

- A plan holds the decisions the implementer cannot make alone: the files per task, exact signatures, what each task consumes from earlier tasks and produces for later ones, the spec's values copied verbatim, test names with their assertions, and each verification command with the output that means pass.
- Open the plan with the spec's project-wide constraints copied verbatim: version floors, limits, naming and copy rules. Every task inherits them.
- A task is the smallest unit with its own test cycle that a reviewer could reject while approving its neighbor. Each task passes its checks before any later task starts, and a task that adds an interface also adds its first caller. Fold setup, config and docs steps into the task that needs them.
- List the inputs the spec implies but no task's tests exercise (empty, huge, duplicate, concurrent, malformed) and add a test for each to the task that owns the code. The spec's silence is not permission for that input to break the program.
- When implementation waits for a later session, that session starts from the spec, the plan and `git log`, not from the planning conversation. Mark each task done in the plan as it lands, with any discovery the next session needs, and check the plan's claims against the tree before continuing.

## Tickets

- Slice tickets vertically: each one a narrow path through every layer (schema, API, UI, tests), demoable on its own and sized for one fresh context window. Prefactoring tickets come first.
- Give every ticket its blocking edges. The frontier is every open ticket whose blockers are all closed, and that is what runs next.
- A wide refactor whose blast radius breaks many call sites at once gets expand-contract instead of slices: an expand ticket that adds the new form beside the old, migrate tickets in batches per package or directory, each blocked by the expand, and a contract ticket blocked by every batch. If a batch cannot stay green alone, run the batches on one integration branch that ends in an integrate-and-verify ticket.
- A ticket that may wait days describes behavior, interfaces, acceptance criteria and what is out of scope. File paths and line numbers go stale, so leave them out. A prototype snippet that pins a decision (a type, a reducer, a state machine) may stay.
- Work too large for one session gets a map: one issue or file that is only an index, with the sections Destination, Decisions so far (one line and a link per resolved ticket), Not yet specified, and Out of scope. Each decision lives in exactly one ticket.
- Make a ticket for a question once you can state it precisely, even while it is blocked. Resolve one decision ticket per session so each starts with a fresh context, and assign it to yourself before starting, since other sessions may run in parallel.

## GitHub commands

- Create blockers first, so their numbers exist: `gh issue create --title '<title>' --body-file <file> --blocked-by 12,13 --parent 10`. `--blocked-by` and `--blocking` take comma-separated numbers or URLs, `--parent` one.
- Wire edges on existing issues with `gh issue edit <n> --add-blocked-by <n>`, `--add-blocking`, `--add-sub-issue` or `--parent`, and the matching `--remove-*` flags.
- List the frontier: `gh issue list --state open --limit 500 --json number,title,blockedBy --jq '.[] | select([.blockedBy.nodes[] | select(.state == "OPEN")] | length == 0) | "\(.number) \(.title)"'`. gh fetches at most 50 blockers per issue, so compare `.blockedBy.totalCount` when an issue has more.
- A parent holds up to 100 sub-issues, nested up to eight levels, and a sub-issue must belong to the same repository owner as its parent.

## Gotchas

- "Sounds good" to an idea is not approval of a design you have not shown. Approval covers only what the user saw.
- A plan longer than the code it describes has written the code. Replace bodies with signatures, test names and assertions. A line that decides nothing, such as a placeholder, a vague instruction or a type no task defines, is a gap, not a step.
- Names drift between tasks. Check every consumed name and type against the task that produces it, and every spec requirement against a task that implements it.
- A spike is throwaway. Keeping its code is a new request that goes back through design.
- A request that turns out to be several independent projects gets split. Agree on an order and plan one project at a time.
- In GitHub text, `#3` links to issue 3 of the repository. Call draft tickets T1, T2 until they exist, then write the cross-references in a second pass with the real numbers.
- The REST dependency and sub-issue endpoints take the issue's database `id` in `issue_id` and `sub_issue_id`, not its number. Get it with `gh api repos/{owner}/{repo}/issues/<n> --jq .id`, or use the gh flags, which take numbers.
- Closing keywords such as `Fixes #12` close the issue only when the PR or commit lands on the default branch.
- The session scratchpad belongs to one session. Keep plans that span sessions in the tracker or in a repository path the user agreed to.
- Decisions and limits stated only in conversation can be lost at compaction, including a "don't push" that auto mode reads from the transcript. Write each decision into the spec as it lands, and put a hard limit in a permission deny rule.

Related skills: concise:orchestration for running plan tasks or tickets through subagents, concise:codebase-analysis for the blast radius of a wide change and for the change itself, concise:database for sequencing schema migrations, concise:architecture for ADRs and spec formats such as Spec Kit and OpenSpec.
