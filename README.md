# Concise for Claude Code

A Claude Code plugin with an output style for short replies in plain language, always-on working rules, notes for the model in use and 25 engineering skills. Tested on Claude Code 2.1.329.

## Contents

| Path | What it holds |
| --- | --- |
| `plugins/concise/output-styles/concise.md` | The reply style, applied while the plugin is enabled |
| `plugins/concise/instructions/` | Seven rule files, loaded the way a personal `CLAUDE.md` is |
| `plugins/concise/models/` | Notes for Opus 5.5, Fable 5.2 and Mythos 5.2, Sonnet 5.5 and Haiku 5.5 |
| `plugins/concise/skills/` | 25 skills that load when a task reaches their area |
| `plugins/concise/hooks/register.ts` | The hooks module that delivers the rules and the model notes, to subagents too, sets which tools load up front and adds the short reminders |
| `settings.example.json` | The author's Claude Code settings. They turn permission prompts off, so copy only the keys you want |

## How the parts reach the model

| Part | Where it lands | When |
| --- | --- | --- |
| Output style | Instructions sent with every request of the main conversation and its forks | Always |
| Rule files | User instruction files, like `~/.claude/CLAUDE.md`, and the task of built-in Explore and Plan agents | Always |
| Model note | The end of the system prompt, and the task of each subagent, for the model it runs on | Always |
| Skills | The skill listing, and the full text when the model or the user invokes one | On demand |
| Reminders | A short block after each prompt and background task notice, and the text of Claude Code's reminder after a long quiet stretch | Each turn and during long turns |

The rule files cover scope and autonomy, tools and waiting, code, evidence and verification, current sources, shared systems and security, and what a compaction keeps. Each file holds one topic, so a rule lives in one place. They are written as prose, because the model carries the layout of its instructions into its replies.

The reminders repeat the rules that sessions broke most, which are loading the skill of an area before working in it, sending independent reads as separate calls and writing the reply as plain paragraphs of about 100 words. They block nothing, and the text a plugin skill expands to ends with one line that keeps replies in the output style.

On a machine with managed settings, or in a session signed in to a Team or Enterprise plan, Claude Code loads its built-in guard, which skips the prompt hooks of user-installed mods. There the rule files and the model notes do not reach the model, while the output style and the skills still load.

## Install

Claude Code in a terminal:

```sh
claude plugin install concise --marketplace dayfinggg/anthropic-claude-code-agent-skills
```

Claude Desktop: run the same command in a terminal on that computer. Local sessions in the Code tab read the same settings files, so new sessions there load the plugin. To turn it on, off or remove it in the app, click **+** next to the prompt box and open **Plugins**, then **Manage plugins**.

## Update

```sh
claude plugin marketplace update concise
claude plugin update concise@concise
```

Start a new session afterwards, or run `/reload-plugins` in an open one.

## Check

```sh
claude plugin validate plugins/concise
```

## License and credits

MIT, see `LICENSE`. The security-audit skill adapts Anthropic's [Defending Code Reference Harness](https://github.com/anthropics/defending-code-reference-harness), and parts of frontend-ui, web-security and typescript-javascript are distilled from Google Chrome's [Modern Web Guidance](https://developer.chrome.com/docs/modern-web-guidance). Both are under the Apache License 2.0, a copy of which is in `plugins/concise/LICENSES/Apache-2.0.txt`. The autonomous-run skill and rules in debugging and code-review adapt ideas from [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan and [tstack](https://github.com/t3dotgg/tstack) by Theo Browne, both under the MIT License.

This is not an official Anthropic distribution.
