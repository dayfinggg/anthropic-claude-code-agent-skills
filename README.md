# vesper-sieve

Short working rules for Claude Code and tools that stay asleep until they are needed.

The plugin adds one section, `instructions/rules.md`, to the end of the Claude Code system prompt and keeps Claude Code's own sections. When the Claude Code `language` setting is set, it names that language in the prompt and repeats it, together with a short note on the final answer, after each batch of tool calls. It keeps rarely used tools out of the tool list until the model loads them, and it brings ten skills that load when their kind of work comes up.

## Install

```
claude plugin install vesper-sieve --marketplace dayfinggg/anthropic-claude-code-agent-skills
```

## Options

`deferred_tools` and `loaded_tools` choose which tools sleep and which are always loaded. `excluded_sections` and `excluded_reminders` name Claude Code prompt sections and reminders the plugin leaves out. By default it leaves out only `total_tokens_reminder`.
