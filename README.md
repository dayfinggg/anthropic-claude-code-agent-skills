# vesper-sieve

Short working rules for Claude Code and tools that stay asleep until they are needed.

The plugin adds `instructions/rules.md` to the end of the Claude Code system prompt and keeps Claude Code's own sections, including the one that the `language` setting adds. A one-sentence note on the final answer, `instructions/turn.md`, goes with each message that starts a turn. The plugin keeps rarely used tools out of the tool list until the model loads them, removes the lines of tool descriptions that conflict with its rules, and brings ten skills that load when their kind of work comes up.

## Install

```
claude plugin install vesper-sieve --marketplace dayfinggg/anthropic-claude-code-agent-skills
```

## Options

`deferred_tools` and `loaded_tools` choose which tools sleep and which are always loaded. `excluded_tool_lines` lists phrases, and a line of a tool description that holds one of them is left out. By default these are the WebSearch line asking for a separate "Sources:" list and the Bash line asking for a new branch before a commit on the default branch. `excluded_sections` and `excluded_reminders` name Claude Code prompt sections and reminders the plugin leaves out. By default it leaves out only `total_tokens_reminder`.

## Limits

Where Claude Code loads its [built-in guard](https://code.claude.com/docs/en/plugins/mods/admin#know-which-hooks-of-a-users-mod-dont-run), on a machine with managed settings or in a session signed in to a Team or Enterprise plan, it skips the plugin's `prompt.compose` and `prompt.attachment` hooks, so the rules and the reminder exclusion do not apply there. A change to the rules reaches new sessions only, because a running session keeps the system prompt it started with.
