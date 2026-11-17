# Concise for Claude Code

A Claude Code plugin with an output style for short replies in plain language, always-on working rules, notes for the model in use and 24 engineering skills. Tested on Claude Code 2.1.326.

## Contents

| Path | What it holds |
| --- | --- |
| `plugins/concise/output-styles/concise.md` | The reply style, applied while the plugin is enabled |
| `plugins/concise/instructions/` | Nine rule files, loaded the way a personal `CLAUDE.md` is |
| `plugins/concise/models/` | Notes for Opus 5.5, Fable 5.2 and Mythos 5.2, Sonnet 5.5 and Haiku 5.5 |
| `plugins/concise/skills/` | 24 skills that load when a task reaches their area |
| `plugins/concise/hooks/register.ts` | The hooks module that delivers the rules and the notes, to subagents too, sets which tools load up front and runs the commit gate and the wait gate |
| `plugins/concise/evals/` | Eval cases for `claude plugin eval` |
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

## Commit gate

The plugin judges every `git commit` Claude runs. A commit passes when the session ran a `verify`, `run` or `code-review` skill, or when its message carries a `Verified:` trailer that says how the change was checked or why it was not. The `commit_gate` option sets what happens to the other commits:

| Value | Effect |
| --- | --- |
| `observe` (default) | The commit goes through and is recorded in the plugin's store under `plugins/store/` in the Claude Code configuration folder |
| `enforce` | The commit is blocked with the reason, and after two blocks in a session the next commit goes through |
| `off` | Nothing is judged |

Change it in `/config`, or in `settings.json` under `pluginConfigs`. Review the records of `observe` for false alarms before you switch to `enforce`.

## Wait gate

The plugin also judges every foreground shell command, in Bash and in PowerShell. A command fails the check when it can sleep or poll for longer than a minute, also inside `ssh`: an `until` or `while` loop around a `sleep`, a counted loop whose rounds add up to more than a minute, or sleeps chained between commands. A command started with `run_in_background` is not judged. The `wait_gate` option takes the same three values as `commit_gate` and records under the key `wait-gate` in the same store.

## Check

```sh
claude plugin validate plugins/concise
claude plugin eval plugins/concise --scaffold --allow-tools Edit Write
```

The eval cases in `plugins/concise/evals/` come from failures seen in real sessions. They use no shell tool, so they also run where Claude Code has no sandbox.

## License and credits

MIT, see `LICENSE`. The security-audit skill adapts Anthropic's [Defending Code Reference Harness](https://github.com/anthropics/defending-code-reference-harness), and parts of frontend-ui, web-security and typescript-javascript are distilled from Google Chrome's [Modern Web Guidance](https://developer.chrome.com/docs/modern-web-guidance). Both are under the Apache License 2.0, a copy of which is in `plugins/concise/LICENSES/Apache-2.0.txt`. The autonomous-run skill and rules in debugging and code-review adapt ideas from [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan and [tstack](https://github.com/t3dotgg/tstack) by Theo Browne, both under the MIT License.

This is not an official Anthropic distribution.
