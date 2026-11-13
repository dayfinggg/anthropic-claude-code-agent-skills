## Frontmatter

- `name`: lowercase letters, digits and single hyphens, no leading or trailing hyphen, at most 64 characters, equal to the directory name. claude.ai and the Skills API reject the words "claude" and "anthropic", and Claude Code reserves `anthropic-skills`.
- `description`: at most 1,024 characters under the Agent Skills spec. Claude Code cuts `description` plus `when_to_use` at 1,536 characters in the listing. `<` and `>` display as HTML entities, so write a placeholder as `[branch]`. A colon followed by a space breaks an unquoted YAML value.
- Claude Code ignores unknown fields without an error. A skill whose YAML does not parse still loads with no fields set: it runs as `/name`, but Claude can no longer match it by its description. claude.ai uploads and the Skills API reject any field outside `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools`.
- `disable-model-invocation: true` removes the description from context and stops the skill from being preloaded into subagents. `user-invocable: false` only takes it away from the user, and its description stays in context.
- `allowed-tools` pre-approves tools for the invoking turn only and restricts nothing.
- `paths:` activation fires on the Read, Edit and Write tools only, so a session that reads files through Bash never activates it (open issue anthropics/claude-code#90004), and files outside the working directory never match. Trigger through the description instead.
- `context: fork` runs the skill as the prompt of a fresh subagent that does not see the conversation. A skill of guidelines with no task returns nothing useful there.
- Skill fields are kebab-case (`disable-model-invocation`, `allowed-tools`). Subagent fields are camelCase (`disallowedTools`, `maxTurns`, `omitClaudeMd`). A misspelled field in either is ignored silently. For subagents, `claude --debug` names unrecognized fields (v2.1.296 and later).
- A subagent's markdown body replaces the Claude Code system prompt. Subagent descriptions together over 15,000 tokens trigger a startup warning.

## Description

- It is the only text the model sees before loading the skill. Open with one third-person clause naming the area, then "Use when" and concrete triggers: task types, the user's likely phrasings, file names and extensions, libraries, commands, error messages, and indirect cases such as a quick question, a review or a version choice in the area.
- Put the key use case first. When the listing exceeds its budget (1% of the context window), Claude Code drops the descriptions of the least-used skills and keeps only their names, with no notice to the model.
- Leave the workflow and rules out of the description. The model then follows the summary instead of reading the body.
- Agents reach for skills mostly when a task needs knowledge beyond their defaults. Name that need (a new API, a house convention) rather than the generic task.

## Body

- Gotchas, concrete corrections to mistakes the model makes, carry the most value. Keep them in `SKILL.md`, where the model reads them before the situation arises. Add one each time you correct the agent.
- State the goal and the constraints, not every step. Give one default with an escape hatch instead of a menu of options.
- Link every reference from `SKILL.md`, one level deep, with the condition for reading it ("Read references/api-errors.md when the API returns non-200"). Files linked from other references get partial reads. Start any reference over 100 lines with a contents list.
- Invoked skill content stays in context and is not re-read on later turns. Write standing instructions ("after every edit") rather than one-time steps.
- After compaction Claude Code re-attaches the first 5,000 tokens of each invoked skill, 25,000 tokens across all skills, newest first. Put the critical rules near the top.
- Avoid dates that will expire ("before August use the old API"). Name the current method, and keep superseded ones under a separate old-patterns note.

## Testing

- Baseline: run realistic prompts in fresh sessions with the skill and without it (`skillOverrides` set to `"off"` for personal and project skills, `claude plugin eval` for plugin skills, which `skillOverrides` does not affect).
- Trigger evals: about 20 queries, half of them should-not-trigger near misses that share keywords with the skill. Run each 3 times and count a pass above a 0.5 trigger rate. Tune on a fixed 60 percent split and pick the version that scores best on the other 40 percent.
- A should-trigger query that names the skill's domain outright tests nothing. Include ones that describe the need in other words, with file paths, typos and backstory.
- Read the execution traces, not only the outputs. Wasted steps point to vague instructions, rules that do not apply to the task, or options without a default.
