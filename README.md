# Claude Code Agent Skills

English · [Українська](README.uk.md) · [Русский](README.ru.md)

A portable copy of the author's Claude Code setup for Claude Opus 5.5. It installs 33 engineering skills, one subagent, the Concise output style, the oortveil mod, and the settings that tie them together.

This is a personal configuration, not an official Anthropic distribution. Credentials, account state, chat history, projects, sessions, plugins, synced claude.ai skills, caches, and machine paths are not included.

> [!WARNING]
> The portable settings turn off permission prompts. When your settings don't set them, the installer adds `"permissions": { "defaultMode": "bypassPermissions" }`, `"skipDangerousModePermissionPrompt": true`, and `env.CLAUDE_CODE_EVEN_MORE_DANGEROUSLY_SKIP_PERMISSIONS` set to `1`. Claude Code then runs every tool call without asking, skips the confirmation before it enters that mode, and also runs `rm` commands that Claude Code treats as dangerous without a prompt. The [permission modes documentation](https://code.claude.com/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode) recommends bypass mode only for isolated environments, such as containers and virtual machines without internet access. Review [the settings](claude/settings.json) before you install, or set your own values first, because the installer keeps existing values.

## What the setup changes

The Concise output style keeps Claude silent between tool calls. The final answer reads like a short news report: the result first, then a few short paragraphs in plain words, without lists, headings, bold labels, dashes, or semicolons. Everything the user reads, including command descriptions and task list items, is in the language the user writes in. The style file overrides the built-in Concise style by name.

The oortveil mod is a Claude Code plugin with one hooks module. It loads through `CLAUDE_CODE_PLUGIN_DIRS` and does the following:

- It defers ten rarely used built-in tools behind tool search, so their schemas leave the context until the model asks for them.
- It replaces system prompt sections with the rule files in [`prompt/`](claude/mods/oortveil/prompt). An empty file removes a section, which is how the mod drops the default instruction to announce each step. The coding rules cover scope, design principles such as DRY, KISS, YAGNI, and SOLID, code without comments, security, grounding against hallucinated APIs and packages, and clarifying questions.
- It adds short reminders from [`reminders/`](claude/mods/oortveil/reminders) at the moments they apply: before each reply, in the descriptions of the shell, skill, and task list tools, and before each request, where it asks the model to check every listed skill.
- After each tool call it reminds the model of the language named in the `language` setting. When the user writes in a non-Latin script and the final answer is mostly Latin, it sends the answer back to be written again. It hides from the screen a one-line message in Latin script, the short English note Claude Opus 5.5 sometimes writes before a tool call. The model and the transcript keep that line.
- It adds the output style, the prompt rules, and the user's language to the brief of every subagent except forks, which already inherit the main prompt.
- It lists skills that use `paths` in the skill listing from the start, so they also apply when work happens outside the working directory.

The portable settings also set `language`, keep built-in and claude.ai skills in the listing by name only through `skillOverrides`, hide commit and pull request attribution, block the claude.ai Gmail, Google Calendar, and Google Drive connectors, and turn off the silent turn reminder, away summary, remote recap, and auto memory.

## Install or replace an older setup

Download and extract the [ZIP archive](https://github.com/dayfinggg/anthropic-claude-code-agent-skills/archive/refs/heads/main.zip), or clone the repository:

```sh
git clone https://github.com/dayfinggg/anthropic-claude-code-agent-skills.git
cd anthropic-claude-code-agent-skills
```

Run one installer from the extracted or cloned folder. It uses the included files and downloads nothing.

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

Restart Claude Code after installation. The mod requires Claude Code v2.1.280 or later.

Replace is the default mode. The installer backs up and replaces all skills except `skills/synced`, all agents, the `output-styles` folder, and the `mods` folder. It keeps synced skills, credentials, sessions, projects, plugins, and unrelated files. Existing settings values stay and missing keys are added, except `outputStyle`, which becomes `Concise`, and `env.CLAUDE_CODE_PLUGIN_DIRS`, which lists the installed mod folder. The `language` setting is `russian` in the portable settings, so set your own language before you install, or change it afterwards.

## Update

To download and install the latest GitHub revision without updating your checkout:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\update.ps1
```

```sh
sh scripts/update.sh
```

Updates require internet access, and the shell updater also needs `curl` and `tar`. The last install mode is reused. If you keep a Git clone instead, run `git pull --ff-only` and rerun the installer.

## Contents and installation details

- [33 skills and their references](claude/skills)
- [poteto-agent subagent](claude/agents/poteto-agent.md)
- [Concise output style](claude/output-styles/concise.md)
- [oortveil mod](claude/mods/oortveil)
- [Portable settings](claude/settings.json)
- [Installation modes, backups, and custom locations](docs/installation.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)

Most skills and the subagent are adapted from [pstack](https://github.com/cursor/plugins/tree/main/pstack) by Lauren Tan and [skills](https://github.com/mattpocock/skills) by Matt Pocock, both under the MIT License. [Third-party notices](THIRD_PARTY_NOTICES.md) lists which skill comes from where and keeps the original license texts.

The settings copy leaves out `env.CLAUDE_CODE_PLUGIN_DIRS`, which the installer writes for each platform. The mod's `.claude-plugin/types` folder is left out because [Claude Code generates those type definitions](https://code.claude.com/docs/en/plugins/mods/create#get-the-types-for-your-build) for the version it runs.

Claude Code keeps its configuration in `~/.claude`, or in the folder named by `CLAUDE_CONFIG_DIR`, as [Environment variables](https://code.claude.com/docs/en/env-vars) describes. Skills load from `skills/<skill-name>/SKILL.md` ([Extend Claude with skills](https://code.claude.com/docs/en/skills)), and output styles load from `output-styles` ([Output styles](https://code.claude.com/docs/en/output-styles)).

## Verify the installers

Requires Python 3.11 or newer:

```sh
python -m unittest discover -s tests -v
```

The tests use temporary directories, not your real Claude Code setup. They run every available Windows PowerShell, PowerShell 7, and POSIX shell and report the missing ones as skipped.

The previous setup, with the nova output style and mod, is kept in the [`legacy` branch](https://github.com/dayfinggg/anthropic-claude-code-agent-skills/tree/legacy). Report problems through [GitHub issues](https://github.com/dayfinggg/anthropic-claude-code-agent-skills/issues). Repository instructions and scripts use the [MIT License](LICENSE).
