Concise provides 22 engineering skills, a plain output style, and coding instructions for Claude Code.

Install it through the repository's marketplace.

```sh
claude plugin install concise --marketplace dayfinggg/anthropic-claude-code-agent-skills
```

Restart Claude Code after installation. The plugin uses your configured response language, or the language of your latest message when none is configured. It puts the writing rules (`instructions/style.md`) and the working rules (`instructions/work.md`) into the system prompt, rewrites Claude Code's own language and output style reminders so they say the same thing, and adds a short note for the model that runs the session (Opus, Sonnet, Haiku, or Fable). It loads a skill into the tool result the first time a matching file type or command appears, and repeats a one-line style check after every tenth tool call of a long turn.

The distribution `LICENSE` holds source attribution and redistribution terms. This plugin is not an official Anthropic distribution.
