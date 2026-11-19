---
name: agent-docs
description: Writing and auditing the instructions coding agents load, such as CLAUDE.md, AGENTS.md, .claude/rules, auto memory, skills, subagent definitions, output styles and plugin instructions. Use when creating, trimming or reviewing these files, when choosing between CLAUDE.md, a rule, a skill, an output style and a hook, when a skill does not trigger, when AGENTS.md is not loaded, or when Claude ignores or over-applies an instruction.
---

# Agent instruction files

This skill covers the files that steer Claude Code and other coding agents, and how to write them. It matches Claude Code 2.1.325 and the Claude 5 generation of models (Opus 5.5, Fable 5.2). Run `claude --version` first. Where the installed release is newer, its own release notes are right about fields, limits and load rules.

## References

Each file below holds what this page only names. Read it in full with the Read tool before the first step its condition describes, also when that step comes late in a long task or after a compaction.

- [references/claude-code-loading.md](references/claude-code-loading.md): read when writing or debugging `CLAUDE.md`, `AGENTS.md`, rules, imports, nested files or auto memory, or when sharing instructions with Codex, Gemini CLI, Cursor or Devin.
- [references/skill-files.md](references/skill-files.md): read when writing a skill, its frontmatter or description, when a skill does not trigger or triggers too often, or when testing one.
- [references/subagent-files.md](references/subagent-files.md): read when writing or debugging a subagent definition in `.claude/agents/`, `~/.claude/agents/` or a plugin's `agents/`.
- [references/plugins-and-output-styles.md](references/plugins-and-output-styles.md): read when writing instructions that ship in a plugin, writing a custom output style, or testing a plugin with `claude plugin eval`.

## Check first

- Version gates: reading `AGENTS.md` directly needs v2.1.277, `/doctor prompt-audit` v2.1.283, `claude plugin eval` v2.1.269, and `claude plugin validate` on a plain skills or agents directory v2.1.233.
- List every instruction file in play: `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md` and `AGENTS.md` in the working directory and above, nested ones below, `.claude/rules/`, `~/.claude/CLAUDE.md`, `~/.claude/rules/`, `.claude/skills/`, `.claude/agents/`, `.claude/output-styles/`, the auto memory folder, and other tools' files (`.cursor/rules/`, `.github/copilot-instructions.md`).
- `/context all` lists the memory files loaded at launch, and `/memory` also shows an `AGENTS.md` read directly. Subdirectory files load on demand and are absent from both until Claude touches a file there.
- `/doctor prompt-audit [path]` reports instructions written for older models, references to missing files or commands, and contradictions, and changes nothing until asked. `/doctor` proposes trims for a checked-in `CLAUDE.md`. `/skill-doctor` shows each skill's context cost and use. `claude plugin validate <dir>` finds frontmatter that does not parse.

## Choosing the mechanism

- Every session, true of the project in any mode: `CLAUDE.md` or `AGENTS.md`. Only one part of the tree: `.claude/rules/*.md` with `paths:`. Personal and uncommitted: `CLAUDE.local.md`.
- A procedure, a long reference or team knowledge needed only for some tasks: a skill. A skill with side effects (release, deploy, send a message) gets `disable-model-invocation: true`, so only the user can start it.
- The voice, length or format of every response, or a role other than software engineer: an output style, not `CLAUDE.md`. Only one style is active at a time.
- A rule that must hold every time: a hook or a permission deny rule. Text in any instruction file is a request. When emphasis keeps getting added to a line that is still missed, the line belongs in a hook. A hook that only encodes a preference can go back to text.
- A focused helper with its own tools, model or context: a subagent definition in `.claude/agents/`.
- How to build, start and drive the app to check a change: a project skill named `verify` in `.claude/skills/`, which Claude Code's commit instructions run before each commit. concise:testing covers it in `references/building-checks.md`.
- Inside a plugin: no `CLAUDE.md` is loaded. Task instructions go in skills, always-on instruction files in a hooks module's `prompt.context` hook, and must-hold rules in plugin hooks. See [references/plugins-and-output-styles.md](references/plugins-and-output-styles.md).
- Knowledge most tasks need belongs in `CLAUDE.md` as a short index of files to read. A pointer line names the material and the condition ("Read docs/billing.md before changing invoices"). Its wording, not the target, decides whether the agent goes there.

## Writing CLAUDE.md and rules

- Write down only what the agent cannot get by reading the repo, or would spend minutes rediscovering every session: exact test, lint and typecheck commands including one for a single test file, misleading code (a legacy pattern not to copy, a live directory that looks dead), decisions made outside the repo, and a mistake seen twice.
- A correction is not automatically a rule. The strongest signal is a mistake the agent conceded and then repeated. A one-off preference stays unsaved, and a behavior that must not regress gets a test.
- Turn a miss into a rule when it occurred in at least two changes and a diff can show it. Write it as a trigger, a check and the cases behind it, test it against past diffs for false alarms, and let a person approve it.
- Leave out architecture overviews, directory layouts, dependency lists and what a linter enforces. Status and progress notes go in the plan or tracker. Where auto memory is on, it holds user preferences and corrections, so they stay out of `CLAUDE.md`.
- Keep each `CLAUDE.md` under 200 lines. A nested file holds only what differs from the root. `@path` imports organize a file but cost the same context as pasting it.
- State the behavior with its scope and reason: "ask before deleting files under data/, they are the only copy". A bare prohibition spreads to cases it was not meant for.
- To share one file across tools, keep `AGENTS.md` as the source and add a `CLAUDE.md` whose first line is `@AGENTS.md`, followed by Claude-only lines.
- When `CLAUDE.md` sets commit or pull request rules, set `includeGitInstructions` to `false` and the `attribution` setting, or the built-in git instructions compete with them. That also drops Claude Code's instruction to run the project's `verify` skill before each commit, so state it in your own rules.
- Write the file in the style you want back, since its layout carries into the output. Give a template for an output format rather than worked examples, which narrow the model to the example.
- Hunt no-ops sentence by sentence: would the model act differently without this line? If not, delete the sentence. Settle disputes with fresh sessions run with and without the line.
- Prune on a routine, because rule files, test suites and verification steps only grow. When you add a rule, remove the ones that no longer fire, that another rule covers or whose reason has passed.

## Writing skills and subagents

- A skill description is third person: what the skill covers, then "Use when" with the situations, file names, commands and error strings that identify the area. Put the most common use first, because Claude Code cuts `description` plus `when_to_use` at 1,536 characters and drops whole descriptions of the least-used skills when the listing overflows.
- `when_to_use` is a Claude Code field appended to the description. claude.ai uploads and the Skills API reject it, so a portable skill keeps triggers in `description`.
- The body holds what the model does not know: version facts, exact commands, limits and a Gotchas section. Link each reference from `SKILL.md`, one level deep, with the condition for reading it.
- Skill content stays in context and is not re-read, so write standing instructions ("after every edit"). After compaction only the first 5,000 tokens of each invoked skill come back, so put critical rules near the top.
- A subagent's body replaces the Claude Code system prompt. Write it as a full prompt for one job, and put a rule the main conversation follows into the body or the brief, since Explore, Plan and `omitClaudeMd` agents skip `CLAUDE.md`.
- Test against a baseline in fresh sessions: set a personal or project skill to `"off"` in `skillOverrides`, and use `claude plugin eval` for a plugin skill or agent, because `skillOverrides` does not affect plugins.

## Gotchas

- Capitals, "IMPORTANT" and "MUST" make current models over-apply a rule. Fable 5.2 treats any instruction containing "never" as absolute, so write "ask before deleting files" where exceptions exist.
- Generic pushes ("think step by step", "be thorough", "keep going", "don't be lazy") are no-ops or cause over-work. Effort is the control for thinking. On Fable 5.2 a line such as "answer directly without deliberating" no longer reduces thinking at `medium` and above: lower the effort instead.
- An instruction to write out reasoning in the reply can be refused on Opus 5.5 and Fable 5.2 with the `reasoning_extraction` category. Ask for a short explanation of the choice instead.
- Cautions pile up in instruction files, notes and memory ("never retry", "stop at the first error"), and the model keeps obeying them. Delete each one whose reason has passed, list the routine steps that need no approval, and keep approval rules narrow: a broad one such as "messages to people outside this conversation" held back about half of routine requests in Anthropic's testing.
- Standing "delegate this" lines in prompts, skills and agent files make Fable 5.2 start more subagents than the task needs. "You own this codebase" makes it refactor beyond scope, and a scope rule elsewhere does not cancel it.
- Hard numeric style limits ("one instruction per sentence, in 20 words or fewer") make Fable 5.2 prose choppy.
- Two contradicting lines, in one file or across files, make Claude pick one arbitrarily. Reconcile them in one place.
- `CLAUDE.md` arrives as a user message after the system prompt. It is context, not enforcement.
- A skill whose YAML does not parse still loads and runs as `/name`, but Claude can no longer match it by its description. A subagent file with bad YAML, no `name` or no `description` is skipped without a notice in the session.

Related skills: concise:orchestration for delegating work and briefing subagents, concise:architecture for decision records and specs kept in the repo.
