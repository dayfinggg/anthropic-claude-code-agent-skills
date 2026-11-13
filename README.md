This repository distributes the Concise plugin for Claude Code. It adds the official Concise output style reworked for any reply language, always-on working rules, 23 engineering skills, and a lighter context: rarely used built-in tools wait behind ToolSearch.

Install the plugin with Claude Code's plugin manager.

```sh
claude plugin install concise --marketplace dayfinggg/anthropic-claude-code-agent-skills
```

Restart Claude Code after installation. The marketplace entry in `settings.example.json` has `autoUpdate` turned on, so interactive sessions update the plugin in the background and the next launch loads the new version. To update by hand, run these commands.

```sh
claude plugin marketplace update concise
claude plugin update concise@concise
```

The working rules live in `plugins/concise/instructions`, one Markdown file per topic: scope, changes, design, solutions, testing, security, live systems, evidence, questions, obstacles, research, and skills. The plugin loads every `.md` file in that folder into the system prompt of the main session and of every subagent, so you can edit, add, or remove a file to change the rules.

The skills live in `plugins/concise/skills`: planning, orchestration, autonomous-run, agent-docs, architecture, codebase-analysis, codemods, debugging, testing, code-review, git, github-actions, containers-iac, shell, web-security, backend-api, react-next, frontend-ui, typescript-javascript, php, database, python, and rust. Each one holds only current facts and traps a strong model gets wrong, checked against official sources, with a `SKILL.md` and at most three files in `references`. Claude loads a skill before it answers or acts and again when the work reaches the skill's area, then reads its references and checks the links it gives for current versions.

The file `settings.example.json` holds the author's optional Claude Code settings: the short system prompt, a larger skill listing budget so no skill description is dropped, high effort, and memory, recaps, tips, and surveys turned off. Copy the keys you want into `~/.claude/settings.json`, and add `language` to set the reply language. The example leaves permission settings out, so your own permission mode stays in force.

Installation does not replace your personal skills, global instructions, permissions, or language settings.

The autonomous-run skill and the premise and blast-radius rules in debugging and code-review adapt ideas from [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan and [tstack](https://github.com/t3dotgg/tstack) by Theo Browne, both under the MIT License.

This is not an official Anthropic distribution. Instructions guide behavior but do not guarantee compliance on every response.
