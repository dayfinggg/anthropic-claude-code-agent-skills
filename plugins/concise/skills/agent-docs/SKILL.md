---
name: agent-docs
description: Writing and auditing the instructions coding agents read, such as CLAUDE.md, CLAUDE.local.md, AGENTS.md, .claude/rules files, auto memory and MEMORY.md, Claude Code skills (SKILL.md, descriptions, references) and subagent definitions in .claude/agents. Use when creating, editing, trimming or reviewing any of these, when a skill does not trigger or triggers too often, when Claude ignores, forgets or over-applies an instruction, when an AGENTS.md is not picked up, when sharing one instruction file across Claude Code, Codex, Cursor or Copilot, or when the user says "update CLAUDE.md", "add a rule", "write a skill", "why doesn't my skill load" or "clean up our agent docs".
---

## Check first

- Run `claude --version`. Reading `AGENTS.md` directly needs v2.1.277 or later, `/doctor prompt-audit` v2.1.283 or later.
- List every instruction file in play: `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md` and `AGENTS.md` in the working directory and above, nested ones below, `.claude/rules/`, `~/.claude/CLAUDE.md`, `~/.claude/rules/`, `.claude/skills/`, `.claude/agents/`, and other tools' files (`.cursor/rules/`, `.github/copilot-instructions.md`).
- `/context all` lists the memory files loaded at launch. `/doctor prompt-audit [path]` flags outdated, broken and conflicting instructions. `claude plugin validate <dir>` finds frontmatter that does not parse. `/skill-doctor` shows each skill's context cost and use.
- Current Claude Code release (the facts here match 2.1.323): https://registry.npmjs.org/@anthropic-ai/claude-code/latest
- Portable skill format: https://agentskills.io/specification.md
- Facts verified 2026-11.

## Defaults

- Write down only what the agent cannot get by reading the repo, or would spend minutes rediscovering every session: the exact test, lint and typecheck commands including one for a single test file, misleading code (a legacy pattern not to copy, a live directory that looks dead), decisions made outside the repo, and a mistake you saw the agent repeat.
- A correction is not automatically a rule. The strongest signal is one the agent conceded ("You're right") and then repeated, which means a rule is missing or not loaded. A one-off preference stays unsaved, and a behavior that must not regress gets a test instead of a line.
- Leave out architecture overviews, directory layouts, dependency lists and rules a linter or formatter enforces. Status and progress notes go in the plan or tracker.
- Keep each `CLAUDE.md` under 200 lines. A nested file holds only what differs from the root.
- Choose the mechanism by when the content applies: every session in `CLAUDE.md` or `AGENTS.md`, one part of the tree in `.claude/rules/*.md` with `paths:`, a procedure or long reference in a skill, and a rule that must hold every time in a hook or a permission deny rule.
- Knowledge that most tasks need goes into `CLAUDE.md` or `AGENTS.md` as a short index of files to read. A skill loads only when the model decides it applies.
- A pointer line names the material and the condition for reading it ("Read docs/billing.md before changing invoices"). Its wording, not the target, decides whether the agent goes there.
- To share one file across tools, keep `AGENTS.md` as the source and add a `CLAUDE.md` whose first line is `@AGENTS.md`, followed by Claude-only lines.
- State the behavior you want, with its scope and its reason: "ask before deleting files under data/, they are the only copy". A bare prohibition spreads to cases it was not meant for.
- Reserve "never" for rules with no exceptions. Fable 5.2 treats an instruction containing "never" as absolute.
- Write at normal volume. Capitals, "IMPORTANT" and "MUST" make current models over-apply a rule. When a plainly worded line is still missed, the file is too long or the rule belongs in a hook.
- Hunt no-ops sentence by sentence: would the model act differently without this line? If not, delete the whole sentence. A line that only makes the model slower, longer or more hedged is worse than none. Settle disputes by running a fresh session with and without it.
- Write the file in the style you want back. The layout of an instruction file carries into the output.
- Give a template for an output format. Avoid worked examples of tool use, which narrow the model to the example.

## Gotchas

- Generic pushes ("think step by step", "be thorough", "keep going", "don't be lazy") are no-ops or cause over-work. Effort controls thinking. If runs stop early, name the specific stops to avoid and the ones you want.
- An instruction to write out reasoning in the reply can be refused on Opus 5.5 and Fable 5.2 with the `reasoning_extraction` category. Ask for a short explanation of the choice instead.
- Cautions pile up in instruction files, notes and memory ("never retry", "stop at the first error"), and the model keeps obeying them. Delete each one whose reason has passed, or rewrite it with its scope.
- Standing "delegate this" lines make Fable 5.2 start more subagents than the task needs. "You own this codebase" makes it refactor beyond scope, and a scope rule elsewhere does not cancel it.
- Hard style limits ("one idea per sentence, under 20 words") make Fable 5.2 prose choppy.
- Two contradicting lines, in one file or across files, make Claude pick one arbitrarily. Reconcile them in one place.
- `CLAUDE.md` arrives as a user message after the system prompt. It is context, not enforcement.

## References

- Read references/claude-code-loading.md when writing or debugging `CLAUDE.md`, `AGENTS.md`, rules files, imports or nested files.
- Read references/skill-files.md when writing a skill, its description or a subagent definition, or when a skill does not trigger.
