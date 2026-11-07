This repository distributes the Concise plugin for Claude Code. It includes 21 engineering skills, the Concise output style, and coding instructions.

Install the plugin with Claude Code's plugin manager.

```sh
claude plugin install concise --marketplace dayfinggg/anthropic-claude-code-agent-skills
```

Restart Claude Code after installation. Update the marketplace and plugin with these commands.

```sh
claude plugin marketplace update concise
claude plugin update concise@concise
```

The plugin lives in `plugins/concise`. Installation does not replace your personal skills, global instructions, permissions, or language settings.

Each skill keeps its entry point in `SKILL.md`, guidance in `references`, runnable helpers in `scripts`, and reusable examples in `assets`.

Each skill's `references/credits.md` preserves its source attribution and redistribution terms. This is not an official Anthropic distribution. Instructions guide behavior but do not guarantee compliance on every response.
