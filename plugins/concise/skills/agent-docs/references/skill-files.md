# Skill files: frontmatter, description, body and testing

## Frontmatter

- `name` holds lowercase letters, digits and single hyphens, at most 64 characters with no hyphen at either end, and equals the directory name. claude.ai and the Skills API reject the words "claude" and "anthropic". Claude Code reserves `anthropic-skills` and the folder name `synced`, and outside a plugin skips a name with `<`, `>` or invisible characters.
- `description` is at most 1,024 characters under the Agent Skills spec, and Claude Code cuts `description` plus `when_to_use` at 1,536 characters in the listing (`skillListingMaxDescChars`). `<` and `>` display as `&lt;` and `&gt;`, so write a placeholder as `[branch]`. A colon followed by a space breaks an unquoted YAML value.
- Frontmatter is read only when the opening `---` is the first line. Claude Code ignores unknown and misspelled fields silently, and its fields are kebab-case except `when_to_use`. claude.ai uploads and the Skills API accept only `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools` and reject any other field with `Unexpected key(s) in SKILL.md frontmatter`, so a portable skill keeps its triggers in `description`.
- `disable-model-invocation: true` removes the description from context, stops Claude from invoking the skill and stops it from being preloaded into subagents. `user-invocable: false` hides the skill from the `/` menu and stops `/name` from running it, while the description stays in context and Claude can still invoke it.
- `allowed-tools` pre-approves tools for the invoking turn only and restricts nothing, and `disallowed-tools` removes tools until the next user message. A project skill's `allowed-tools` applies even in a `-p` run in an untrusted folder, so review it in repositories you clone.
- `paths:` activation fires when Claude reads, edits or writes a matching file inside the working directory, and files outside it, such as a sibling worktree, never match. An issue still open on 2026-11-19 (anthropics/claude-code#90004) reports that Bash-only file reads do not activate it, so name the trigger in the description too.
- `context: fork` runs the skill as the prompt of a fresh subagent that does not see the conversation (`agent` sets its type, `general-purpose` by default), in the background unless `background: false`. A skill of guidelines with no task returns nothing useful there.
- `model` and `effort` apply for the rest of the current turn only, or set the forked subagent's values with `context: fork`.

## Description

- The description is the only text the model sees before loading the skill. Open with one third-person clause naming the area, then "Use when" and concrete triggers: kinds of work, file names, commands, error messages, and indirect cases such as a version question or a review in the area.
- Put the main use first. The listing budget is 1% of the context window, and when it overflows Claude Code keeps every name but drops the descriptions of the least-used skills without telling the model. `/doctor` estimates the listing cost, and `skillListingBudgetFraction` raises the budget.
- Agents reach for a skill mostly when the task needs knowledge beyond their defaults, so a one-step request may not trigger even a good description. Name the need, such as an unfamiliar API or a house convention, rather than the generic task.
- Keep the workflow and rules out of the description, which decides when to load, while the body says what to do.

## Body

- Gotchas, concrete corrections to mistakes the model makes, carry the most value. Keep them in `SKILL.md`, and add one when the agent repeats a mistake after it was corrected.
- State the goal and the constraints rather than every step, and give one default with an escape hatch instead of a menu of options.
- Keep `SKILL.md` under 500 lines. Link every reference from it, one level deep, with the condition for reading it, because files linked from other references get partial reads. Start any reference over 100 lines with a contents list.
- Invoked skill content stays in context as one message and is not re-read on later turns, so write standing instructions such as "after every edit" rather than one-time steps.
- After compaction Claude Code re-attaches the first 5,000 tokens of each invoked skill, 25,000 tokens across all skills, newest first. Older skills can drop out entirely, so put critical rules near the top.
- Write a plan or a status as a dated fact rather than a relative date that expires. Name the current method, and keep superseded ones under a separate old-patterns note.
- Use `${CLAUDE_SKILL_DIR}` (or `${CLAUDE_PLUGIN_ROOT}` in a plugin) for bundled scripts. `` !`command` `` lines run before Claude sees the skill, and any non-zero exit, apart from exit 1 of a search or comparison command, aborts the whole invocation, so append `|| true` to a check that exits non-zero on findings.
- A rule the skill needs every time goes in its `hooks` frontmatter, which stays active from invocation to the end of the session.

## Where skills load

- Project skills load from `.claude/skills/` in the start directory and every parent up to the repository root. Skills in a subdirectory's `.claude/skills/` load only after Claude reads or edits a file there.
- For the same name, enterprise beats personal beats project, and a skill replaces a bundled skill or built-in command of that name but not its aliases. Plugin skills are namespaced as `/plugin:skill` and never collide.
- Personal skills in `~/.claude/skills/` do not reach Cowork or cloud sessions, including cloud scheduled tasks. Enable the skill on the claude.ai account or commit it to the repository instead.
- A worktree session loads the main checkout's project skills only when the worktree has no `.claude/skills` directory of its own.

## Testing

- Compare realistic prompts in fresh sessions with and without the skill, because leftover context from authoring hides gaps. `skillOverrides` set to `"off"` removes a personal or project skill, and `claude plugin eval` runs the comparison for a plugin skill.
- For trigger evals, write about 20 queries, 8 to 10 that should trigger and 8 to 10 near misses that share keywords but need something else. Run each 3 times, count a pass above a 0.5 trigger rate, tune on a fixed 60 percent split and pick the version that scores best on the other 40 percent.
- A should-trigger query that names the skill's area outright tests nothing. Include ones that describe the need in other words, with file paths, typos and backstory.
- Read the execution traces, not only the outputs. Wasted steps point to vague instructions, rules that do not apply to the task, or options without a default.
