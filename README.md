This repository distributes the Concise plugin for Claude Code. It includes 22 engineering skills, the Concise output style, and coding instructions.

Install the plugin with Claude Code's plugin manager.

```sh
claude plugin install concise --marketplace dayfinggg/anthropic-claude-code-agent-skills
```

Restart Claude Code after installation. Update the marketplace and plugin with these commands.

```sh
claude plugin marketplace update concise
claude plugin update concise@concise
```

The file `settings.example.json` holds the author's optional Claude Code settings, such as high effort and memory, recaps, tips, and surveys turned off. Copy the keys you want into `~/.claude/settings.json`, and add `language` to set the reply language. The example leaves permission settings out, so your own permission mode stays in force.

The plugin lives in `plugins/concise`. Installation does not replace your personal skills, global instructions, permissions, or language settings.

Each skill keeps its entry point in `SKILL.md`, guidance in `references`, runnable helpers in `scripts`, and reusable examples in `assets`.

The plugin's `LICENSE` preserves source attribution and redistribution terms in one place. This is not an official Anthropic distribution. Instructions guide behavior but do not guarantee compliance on every response.
