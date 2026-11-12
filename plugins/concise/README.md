Concise provides 24 engineering skills, a plain output style, and coding instructions for Claude Code.

Install it through the repository's marketplace.

```sh
claude plugin install concise --marketplace dayfinggg/anthropic-claude-code-agent-skills
```

Restart Claude Code after installation. The plugin uses your configured response language, or the language of your latest message when none is configured. It puts the working rules (`instructions/work.md`) and the writing rules (`instructions/style.md`) into the system prompt, rewrites Claude Code's own language and output style reminders so they say the same thing, and adds a short note for the model that runs the session (Opus, Sonnet, Haiku, or Fable). The rules are the same for every model, and each note covers only the habits documented or observed for that model. Skills load through the model's own Skill calls, and the rules ask it to call the skills that cover the work at hand, so a new skill needs only a description that names its kind of work. The plugin adds a short working and writing reminder with each prompt, gives Bash, PowerShell, Read, Edit, and Write their operation-specific instructions, leaves out Claude Code's own request for a status line after five quiet steps, because a note between tool calls is written only when the plan changes, a problem appears, or the work moves to its next stage, and tells the compaction summary what to keep. A native subagent receives the working rules, and after its task a report contract (`instructions/report.md`). The delegation skill defines worker ownership, progress checkpoints, corrections, and evidence required before acceptance. A narrow rewrite of Claude Code's skipped-step reporting sentence keeps material blockers visible without requiring routine footnotes.
The plugin supplies instructions rather than enforcing tool calls or validating generated output. On Fable, Opus, and Sonnet a displayed progress update can be a summary produced by a different model, as the [Anthropic documentation](https://platform.claude.com/docs/en/build-with-claude/thinking#progress-updates-between-tool-calls) describes. The plugin can guide the original note but does not set the summarizer's prompt. Messages added by a host application outside Claude Code's prompt hooks are also outside the plugin's control.

This plugin is not an official Anthropic distribution.
