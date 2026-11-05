# Claude Code agent setup

Personal skills, operating rules, and settings for Claude Code with Opus 5.5, Sonnet 5.5, Haiku 5.5, and Fable 5.1. The same files run on Windows, macOS, and Linux.

## What gets installed

Into `~/.claude` (or `CLAUDE_CONFIG_DIR` when set):

- `skills/` with the engineering skills.
- `mods/personal-instructions/` with a TypeScript mod that loads the operating rules and the [Communication rules](claude/mods/personal-instructions/rules/communication.md) into the system prompt and sends short reminders during long sessions.
- `settings.json` values merged into your existing settings. They enable `bypassPermissions`, so read [settings.json](claude/settings.json) before installing.

## Warning

The installer deletes the `skills`, `agents`, `output-styles`, and `mods` directories in the destination and replaces them with the ones from this repository. Any skills, agents, output styles, or mods of your own that live there stop loading. The installer moves them to `.anthropic-claude-code-agent-skills-backups/<timestamp>` inside the destination before deleting, and it prints that path. Sessions, projects, credentials, plugins, cloud-synced skills, and other files are not touched. The installer also removes a global `CLAUDE.md` in the destination and a saved `outputStyle` selection, both backed up to the same place.

## Install

Windows (PowerShell 5.1 or 7):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

macOS and Linux (needs `python3`):

```sh
sh scripts/install.sh
```

Restart Claude Code afterwards.

## Update

`scripts/update.ps1` on Windows or `sh scripts/update.sh` on macOS and Linux downloads the latest version and runs the installer again, with the same warning.

Not an official Anthropic distribution. Instructions guide behavior and do not guarantee it on every response.
