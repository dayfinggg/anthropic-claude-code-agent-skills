# Claude Code instructions and skills

A portable configuration for Claude Opus 5.5, Sonnet 5.5, Haiku 5.5, and Fable 5.1, synchronized with the current local setup.

The payload contains 41 engineering skills, the personal-instructions mod written in TypeScript, and portable settings. No output style, custom subagent definitions, or global CLAUDE.md file are installed. The former Concise Personal output style was retired on 2026-11-05 and its requirements now live in the system prompt as the Communication section, loaded by the mod from [communication.md](claude/mods/personal-instructions/rules/communication.md).

The Communication section asks for plain, natural answers in the user's language. It limits text before and between tool calls to requested status, material blockers or changes, findings that change the next step, and approaches the user must understand beforehand, and it names the step announcements that belong in thinking instead. It sets the size of completion reports, the paragraph format, the punctuation requirements, the evidence standard, and the closing paragraphs for unfinished work, with three complete examples. Thinking blocks have no language requirement. Short answers do not reduce the completeness of research or implementation.

The mod replaces the native communication section with that file, loads the other operating rules from Markdown files, and removes competing tone, narration, and proactive delegation instructions. It puts selected built-in tools and Claude MCP tools behind ToolSearch without changing their input schemas or blocking calls. T3 and third-party MCP loading preferences are preserved. MCP server instructions are separate from deferred tool definitions and are not deferred by this setting. The mod replaces the native fixed-language attachment, when present, with a request-language instruction and removes selected conflicting Claude Docs instructions. It does not filter generated answers.

Two reminders support long sessions, both delivered through PostToolBatch before the next model request and only for the main agent. The periodic reminder arrives after the fifth nonempty tool batch of a prompt and then every tenth batch. The targeted note arrives once after a response that put a text block before a tool call, at most twice per prompt and at least three batches apart, and it is decided from the shape of the response alone, without language detection. Parallel tools count as one batch, duplicate batches do not advance the count, and subagents and downstream stop decisions are excluded. Session-keyed tracking survives resume and is cleared when the session is cleared. The thresholds are heuristics, not measured guarantees. Neither reminder requests extra work or status narration, and neither revises an answer already sent.

## Install

Requires a Claude Code build supporting mods and TypeScript hooks. The current mod was tested with Claude Code 2.1.316. Windows installers require PowerShell 5.1 or PowerShell 7. The macOS and Linux installer also requires Python 3 for settings processing.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

```sh
sh scripts/install.sh
```

Replace mode backs up and replaces custom skills, agents, output styles, and mods. It removes a legacy global CLAUDE.md file so old instructions do not compete. Credentials, sessions, projects, plugins, synced skills, and unrelated files remain in place. Existing settings are preserved, missing defaults are added, and the mod location is updated. Both installation modes remove the retired skillOverrides and outputStyle settings after backing them up, so the retired Concise Personal style is no longer selected.

The portable settings enable `bypassPermissions` and skip its confirmation prompts. Review [settings.json](claude/settings.json) before installation. The default mod path uses `~/.claude/mods/personal-instructions` and the installer resolves custom destinations on the host.

Start a new Claude Code session after installation. See [installation details](docs/installation.md) for merge mode and custom destinations.

## Update

Run `scripts/update.ps1` in PowerShell or `sh scripts/update.sh` on macOS or Linux. A Git checkout can instead use `git pull --ff-only` followed by the installer. Updates reuse the last installation mode.

## Contents

- [Communication rules](claude/mods/personal-instructions/rules/communication.md)
- [TypeScript mod](claude/mods/personal-instructions)
- [Operating rules](claude/mods/personal-instructions/rules)
- [Engineering skills](claude/skills)
- [Portable settings](claude/settings.json)

Account state, sessions, project data, caches, retired files, and cloud-synced skills are excluded. Telegram notifications remain available for future repository updates. This is an independent configuration, not an official Anthropic distribution. Prompt instructions guide behavior and do not guarantee compliance on every response.
