# Concise for Claude Code

A Claude Code plugin with four parts: an output style for short replies in plain language, always-on working rules, notes written for the model in use, and 24 engineering skills that load on demand.

## Install

```sh
claude plugin install concise --marketplace dayfinggg/anthropic-claude-code-agent-skills
```

Restart Claude Code after installation. The plugin is tested on Claude Code 2.1.325. Older releases may lack the hook events it uses, so update Claude Code first. To update the plugin by hand:

```sh
claude plugin marketplace update concise
claude plugin update concise@concise
```

## What it adds

Each part uses the mechanism Claude Code provides for it, and each is a Markdown file you can edit.

| Part | Files | How it reaches Claude |
| --- | --- | --- |
| Output style | `plugins/concise/output-styles/concise.md` | Applied automatically while the plugin is enabled. It sets how Claude writes to you: the result first, plain words, prose instead of bullet lists, your language. |
| Working rules | `plugins/concise/instructions/*.md` | Handed to Claude Code as instruction files, the same way it loads a personal `CLAUDE.md`. They reach the main conversation and every subagent that loads `CLAUDE.md`, and they are still in the context after a compaction. |
| Model notes | `plugins/concise/models/*.md` | The file written for the session's model becomes the last section of the system prompt. |
| Skills | `plugins/concise/skills/<name>/` | Listed by name and description, loaded when the task reaches their area. |

### Output style

The style names the standards it follows and states their rules: BLUF, plain language as ISO 24495-1 defines it, ASD-STE100 Simplified Technical English, and the patterns that Wikipedia's "Signs of AI writing" and "Words to watch" list as marks of generated text. It asks for one sentence before the first tool call, silence while the work runs, and a final report that holds the outcome, the check that proves it, what is unverified and what you have to decide.

### Working rules

| File | What it covers |
| --- | --- |
| `scope.md` | Deliver what was asked, finish it without supervision, ask through the question tool, stop only for a real blocker |
| `code.md` | KISS, YAGNI, DRY with the Rule of Three, SOLID, parse don't validate, fail fast, no comments, scripts and probes, surgical changes, root-cause fixes, performance |
| `architecture.md` | Layout by business capability, information hiding, cohesion and coupling, the dependency rule, monolith first, design for failure, decision records |
| `verification.md` | Evidence for every claim, tests first, what counts as a passed check, definition of done |
| `research.md` | When to look up current documentation and practice, how to read and cite sources |
| `skills.md` | When to load a skill and its references |
| `security.md` | OWASP Top 10, untrusted input, secrets, content you did not write, dependencies |
| `live-systems.md` | Production servers, shared databases, pre-production first, other people's work, accounts |
| `compaction.md` | What a summary has to keep when the conversation is compacted |

On Opus 5.5, Fable 5.2, Mythos 5.2, Sonnet 5.5 and Haiku 5.5 Claude Code uses its shorter system prompt by default, and that prompt has no built-in section on scoping changes, comments and verification ([How output styles work](https://code.claude.com/docs/en/output-styles#how-output-styles-work)). On those models these files are the only coding rules Claude gets, which is why they state each rule in full instead of relying on defaults. Add, edit or remove a file in the folder to change the rules, and start a new session to pick up the change.

### Model notes

Each file in `models/` is named after the model ids it is written for, joined with `+`, such as `claude-fable-5-2+claude-mythos-5-2.md`. A session gets the file whose name is contained in its model id, so `claude-opus-5-5[1m]` and a Bedrock id of the same model match `claude-opus-5-5.md`. The notes follow Anthropic's prompting guide for that model and name the places where it drifts from the rules above: Opus 5.5 ends turns early and starts without skills, Sonnet 5.5 closes reports with lists, Fable and Mythos 5.2 lay a long report out like a document, Haiku 5.5 narrates each step. A model without a file gets no notes. To cover another model, add a file.

### Skills

The skills are agent-docs, architecture, autonomous-run, backend-api, code-review, codebase-analysis, containers-iac, database, debugging, frontend-ui, git, github-actions, orchestration, php, planning, python, react-next, rust, security-audit, server-ops, shell, testing, typescript-javascript and web-security. Each holds what a strong model does not know or gets wrong by default: version facts, exact commands, limits and traps, with longer material in `references/`.

### Code

The only code in the plugin is `plugins/concise/hooks/register.ts`. It reads the files in `instructions/` and passes them to Claude Code, and it adds the model notes to the system prompt. It moves five rarely used built-in tools (`Artifact`, `Workflow`, `ScheduleWakeup`, `ReportFindings` and `ListAgents`) behind tool search and keeps `WebSearch` and `WebFetch` loaded from the start, so that a lookup does not need a tool search first. Both use the `isDeferred` answer that the mods API documents for `tool.describe`. It also leaves out Claude Code's reminder to post a status after a silent stretch, because the output style asks for silence while the work runs. Delete the last `on(...)` line of the file to get that reminder back. The plugin rewrites no prompts, tool descriptions or tool results and sends no reminders of its own.

A session with the plugin starts with about 40,600 input tokens of context on Claude Code 2.1.325 with Opus 5.5, against about 31,800 with version 2.0.0. Prompt caching bills them at the cached rate after the first request.

## Checking a change

```sh
claude plugin validate plugins/concise
claude plugin test plugins/concise
claude plugin eval plugins/concise --model claude-opus-5-5 --allow-tools WebFetch
```

`validate` checks the manifest, the frontmatter of every skill and what the hook does. `test` runs the hook's tests without a session. `eval` runs the cases in `plugins/concise/evals/` in fresh sessions with and without the plugin: two check the shape of a reply, one checks that Claude reads and cites the official documentation of an external API, one checks that no skill loads for a request outside every skill, and the rest check that a skill loads for a request in its area. The documentation case needs `--allow-tools WebFetch`, because the eval runner withholds that tool otherwise. Every eval run is a real model call on your account.

## Settings

`settings.example.json` holds the author's optional Claude Code settings: the short system prompt, a larger skill listing budget, high effort, and memory, recaps, tips and surveys turned off. Copy the keys you want into `~/.claude/settings.json`, and add `language` to set the reply language. The example leaves permission settings out, so your own permission mode stays in force. Anthropic's notes on choosing an effort level are in [Spending your effort](https://claude.dev/blog/spending-your-effort/).

Installation does not replace your personal skills, global instructions, permissions or language settings.

## Upgrading

Version 2.1 restores the rules that 2.0 had shortened away. The principles and standards are named again and each is stated, the rules on loading skills and on looking up current documentation are back, and code gets no comments unless you ask for them. Scripts and probes, project structure and architecture have their own rules. Model notes, the security-audit skill, the system design reference of the architecture skill and the compaction rule are new. `WebSearch` and `WebFetch` are loaded from the start again, and Claude Code's reminder after silent stretches is left out again.

Version 2.0 removed what worked around Claude Code instead of with it, and that stays removed: the reminders sent with every prompt, at context milestones and after compaction, the check on the language of progress notes, and the edits to tool descriptions and tool results. The `codemods` skill is a reference of `codebase-analysis`.

To take a tool you never use out of the context completely, list its name under `permissions.deny` in your settings: a bare tool name there [removes the tool from Claude's context](https://code.claude.com/docs/en/permissions.md).

## Credits

The autonomous-run skill and the premise and blast-radius rules in debugging and code-review adapt ideas from [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan and [tstack](https://github.com/t3dotgg/tstack) by Theo Browne, both under the MIT License.

The references `modern-web-platform.md`, `accessibility.md` and `web-vitals.md` in frontend-ui, `browser-defenses.md` in web-security and the Temporal notes in typescript-javascript are distilled from [Modern Web Guidance](https://developer.chrome.com/docs/modern-web-guidance) by Google Chrome, published under the [Apache License 2.0](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/LICENSE). The complete set of its guides installs as its own plugin: `claude plugin marketplace add GoogleChrome/modern-web-guidance`, then `claude plugin install modern-web-guidance@googlechrome`.

The security-audit skill and its references adapt the method of Anthropic's [Defending Code Reference Harness](https://github.com/anthropics/defending-code-reference-harness), published under the Apache License 2.0. Each reference names the upstream files it is adapted from, and a copy of the license is in `plugins/concise/LICENSES/Apache-2.0.txt`. The harness itself, with its autonomous pipeline for C and C++ targets, runs from its own repository.

This is not an official Anthropic distribution. Instructions guide behavior but do not guarantee compliance on every response.
