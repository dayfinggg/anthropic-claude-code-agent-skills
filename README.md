# Claude Code Agents and Skills

English · [Українська](README.uk.md) · [Русский](README.ru.md)

A portable snapshot of the author's local Claude Code setup, synchronized on **2026-10-15**. It contains **18 engineering skills, 14 specialist agents, the Brief output style, and 2 mods**, plus portable settings.

Skills cover clean and secure code, testing, documentation, architecture, design patterns, implementation plans, HTTP APIs, databases, interfaces, 3D, observability, resilient services, dependencies and CI, releases, commit messages, and LLM security. Agents provide codebase exploration, planning, web research, diagnosis, implementation, review, security audits, database analysis, documentation, test runs, and verification. The Brief output style keeps every final answer to one short, plain paragraph.

The two mods are Claude Code plugins with a hooks module:

- **brief-guard** replaces the Claude Code prompt blocks that conflict with the Brief output style. It swaps system prompt sections and reminders for the texts in its `instructions` folder, adds the author's standing rules, extends tool descriptions, carries the rules through compaction, adds a short note to every typed request, and adds reminders after tool errors, agent results, shell commands that read or write local files, text written beside a tool call, a task list that has not moved for 30 calls, and changes made before a skill's reference files or the documentation of a new language were read. In `bypassPermissions` mode it also allows every permission request that still reaches you, except `AskUserQuestion`, `EnterPlanMode`, and `ExitPlanMode`.
- **usage-line** shows plan limits, cost, and token totals above the prompt: the 5-hour and 7-day limits as gauges that change color as they fill, the session cost in US dollars, and the input, output, cache read, and cache write tokens.

This is a personal configuration, not an official Anthropic distribution. Credentials, account state, chat history, projects, sessions, plugins, synced skills, caches, and machine paths are not included.

> [!WARNING]
> When your settings don't set them, the installer adds `"permissions": { "defaultMode": "bypassPermissions" }` and `"skipDangerousModePermissionPrompt": true`. Claude Code then runs every tool call without asking and skips the confirmation dialog for that mode, and brief-guard allows the remaining permission requests. The [permission modes documentation](https://code.claude.com/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode) recommends this mode only for isolated environments, such as containers and virtual machines without internet access. Review [the settings](claude/settings.json) before installing, or set your own `permissions.defaultMode` first, because the installer keeps existing values.

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

Restart Claude Code after installation. The mods load through `CLAUDE_CODE_PLUGIN_DIRS`, which requires Claude Code v2.1.280 or later.

**Replace is the default.** The installer backs up and replaces all skills except `skills/synced`, all agents, the `output-styles` folder, and the `mods` folder, removing the old set. It keeps synced skills, credentials, sessions, projects, plugins, and unrelated files. Existing settings values are preserved and missing keys are added, except `outputStyle`, which becomes `Brief`, and `env.CLAUDE_CODE_PLUGIN_DIRS`, which lists the installed mod folders.

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

- [18 skills and their references](claude/skills)
- [14 agent definitions](claude/agents)
- [Brief output style](claude/output-styles/brief.md)
- [brief-guard](claude/mods/brief-guard) and [usage-line](claude/mods/usage-line) mods
- [Portable settings](claude/settings.json)
- [Installation modes, backups, and custom locations](docs/installation.md)

The payload files are copied byte for byte from the local setup. The settings copy leaves out `env.CLAUDE_CODE_PLUGIN_DIRS`, which the installer writes for each platform, and each mod's `.claude-plugin/types` folder is left out because [Claude Code generates those type definitions](https://code.claude.com/docs/en/plugins/mods/create#get-the-types-for-your-build) for the version it runs.

Claude Code keeps its configuration in `~/.claude`, or in the folder named by `CLAUDE_CONFIG_DIR`, as described in [Environment variables](https://code.claude.com/docs/en/env-vars) and [Explore the .claude directory](https://code.claude.com/docs/en/claude-directory). Personal subagents load from its `agents` folder ([Create custom subagents](https://code.claude.com/docs/en/sub-agents)), skills from `skills/<skill-name>/SKILL.md` ([Extend Claude with skills](https://code.claude.com/docs/en/skills)), and output styles from `output-styles` ([Output styles](https://code.claude.com/docs/en/output-styles)). `CLAUDE_CODE_PLUGIN_DIRS` loads each listed folder the way `--plugin-dir` does, with absolute paths separated by `;` on Windows and `:` elsewhere ([Mods reference](https://code.claude.com/docs/en/plugins/mods/reference)).

## Verify the installers

Requires Python 3.11 or newer:

```sh
python -m unittest discover -s tests -v
```

Tests use temporary directories, not your real Claude Code setup. Available Windows PowerShell, PowerShell 7, and POSIX shell implementations are tested; unavailable runtimes are reported as skipped.

Report problems through [GitHub issues](https://github.com/dayfinggg/anthropic-claude-code-agent-skills/issues). Repository instructions and scripts use the [MIT License](LICENSE).
