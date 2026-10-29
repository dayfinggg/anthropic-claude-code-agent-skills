# Installation

The default destination is `~/.claude`. Both installers honor `CLAUDE_CONFIG_DIR`. The PowerShell installer accepts `-Source` and the shell installer accepts `CLAUDE_SKILLS_SOURCE` for a different local payload directory.

Run `scripts/install.ps1` in PowerShell or `sh scripts/install.sh` on macOS or Linux. The default Replace mode backs up and replaces custom skills, agents, output styles, and mods. It backs up and removes a legacy global `CLAUDE.md`. Synced skills, local trash, account state, sessions, project data, plugins, and unrelated files remain intact.

PowerShell `-Mode Merge` and shell `--merge` preserve unrelated entries and global `CLAUDE.md`. Bundled directories are still updated. Both modes preserve existing settings values, add missing defaults, select `Concise Personal`, and connect the installed mod. Replace mode replaces the configured mod directory list. Merge mode appends missing bundled mods. Existing settings can therefore retain intentional host-specific overrides.

For the default destination, the installed mod location is `~/.claude/mods/personal-instructions`. A custom destination uses its resolved host-native path. The mod resolves its Markdown rule files relative to its installation directory. Claude Code independently loads the output style selected in settings.

The settings enable `bypassPermissions` and skip its confirmation prompts. Review the portable settings before installation. No custom subagent roles are declared. The empty agents marker keeps the installer directory available in Git archives.

Installers print the backup location under `.anthropic-claude-code-agent-skills-backups` inside the destination. To restore an earlier setup, use the files in that specific backup and preserve unrelated account and session data.

The updater downloads the default branch, verifies the archive layout, and reuses the last installation mode. Shell installation requires Python 3, and shell updates require curl and tar. The local installer needs no network access. Start a new Claude Code session to load changed prompt and style files.
