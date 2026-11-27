# vesper-sieve

Short working rules for Claude Code and tools that stay asleep until they are needed.

The plugin adds `instructions/rules.md` to the end of the Claude Code system prompt and keeps Claude Code's own sections, including the one that the `language` setting adds. A short note on the final answer, `instructions/turn.md`, goes with each message that starts a turn. The plugin keeps rarely used tools out of the tool list until the model loads them, removes the lines of tool descriptions that conflict with its rules, and brings ten skills that load when their kind of work comes up.

The plugin also checks each text block of the main conversation before it is shown, progress notes included. It swaps guillemets and curly quotes for straight ones, and it sends only the sentences that hold a colon, a semicolon, a dash or a contrast turn to the session's model with `instructions/restyle.md`, keeping code, paths and links out of the request. A rewrite is used only when it keeps every protected fragment and has fewer problems, so a failed or refused call shows the text as written. The rewrite changes both what the person sees and the transcript.

## Install

```
claude plugin install vesper-sieve --marketplace dayfinggg/anthropic-claude-code-agent-skills
```

## Options

`deferred_tools` and `loaded_tools` choose which tools sleep and which are always loaded. `excluded_tool_lines` lists phrases, and a line of a tool description that holds one of them is left out. By default these are the WebSearch line asking for a separate "Sources:" list and the Bash line asking for a new branch before a commit on the default branch. `excluded_sections` and `excluded_reminders` name Claude Code prompt sections and reminders the plugin leaves out. By default it leaves out `total_tokens_reminder` and `silent_turn_reminder`, the reminder that asks for a progress note after a stretch without text.

`restyle_marks` lists the marks that send a sentence for a rewrite. `restyle_turns` and `restyle_possible_turns` list contrast turns, with the parts that must appear in order in one sentence separated by an ellipsis, and a possible turn is rewritten only when the model finds that it is one. `restyle_swaps` replaces the first character of each entry with the rest of it. `restyle_max_chars` leaves longer blocks as written, and 0 turns the rewrite off.

## Limits

Where Claude Code loads its [built-in guard](https://code.claude.com/docs/en/plugins/mods/admin#know-which-hooks-of-a-users-mod-dont-run), on a machine with managed settings or in a session signed in to a Team or Enterprise plan, it skips the plugin's `prompt.compose` and `prompt.attachment` hooks, so the rules and the reminder exclusion do not apply there. A change to the rules reaches new sessions only, because a running session keeps the system prompt it started with. The rewrite applies to the main conversation and leaves subagents' text as written, and each rewrite is one extra request to the session's model at low effort.
