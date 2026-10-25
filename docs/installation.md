# Install, replace, and restore the Claude Code setup

## Choose an installation mode

Run these commands from the repository folder.

Replace mode is the default. It backs up and replaces all skills, agents, output styles, and mods, including files you added yourself. No agents are bundled, so Replace mode leaves the `agents` folder empty apart from a `.gitkeep` file. It keeps `skills/synced`, where Claude Code stores skills synced from claude.ai, and `skills/.trash`, where Claude Code keeps synced skills it removed.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

```sh
sh scripts/install.sh
```

To keep unrelated skills, agents, output styles, and mods, choose Merge:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1 -Mode Merge
```

```sh
sh scripts/install.sh --merge
```

Merge still replaces the bundled skill folders, `output-styles/nova.md`, and the `mods/nova` folder. It leaves agents from an earlier version of this setup in place, so remove them yourself if you no longer want them. Updates reuse the last installation mode.

## Choose the destination

Both installers and updaters honor `CLAUDE_CONFIG_DIR`, the variable Claude Code reads for its configuration folder. Without it they use `~/.claude`, which is `%USERPROFILE%\.claude` on Windows.

To try the setup in a separate folder without changing your active configuration:

```powershell
$env:CLAUDE_CONFIG_DIR = Join-Path $env:TEMP "claude-agents-preview"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1
Remove-Item Env:CLAUDE_CONFIG_DIR
```

```sh
CLAUDE_CONFIG_DIR="$HOME/claude-agents-preview" sh scripts/install.sh
```

The PowerShell installer accepts `-Source` for a local payload folder containing `settings.json`, `skills`, `agents`, `output-styles`, and `mods`. The shell equivalent is `CLAUDE_SKILLS_SOURCE`. The default source is the repository's `claude` folder.

Both installers stop before changing anything when the payload is incomplete, when the source and destination are the same folder, when `skills`, `agents`, `output-styles`, or `mods` in the destination is a symbolic link, or when the source is inside one of these folders.

## Understand settings changes

The installer reads the existing `settings.json` before changing anything and stops when the file isn't valid JSON or doesn't hold a JSON object. It backs up the old file, keeps existing values at every level, and adds missing keys from [the portable settings](../claude/settings.json). Two values are always written:

- `outputStyle` is set to `nova`, the name of the [nova output style](../claude/output-styles/nova.md).
- `env.CLAUDE_CODE_PLUGIN_DIRS` lists the installed `mods/nova` folder as an absolute path, with entries separated by `;` on Windows and `:` elsewhere. Replace mode writes exactly this folder. Merge mode keeps the existing entries and appends the bundled folder when they don't name it yet, also recognizing an entry that names it with `~`.

> [!WARNING]
> When your settings don't set them, the installer adds `"permissions": { "defaultMode": "bypassPermissions" }` and `"skipDangerousModePermissionPrompt": true`. With [`permissions.defaultMode`](https://code.claude.com/docs/en/settings-reference#permissions-defaultmode) set to `bypassPermissions`, Claude Code runs everything without asking, and [`skipDangerousModePermissionPrompt`](https://code.claude.com/docs/en/settings-reference#skipdangerousmodepermissionprompt) skips the confirmation dialog before a session enters that mode. [Choose a permission mode](https://code.claude.com/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode) recommends `bypassPermissions` only for isolated environments, such as containers and virtual machines without internet access. To keep permission prompts, set `permissions.defaultMode` in your settings before you install, or edit the portable settings.

The portable settings also hide commit and pull request attribution, block the claude.ai Gmail, Google Calendar, and Google Drive connectors, turn off auto memory, and select the fullscreen terminal renderer. Existing model choices, permissions, MCP servers, hooks, and plugins are not reset to the author's defaults.

The shell installer uses `python3` for this merge and stops before changing anything when `python3` is missing. Windows PowerShell 5.1 writes the merged file with its own JSON indentation, and the values are the same.

## Restore from a backup

Each run that replaces existing files prints its backup folder under `.anthropic-claude-code-agent-skills-backups/` in the destination. Install and update use the same location with a unique folder per run.

1. Close Claude Code.
2. Open the backup folder printed by the run you want to undo.
3. Replace the installed `skills`, `agents`, `output-styles`, and `mods` folders with their backed-up copies. Keep the active `skills/synced` folder.
4. Restore `settings.json` if it exists in that backup. If a managed folder or `settings.json` didn't exist before installation, remove the newly installed copy instead.
5. Restart Claude Code.

Backups may contain your private settings. Keep them local and don't upload them to GitHub.

## Update from a different source

The network updaters accept `CLAUDE_SKILLS_REPO` in `owner/repository` form and `CLAUDE_SKILLS_BRANCH` for a branch or revision. Defaults are `dayfinggg/anthropic-claude-code-agent-skills` and `main`. Only use a repository you trust, because its installer runs locally.

The updater records the downloaded revision in `.anthropic-claude-code-agent-skills.version`. Installed payload hashes, including agents, the output style, and mods, are recorded in `.anthropic-claude-code-agent-skills.manifest`. The installation mode is stored in `.anthropic-claude-code-agent-skills.install-mode`.
