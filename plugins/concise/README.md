Concise provides 22 engineering skills, a plain output style, and coding instructions for Claude Code.

Install it through the repository's marketplace.

```sh
claude plugin install concise --marketplace dayfinggg/anthropic-claude-code-agent-skills
```

Restart Claude Code after installation. The plugin uses your configured response language, or the language of your latest message when none is configured. It puts the writing rules (`instructions/style.md`) and the working rules (`instructions/work.md`) into the system prompt, rewrites Claude Code's own language and output style reminders so they say the same thing, and adds a short note for the model that runs the session (Opus, Sonnet, Haiku, or Fable). It loads a skill the first time its kind of work appears, in the main session and in subagents alike, from a file type or command, from a web search or fetch (research), from the first code change (testing), and from the third changed file of a turn or a file copied to another machine (review). Skills without such a signal, such as debugging, planning, and delegation, rely on their descriptions and on the rule to decide for each listed skill before the first tool call. It repeats a one-line style check after every tenth tool call for the whole turn, leaves out Claude Code's own request for a status line after five quiet steps, because a note between tool calls is written only when the plan changes, a problem appears, or the work moves to its next stage, and tells the compaction summary what to keep.

The distribution `LICENSE` holds source attribution and redistribution terms. This plugin is not an official Anthropic distribution.
