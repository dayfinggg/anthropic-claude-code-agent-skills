# Claude Code Agent Skills

English · [Українська](README.uk.md) · [Русский](README.ru.md)

A portable snapshot of the author's local Claude Code setup, synchronized on **2026-10-26**. It contains **13 engineering skills, the nova output style, and the nova mod**, plus portable settings.

Skills cover code changes, tests and defect diagnosis, security, server-side work, databases, frontend implementation, visual and UX design, architecture, implementation plans, builds and operations, commit messages, instructions for AI agents, and triage of problems on live sites and services. Every rule in a skill states when it applies, what to do, and why, followed by an example.

The nova output style keeps Claude silent between tool calls and sends one final answer in the user's language that opens with the result and usually fits in one short paragraph. Plan steps and questions to the user use the user's language too, while tool descriptions and briefs for other agents stay in English. The answer stays in plain paragraphs even when agent reports, tool results, or fetched pages arrive with tables or lists, and several rules use the wording of the built-in Concise style.

The nova mod is a Claude Code plugin with a hooks module:

- It replaces the system prompt sections for task work, tools, workflow, skills, and research with its own rule files, where every rule carries a reason and an example. The rules about task scope keep the wording of Anthropic's prompting guides for current models.
- It reminds Claude to load a matching skill when a file is edited before any skill was loaded.
- It sends a correction after a message that put text before a tool call, so progress notes stop instead of repeating.
- While agents or background commands it started are still running, it turns the desktop app's empty-reply prompt into an instruction to keep waiting, so no status message is written. It also adds to the ReadNotifications tool description that such work reports its own completion, so Claude ends the turn instead of checking notifications while it waits. On Windows it keeps the Bash tool deferred so local commands run in PowerShell.
- It adds a block of working rules to the brief of every new subagent, covering skills, tools, verification, language, and cleanup, without the output style's length limits, so agent reports stay detailed.
- It removes the parts of the Agent tool description that encourage delegating side tasks, and the bash-first guidance that suggests reading and editing files through shell commands and scripts.

The portable settings set `CLAUDE_CODE_THRIFTY_SONIC` to `0`, which turns off a Claude Code experiment that shortens the Bash tool's guidance and steers Claude toward shell commands and scripts for file work.

This is a personal configuration, not an official Anthropic distribution. Credentials, account state, chat history, projects, sessions, plugins, synced skills, caches, and machine paths are not included.

> [!WARNING]
> When your settings don't set them, the installer adds `"permissions": { "defaultMode": "bypassPermissions" }` and `"skipDangerousModePermissionPrompt": true`. Claude Code then runs every tool call without asking and skips the confirmation dialog for that mode. The [permission modes documentation](https://code.claude.com/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode) recommends this mode only for isolated environments, such as containers and virtual machines without internet access. Review [the settings](claude/settings.json) before installing, or set your own `permissions.defaultMode` first, because the installer keeps existing values.

## Install or replace an older setup

Download and extract the [ZIP archive](https://github.com/dayfinggg/anthropic-claude-code-agent-skills/archive/refs/heads/main.zip), or clone the repository:

```sh
git clone https://github.com/dayfinggg/anthropic-claude-code-agent-skills.git
cd anthropic-claude-code-agent-skills
```

Run one installer from the extracted or cloned folder. It uses the included files without downloading another copy.

### Windows

Requires Windows PowerShell 5.1 or PowerShell 7.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

### macOS and Linux

Requires a POSIX shell, `python3` for the settings merge, and a SHA-256 utility, such as `sha256sum`, `shasum`, or `openssl`.

```sh
sh scripts/install.sh
```

Restart Claude Code after installation. The mod loads through `CLAUDE_CODE_PLUGIN_DIRS`, which requires Claude Code v2.1.280 or later.

**Replace is the default.** The installer backs up and replaces all skills except `skills/synced`, all agents, the `output-styles` folder, and the `mods` folder, removing the old set. No agents are bundled, so agents from an earlier version of this setup are removed after the backup. It keeps synced skills, credentials, sessions, projects, plugins, and unrelated files. Existing settings values are preserved and missing keys are added, except `outputStyle`, which becomes `nova`, and `env.CLAUDE_CODE_PLUGIN_DIRS`, which lists the installed mod folder.

## Update

To download and install the latest GitHub revision without updating your checkout:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\update.ps1
```

```sh
sh scripts/update.sh
```

Updates require internet access, with `curl` and `tar` additionally required for the shell updater. The last install mode is reused. If you maintain a Git clone instead, run `git pull --ff-only` and rerun the installer.

## Contents and installation details

- [13 skills and their references](claude/skills)
- [nova output style](claude/output-styles/nova.md)
- [nova mod](claude/mods/nova)
- [Portable settings](claude/settings.json)
- [Installation modes, backups, and custom locations](docs/installation.md)

The payload files are copied byte for byte from the local setup. The settings copy leaves out `env.CLAUDE_CODE_PLUGIN_DIRS`, which the installer writes for each platform, and the mod's `.claude-plugin/types` folder is left out because [Claude Code generates those type definitions](https://code.claude.com/docs/en/plugins/mods/create#get-the-types-for-your-build) for the version it runs. The empty `claude/agents` folder holds only a `.gitkeep` file, so the installer still manages that folder.

Claude Code keeps its configuration in `~/.claude`, or in the folder named by `CLAUDE_CONFIG_DIR`, as described in [Environment variables](https://code.claude.com/docs/en/env-vars) and [Explore the .claude directory](https://code.claude.com/docs/en/claude-directory). Skills load from `skills/<skill-name>/SKILL.md` ([Extend Claude with skills](https://code.claude.com/docs/en/skills)), and output styles from `output-styles` ([Output styles](https://code.claude.com/docs/en/output-styles)). `CLAUDE_CODE_PLUGIN_DIRS` loads each listed folder the way `--plugin-dir` does, with absolute paths separated by `;` on Windows and `:` elsewhere ([Mods reference](https://code.claude.com/docs/en/plugins/mods/reference)).

## Verify the installers

Requires Python 3.11 or newer:

```sh
python -m unittest discover -s tests -v
```

Tests use temporary directories, not your real Claude Code setup. Available Windows PowerShell, PowerShell 7, and POSIX shell implementations are tested; unavailable runtimes are reported as skipped.

Report problems through [GitHub issues](https://github.com/dayfinggg/anthropic-claude-code-agent-skills/issues). Repository instructions and scripts use the [MIT License](LICENSE).
