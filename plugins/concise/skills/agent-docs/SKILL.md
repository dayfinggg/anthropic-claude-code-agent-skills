---
name: agent-docs
description: Load before writing, trimming or auditing the instructions coding agents load, such as CLAUDE.md, AGENTS.md, .claude/rules, auto memory, skills, subagent files, output styles and the rules a plugin delivers through its hooks module, and when a skill does not trigger or Claude ignores or over-applies an instruction. Briefing a subagent at run time belongs to orchestration.
---

# Agent instruction files

This skill covers the files that steer Claude Code and other coding agents and how to write them. It matches Claude Code 2.1.328 and the Claude 5 generation of models (Opus 5.5, Fable 5.2). Run `claude --version` first, and where the installed release is newer, its release notes are right about fields, limits and load rules.

## References

- Read [references/claude-code-loading.md](references/claude-code-loading.md) before writing or debugging `CLAUDE.md`, `AGENTS.md`, rules, imports or auto memory, or sharing instructions with Codex, Gemini CLI, Cursor or Devin.
- Read [references/skill-files.md](references/skill-files.md) before writing or testing a skill, or when one triggers too rarely or too often.
- Read [references/subagent-files.md](references/subagent-files.md) before writing or debugging a subagent definition.
- Read [references/plugins-and-output-styles.md](references/plugins-and-output-styles.md) before writing instructions that a plugin or its hooks module delivers, writing an output style, or running `claude plugin eval`.

## Check first

- Reading `AGENTS.md` directly needs Claude Code 2.1.277, `/doctor prompt-audit` 2.1.283, `claude plugin eval` 2.1.269, `/skill-doctor` 2.1.252, and `claude plugin validate` on a bare `.claude/skills` directory 2.1.233.
- List every instruction file in play: `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md` and `AGENTS.md` here and above, nested ones below, `.claude/rules/`, `~/.claude/CLAUDE.md`, `~/.claude/rules/`, `.claude/skills/`, `.claude/agents/`, `.claude/output-styles/`, the auto memory folder, and other tools' files such as `.cursor/rules/` and `.github/copilot-instructions.md`.
- `/context all` lists the memory files loaded at launch, and `/memory` also shows an `AGENTS.md` read directly. Subdirectory files appear in neither until Claude touches a file there.
- `/doctor prompt-audit [path]` reports instructions written for older models, references to missing files or commands, and contradictions, and edits nothing until asked. `/doctor` proposes trims for a checked-in `CLAUDE.md`, `/skill-doctor` shows each skill's context cost and use, and `claude plugin validate <dir>` finds frontmatter that does not parse.

## Choosing the mechanism

- Facts true of the project in every session go in `CLAUDE.md` or `AGENTS.md`, facts for one part of the tree in `.claude/rules/*.md` with `paths:`, and personal, uncommitted lines in `CLAUDE.local.md`.
- A procedure, a long reference or team knowledge that only some tasks need goes in a skill. A skill with side effects, such as a release, a deploy or a message, gets `disable-model-invocation: true` so that only the user starts it.
- The voice, length or format of every reply, or a role other than software engineer, goes in an output style, of which one is active at a time.
- A rule without exceptions needs a hook or a permission deny rule, because `CLAUDE.md` and rules arrive as a user message after the system prompt, as context rather than enforcement. A line that keeps gaining emphasis and is still missed belongs in a hook, and a hook that only encodes a preference goes back to text.
- A focused helper with its own tools, model or context gets a subagent definition in `.claude/agents/`.
- How to build, start and drive the app goes in a project skill named `verify`, which Claude Code's commit instructions run before each commit that changes more than docs or tests. concise:testing covers it in `references/building-checks.md`.
- A plugin cannot ship a `CLAUDE.md`. It delivers task instructions as skills, always-on rule files through a hooks module's `prompt.context` hook, system prompt text through `prompt.compose`, and rules without exceptions as hooks. Where an organization manages Claude Code, the prompt hooks of a user-installed plugin do not run.
- Knowledge most tasks need goes in `CLAUDE.md` as a short index of files to read, each pointer naming the material and the condition, as in "Read docs/billing.md before changing invoices". The wording of the pointer, not the target, decides whether the agent goes there.

## Writing CLAUDE.md and rules

- Write down only what the agent cannot get from the repo or would spend minutes rediscovering: exact build, test, lint and typecheck commands including one for a single test file, misleading code such as a legacy pattern not to copy, decisions made outside the repo, and a mistake seen twice.
- Leave out architecture overviews, directory layouts, dependency lists and what a linter enforces. Status notes go in the plan or tracker, and where auto memory is on, it holds user preferences and corrections.
- A correction becomes a rule when the agent conceded a mistake and then repeated it. A one-off preference stays unsaved, and a behavior that must not regress gets a test.
- When a diff can show a repeated miss, write the rule as a trigger, a check and the cases behind it, test it against past diffs for false alarms, and let a person approve it.
- Keep each `CLAUDE.md` under 200 lines. A nested file holds only what differs from the root, and `@path` imports cost the same context as pasting the file.
- State each behavior with its scope and reason, as in "ask before deleting files under data/, they are the only copy", because a bare prohibition spreads to cases it was not meant for.
- Keep `AGENTS.md` as the one source across tools. Claude Code reads it directly when no `CLAUDE.md` exists, and Claude-only lines go in a `CLAUDE.md` whose first line is `@AGENTS.md`.
- When `CLAUDE.md` sets commit or pull request rules, set `includeGitInstructions` to `false` and set `attribution`, or the built-in git instructions compete with yours. That also drops the instruction to run the `verify` skill before each commit, so restate it.
- Write the file in the style you want back, because its layout carries into the output, and give a template for an output format rather than a worked example, which narrows the model to that example.
- Delete each sentence the model would act the same without, and settle disputes with fresh sessions run with and without the line. When you add a rule, remove the ones that no longer fire, that another rule covers or whose reason has passed.

## Gotchas

- Capitals, IMPORTANT and MUST make current models over-apply a rule, so drop the emphasis. Fable 5.2 treats any instruction containing "never" as absolute, so write "ask before deleting files" where exceptions exist.
- Generic pushes to think step by step, be thorough or keep going are no-ops or cause over-work, since effort controls thinking. On Fable 5.2 a request to answer without deliberating no longer reduces thinking at `medium` and above, so lower the effort.
- A request to write out reasoning in the reply can be refused on Opus 5.5 and Fable 5.2 with the `reasoning_extraction` category. Ask for a short explanation or the evidence behind a result instead.
- Cautions pile up in instruction files, notes and memory, such as an old order not to retry, and the model keeps obeying them. Delete those whose reason has passed, list the routine steps that need no approval, and keep approval rules narrow, because in Anthropic's testing putting every message to people outside the conversation under approval held back about half of the routine ones.
- Standing lines that tell the model to delegate make Fable 5.2 start more subagents than the task needs, so remove those the task does not need. A line that calls the code the model's own makes it refactor beyond scope, and a scope rule elsewhere does not cancel it.
- Hard numeric style limits, such as a word cap per sentence, make Fable 5.2 prose choppy, so remove the ones you do not need.
- Two contradicting lines, in one file or across files, make Claude pick one arbitrarily, so reconcile them in one place.
- A skill whose YAML does not parse still runs as `/name`, but Claude can no longer match it by its description, and a subagent file with bad YAML, no `name` or no `description` is skipped with no notice. Run `claude plugin validate` after editing frontmatter.

Related skills: concise:orchestration for delegating work and briefing subagents, concise:testing for verify skills and review rules, concise:architecture for decision records and specs kept in the repo.
