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

Each bundled skill keeps its upstream license and attribution. This is not an official Anthropic distribution. Instructions guide behavior but do not guarantee compliance on every response.
