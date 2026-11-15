# Concise for Claude Code

A Claude Code plugin with an output style for short replies in plain language, always-on working rules, notes for the model in use and 24 engineering skills. Tested on Claude Code 2.1.325.

## Contents

| Path | What it holds |
| --- | --- |
| `plugins/concise/output-styles/concise.md` | The reply style, applied while the plugin is enabled |
| `plugins/concise/instructions/` | Nine rule files, loaded the way a personal `CLAUDE.md` is |
| `plugins/concise/models/` | Notes for Opus 5.5, Fable 5.2 and Mythos 5.2, Sonnet 5.5 and Haiku 5.5 |
| `plugins/concise/skills/` | 24 skills that load when a task reaches their area |
| `plugins/concise/hooks/register.ts` | The hooks module that delivers the rules and the notes and sets which tools load up front |
| `settings.example.json` | The author's Claude Code settings. They turn permission prompts off, so copy only the keys you want |

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
