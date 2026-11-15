# Concise for Claude Code

A Claude Code plugin with three parts: an output style for short replies in plain language, a small set of always-on working rules, and 23 engineering skills that load on demand.

## Install

```sh
claude plugin install concise --marketplace dayfinggg/anthropic-claude-code-agent-skills
```

Restart Claude Code after installation. The plugin needs Claude Code 2.1.287 or later, because the working rules load through a mod. To update by hand:

```sh
claude plugin marketplace update concise
claude plugin update concise@concise
```

## What it adds

Each part uses the mechanism Claude Code provides for it, and each is a Markdown file you can edit.

| Part | Files | How it reaches Claude |
| --- | --- | --- |
| Output style | `plugins/concise/output-styles/concise.md` | Applied automatically while the plugin is enabled. It sets how Claude writes to you: the result first, plain words, prose instead of bullet lists, your language. |
| Working rules | `plugins/concise/instructions/*.md` | Handed to Claude Code as instruction files, the same way it loads a personal `CLAUDE.md`. They reach the main conversation and every subagent that loads `CLAUDE.md`. |
| Skills | `plugins/concise/skills/<name>/` | Listed by name and description, loaded when the task reaches their area. |

The working rules are six short files: `scope.md` (deliver what was asked and finish it), `code.md` (simple, readable, fast enough, small diffs), `security.md` (untrusted input, secrets, content you did not write, dependencies), `verification.md` (reproduce, check, report what the check showed), `live-systems.md` (production servers, shared databases, other people's work) and `research.md` (current documentation before memory, sources, skills). Add, edit or remove a file in that folder to change the rules. Start a new session to pick up the change.

The skills are agent-docs, architecture, autonomous-run, backend-api, code-review, codebase-analysis, containers-iac, database, debugging, frontend-ui, git, github-actions, orchestration, php, planning, python, react-next, rust, server-ops, shell, testing, typescript-javascript and web-security. Each holds what a strong model does not know or gets wrong by default: version facts, exact commands, limits and traps, with longer material in `references/`.

The only code in the plugin is `plugins/concise/hooks/register.ts`, with two hooks. One reads the files in `instructions/` and passes them to Claude Code. The other moves five rarely used built-in tools (`Artifact`, `Workflow`, `ScheduleWakeup`, `ReportFindings` and `ListAgents`) behind tool search with the `isDeferred` answer that the mods API documents for `tool.describe`. Claude still loads such a tool when a task needs it, and every request carries about 17,000 fewer input tokens (measured on Claude Code 2.1.325). The list is `DEFERRED_TOOLS` at the top of the file. The plugin rewrites no prompts, tool descriptions or tool results and sends no reminders.

## Checking a change

```sh
claude plugin validate plugins/concise
claude plugin test plugins/concise
claude plugin eval plugins/concise --model claude-opus-5-5
```

`validate` checks the manifest, the frontmatter of every skill and what the hook does. `test` runs the hook's tests without a session. `eval` runs the cases in `plugins/concise/evals/` in fresh sessions with and without the plugin: two check the shape of a reply, the rest check that a skill loads for a request in its area. Every eval run is a real model call on your account.

## Settings

`settings.example.json` holds the author's optional Claude Code settings: the short system prompt, a larger skill listing budget, high effort, and memory, recaps, tips and surveys turned off. Copy the keys you want into `~/.claude/settings.json`, and add `language` to set the reply language. The example leaves permission settings out, so your own permission mode stays in force. Anthropic's notes on choosing an effort level are in [Spending your effort](https://claude.dev/blog/spending-your-effort/).

Installation does not replace your personal skills, global instructions, permissions or language settings.

## Upgrading from 1.x

Version 2.0 removes everything that worked around Claude Code instead of with it. The reminders sent with every prompt, at context milestones and after compaction are gone, and so is the check on the language of progress notes. Claude Code's own reminder for long silent stretches is no longer suppressed. The web search and fetch tools keep the placement and descriptions Claude Code gives them, and the list of deferred tools that Claude Code sends is no longer edited. The `codemods` skill is now a reference of `codebase-analysis`.

The five rarely used tools stay behind tool search as in 1.x. To take a tool you never use out of the context completely, list its name under `permissions.deny` in your settings: a bare tool name there [removes the tool from Claude's context](https://code.claude.com/docs/en/permissions.md).

## Credits

The autonomous-run skill and the premise and blast-radius rules in debugging and code-review adapt ideas from [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan and [tstack](https://github.com/t3dotgg/tstack) by Theo Browne, both under the MIT License.

The references `modern-web-platform.md`, `accessibility.md` and `web-vitals.md` in frontend-ui, `browser-defenses.md` in web-security and the Temporal notes in typescript-javascript are distilled from [Modern Web Guidance](https://developer.chrome.com/docs/modern-web-guidance) by Google Chrome, published under the [Apache License 2.0](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/LICENSE). The complete set of its guides installs as its own plugin: `claude plugin marketplace add GoogleChrome/modern-web-guidance`, then `claude plugin install modern-web-guidance@googlechrome`.

This is not an official Anthropic distribution. Instructions guide behavior but do not guarantee compliance on every response.
