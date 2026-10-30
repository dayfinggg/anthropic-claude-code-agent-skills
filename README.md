# Claude Code instructions and skills

A portable configuration for Claude Opus 5.5, Sonnet 5.5, Haiku 5.5, and Fable 5.1, synchronized with the current local setup.

The payload contains 39 engineering skills, the Concise Personal output style, the personal-instructions mod written in TypeScript, and portable settings. No custom subagent definitions or global CLAUDE.md file are installed.

The style asks for plain, natural answers in the user's language. It preserves concise complete sentences, useful lists and tables, and the user's punctuation requirements. Short answers do not reduce the completeness of research or implementation.

Claude Code loads the output style selected in settings through its standard mechanism. The mod preserves that mechanism, loads operating rules from Markdown files, and removes competing tone, communication, narration, and proactive delegation instructions. It puts selected built-in tools and Claude MCP tools behind ToolSearch without changing their input schemas or blocking calls. T3 and third-party MCP loading preferences are preserved. MCP server instructions are separate from deferred tool definitions and are not deferred by this setting.

Intermediate messages are limited to requested status, material blockers or changes, findings that change the next step, and approaches the user needs to understand beforehand. Messages outside thinking blocks follow the language of the user's request. Internal reasoning and thinking blocks have no language requirement. The mod removes the separate fixed-language reminder and selected conflicting Claude Docs instructions. It does not filter generated answers or add recurring reminders.

## Install

Requires a Claude Code build supporting mods and TypeScript hooks. The current mod was tested with Claude Code 2.1.314. Windows installers require PowerShell 5.1 or PowerShell 7. The macOS and Linux installer also requires Python 3 for settings processing.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

```sh
sh scripts/install.sh
```

Replace mode backs up and replaces custom skills, agents, output styles, and mods. It removes a legacy global CLAUDE.md file so old instructions do not compete. Credentials, sessions, projects, plugins, synced skills, and unrelated files remain in place. Existing settings are preserved, missing defaults are added, and the active style and mod location are updated. Both installation modes remove the retired skillOverrides setting after backing it up.

The portable settings enable `bypassPermissions` and skip its confirmation prompts. Review [settings.json](claude/settings.json) before installation. The default mod path uses `~/.claude/mods/personal-instructions` and the installer resolves custom destinations on the host.

Start a new Claude Code session after installation. See [installation details](docs/installation.md) for merge mode and custom destinations.

## Update

Run `scripts/update.ps1` in PowerShell or `sh scripts/update.sh` on macOS or Linux. A Git checkout can instead use `git pull --ff-only` followed by the installer. Updates reuse the last installation mode.

## Contents

- [Output style](claude/output-styles/concise-personal.md)
- [TypeScript mod](claude/mods/personal-instructions)
- [Operating rules](claude/mods/personal-instructions/rules)
- [Engineering skills](claude/skills)
- [Portable settings](claude/settings.json)

Account state, sessions, project data, caches, retired files, and cloud-synced skills are excluded. Telegram notifications remain available for future repository updates. This is an independent configuration, not an official Anthropic distribution. Prompt instructions guide behavior and do not guarantee compliance on every response.
