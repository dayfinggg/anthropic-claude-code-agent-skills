Concise provides 22 engineering skills, a plain output style, and coding instructions for Claude Code.

Install it through the repository's marketplace.

```sh
claude plugin install concise --marketplace dayfinggg/anthropic-claude-code-agent-skills
```

Restart Claude Code after installation. The plugin uses your configured response language, or the language of your latest message when none is configured. It puts the writing rules (`instructions/style.md`) and the working rules (`instructions/work.md`) into the system prompt, rewrites Claude Code's own language and output style reminders so they say the same thing, and adds a short note for the model that runs the session (Opus, Sonnet, Haiku, or Fable). The writing rules are the same for every model, and each note covers only the habits that Anthropic documents for that model. Skills load through the model's own Skill calls, and the rules ask it to call the skills that cover the work at hand, so a new skill needs only a description that names its kind of work. The plugin points to the writing rules in one line with each prompt, adds to the Read tool's description when to use it, leaves out Claude Code's own request for a status line after five quiet steps, because a note between tool calls is written only when the plan changes, a problem appears, or the work moves to its next stage, and tells the compaction summary what to keep. A subagent receives the working rules, and after its task a short contract for its report (`instructions/report.md`).

These are instructions, so a model follows them most of the time and not every time. Two things lie outside their reach. On Fable, Opus, and Sonnet a note between tool calls can come back as a progress update that another model summarizes, so the wording and punctuation of that summary are not the plugin's. Notices that the platform adds to a conversation cannot be removed, and the rules only ask the model not to announce each one.

The distribution `LICENSE` holds source attribution and redistribution terms. This plugin is not an official Anthropic distribution.
