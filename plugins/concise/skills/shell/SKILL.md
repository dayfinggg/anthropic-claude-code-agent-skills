---
name: shell
description: Shell commands and scripts in Bash, zsh, sh and PowerShell 7 on Linux, macOS and Windows with Git Bash, including commands run on a remote host over ssh. Use when writing, reviewing or debugging a .sh or .ps1 script or a one-line command, for quoting, exit codes, set -euo pipefail or $LASTEXITCODE, when a command hangs on a prompt, Git Bash rewrites a path, a script fails with "bash\r", or ShellCheck or PSScriptAnalyzer reports a finding.
---

# Shell

This skill covers Bash, zsh, POSIX sh and PowerShell commands and scripts, run locally or over ssh. It matches Bash 5.x, PowerShell 7.7 and 7.6 LTS, ShellCheck 0.11.0 and PSScriptAnalyzer 1.25. See the versions with `bash --version`, `$PSVersionTable.PSVersion` and `shellcheck --version`. Where the installed release is newer, its own `--help` and release notes are right.

## Check first

- Find the shell that runs the command. Claude Code's Bash tool runs `$SHELL` when it is bash or zsh (zsh on macOS 10.15 and later), Git Bash on Windows, and `CLAUDE_CODE_SHELL` overrides it. Its PowerShell tool runs `pwsh` 7, or Windows PowerShell 5.1 when `pwsh` is missing. Check with `echo "$BASH_VERSION$ZSH_VERSION $OSTYPE"` or `$PSVersionTable.PSVersion`.
- A script runs under its shebang, not the session shell. `#!/bin/bash` on macOS is bash 3.2.57, and `#!/bin/sh` is dash on Debian and Ubuntu. Write `#!/usr/bin/env bash` for bash scripts.
- `sed --version` fails on BSD tools. Linux and Git Bash ship GNU tools, macOS ships BSD ones.
- Lint bash with `shellcheck -x --enable=check-extra-masked-returns script.sh` (the option adds SC2312). Where ShellCheck is missing, `uvx --from shellcheck-py==0.11.0.1 shellcheck` runs it. Lint `.ps1` with `Invoke-ScriptAnalyzer -Path script.ps1`.

## Bash scripts

- Start bash scripts with `set -euo pipefail` and, on bash 4.4 or later, `shopt -s inherit_errexit`. Without it a failure inside `$(...)` does not stop the script.
- Read command output with `while IFS= read -r line; do ...; done < <(cmd)` or `readarray -t lines < <(cmd)`. In `cmd | while ...` the loop runs in a subshell, so variables it sets are lost.
- Save `PIPESTATUS` on the next line, as `rc=("${PIPESTATUS[@]}")`. Any later command, `[` included, overwrites it.
- Quote a variable inside a pattern expansion: `${path#"$prefix"}` (SC2295). Unquoted, `[`, `*` or `?` in `$prefix` act as glob characters. The right side of `==` in `[[ ]]` is a pattern the same way unless quoted.

## Commands that hang or flood

- Make prompts fail at once instead of waiting for input that never comes: `GIT_TERMINAL_PROMPT=0` for git credential prompts, `GCM_INTERACTIVE=0` for the Git Credential Manager window on Windows, `ssh -o BatchMode=yes` for passwords and host keys, `sudo -n`, and `apt-get -y` with `DEBIAN_FRONTEND=noninteractive`.
- Start a command that never exits (dev server, `--watch`, `tail -f`) in the background and read its output file. In the foreground it blocks until the tool timeout and then moves to the background anyway.
- Do not pipe a build, test or lint run into `head`, `tail` or `grep`. The pipeline returns the filter's status and drops the lines that explain the failure. Write the full output to a file outside the repository (`cmd > "$log" 2>&1`), keep `$?`, then search the file. Claude Code shows a failing command's output only as a head and tail excerpt of about 10,000 characters.

## Remote commands over ssh

- ssh joins its arguments into one string that the remote login shell parses again. Single-quote the whole remote command, `ssh host 'cd /srv/app && git status'`, and quote local values for that second parse with `printf -v q '%q' "$val"`. `%q` can emit `$'...'`, which a dash login shell does not understand, so check the remote shell with `ssh host 'echo $0'` first.
- Run a multi-line script with `printf -v q '%q' "$arg"; ssh host "bash -s -- $q" < script.sh` instead of a quoted here-doc, so the script runs in bash rather than the login shell, which may be dash or zsh.
- `ssh` inside a `while read` loop reads the rest of the loop's input. Pass `ssh -n` or `< /dev/null` to every ssh in a loop.
- Set `-o BatchMode=yes -o ConnectTimeout=10` on scripted ssh so a missing key or a dead host fails instead of hanging. Never add `-o StrictHostKeyChecking=no`, which accepts any host key.
- A script written on Windows and fed to `bash -s` keeps its CRLF line endings and fails with `$'\r': command not found`. Convert with `sed -i 's/\r$//'` locally before sending.

## Git Bash on Windows

- Git Bash rewrites arguments and environment values that look like POSIX paths when it starts a native Windows program (anything outside `/usr/bin`, such as node, python, git, gh, docker or cmd). `/foo` becomes `C:/Program Files/Git/foo`, `/F` becomes `F:/`, and `/a:/b` becomes `C:\...\a;C:\...\b`. Prefix `MSYS_NO_PATHCONV=1` to stop it for arguments and environment alike, double the leading slash (`//F`), or exclude prefixes with `MSYS2_ARG_CONV_EXCL='/api;--dir='`.
- In Git Bash, `gh api /repos/o/r` fails with "invalid API endpoint: C:/Program Files/Git/repos/o/r", so write `gh api repos/o/r`. `cmd /c dir` starts an interactive cmd, so write `cmd //c dir`, and likewise `taskkill //F //PID 123`.
- A path inside JSON, a URL, a longer string or a file stays `/c/...`. Produce it for a native Windows program with `cygpath -w "$p"` (backslashes) or `cygpath -m "$p"` and `pwd -W` (`C:/...`).
- Native Windows programs write CRLF into pipes and files. Git Bash drops the CR in `$(...)`, but `read` keeps it, so strip it with `line=${line%$'\r'}`.
- The Git for Windows installer defaults to `core.autocrlf=true`, so scripts check out with CRLF. Git Bash still runs them, while Linux, macOS and containers fail with `/usr/bin/env: 'bash\r': No such file or directory`. Fix line endings in `.gitattributes`.
- When `LANG` is unset, as in Claude Code's Bash tool on Windows unless `~/.bashrc` sets it, `grep -P` fails with "supports only unibyte and UTF-8 locales" and `.` does not match non-ASCII text. Prefix `LC_ALL=C.UTF-8`.
- On Windows `python3` often resolves to the Microsoft Store alias, which prints "Python was not found" and exits 49. Call `python`, `py -3` or `uv run python`.
- npm runs `package.json` scripts with `cmd.exe` on Windows, also when started from Git Bash, so `FOO=1 cmd`, `$VAR` and single quotes fail there. Move such logic into a Node script.
- Windows refuses to delete or rename a file another process holds open: `rm` reports "Device or resource busy" and `mv` "Permission denied". Stop the dev server, watcher or test runner that holds it first.

## Gotchas

- `local v="$(cmd)"` returns the status of `local`, not of `cmd`, so `set -e` misses the failure (SC2155). The same holds for `export` and `readonly`. Declare on one line, assign on the next.
- A function called as an `if` or `while` condition, or with `&&`, `||` or `!`, runs with `set -e` off for its whole body.
- A command substitution inside an argument hides its status. With `set -e`, `cd "$(get_dir)/etc"` runs `cd /etc` when `get_dir` fails (SC2312). Assign to a variable first.
- `! cmd` never triggers `set -e` (SC2251). Write `if cmd; then exit 1; fi`.
- `set -e; i=0; (( i++ ))` exits, because the expression evaluates to 0. Write `i=$((i + 1))`.
- With `pipefail`, `producer | head -n1` fails with status 141 while the producer still writes, so the outcome depends on output size. Write `head -n1 < <(producer)`.
- zsh reports an error for a glob that matches nothing and skips the command, so quote `pip install 'pkg[extra]'`, and `rm -f *.tmp` fails when no file matches. zsh does not split an unquoted `$var` into words, and its arrays start at 1.

## References

- [references/powershell.md](references/powershell.md): read when writing, running or debugging PowerShell (`.ps1`, `pwsh -Command`, the PowerShell tool), on a ParserError, cut-off `ConvertTo-Json` output, a lost exit code, or when choosing a PowerShell version.
- [references/gnu-bsd.md](references/gnu-bsd.md): read when a command must work on both Linux and macOS, when it fails on macOS only (`sed -i`, `grep -P`, `date -d`, `stat`, `xargs`), or when a script must run on macOS `/bin/bash` 3.2.

Related skills: concise:server-ops for deploys, nginx and cron on Linux servers, concise:git for `.gitattributes` and line endings, concise:github-actions for shells inside CI steps, concise:containers-iac for Dockerfile `RUN` steps and entrypoints.
