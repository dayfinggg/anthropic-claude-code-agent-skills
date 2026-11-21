---
name: shell
description: Load before writing, reviewing or debugging a .sh or .ps1 script or a shell command that is more than a plain read, including commands sent over ssh, and when quoting, exit codes, set -euo pipefail, a hanging prompt, Git Bash path rewriting, CRLF line endings, macOS differences or ShellCheck findings are involved. Deploys, nginx and cron on servers belong to server-ops.
---

# Shell

This skill matches Bash 5.x, PowerShell 7.7 and 7.6 LTS, ShellCheck 0.11.0 and PSScriptAnalyzer 1.25. Run `bash --version`, `$PSVersionTable.PSVersion` or `shellcheck --version` to see what is installed. Where the installed release is newer, its own `--help` and release notes are right.

## References

- Read [references/powershell.md](references/powershell.md) before you write, run or debug PowerShell, such as a `.ps1` file, `pwsh -Command` or a PowerShell tool call, and when a ParserError, cut-off `ConvertTo-Json` output or a lost exit code appears.
- Read [references/gnu-bsd.md](references/gnu-bsd.md) when a command must work on both Linux and macOS, fails only on macOS (`sed -i`, `grep -P`, `date -d`, `stat`, `xargs`), or must run under macOS `/bin/bash` 3.2.

## Check first

- Find the shell that will run the command before you write it. Claude Code's Bash tool runs `$SHELL` when it is bash or zsh (zsh is the macOS default since 10.15) and Git Bash on Windows, and `CLAUDE_CODE_SHELL` overrides it. Its PowerShell tool runs `pwsh` 7, or Windows PowerShell 5.1 when `pwsh` is missing. Check with `echo "$BASH_VERSION$ZSH_VERSION $OSTYPE"` or `$PSVersionTable.PSVersion`.
- Check whether the tools are GNU or BSD with `sed --version`, which fails on BSD. Linux and Git Bash ship GNU tools, and macOS ships BSD ones.

## Bash scripts

- A script runs under its shebang, not under the session's shell. `#!/bin/bash` on macOS is bash 3.2.57 and `#!/bin/sh` is dash on Debian and Ubuntu, so start bash scripts with `#!/usr/bin/env bash`.
- After `set -euo pipefail`, add `shopt -s inherit_errexit` on bash 4.4 or later, or a failure inside `$(...)` does not stop the script.
- Save `PIPESTATUS` on the next line, as in `rc=("${PIPESTATUS[@]}")`, because any later command, `[` included, overwrites it.
- Quote a variable inside a pattern expansion, as in `${path#"$prefix"}` (SC2295), and on the right side of `==` in `[[ ]]`, or `*`, `?` and `[` in its value act as glob characters.
- Lint with `shellcheck -x --enable=check-extra-masked-returns script.sh`, where the option adds SC2312. Where ShellCheck is missing, `uvx --from shellcheck-py==0.11.0.1 shellcheck` runs it. Lint PowerShell with `Invoke-ScriptAnalyzer -Path . -Recurse`, after `Install-PSResource PSScriptAnalyzer` where it is missing.

## Commands that hang or flood

- Turn prompts into immediate failures with `GIT_TERMINAL_PROMPT=0` for git credentials, `GCM_INTERACTIVE=0` for the Git Credential Manager window on Windows, `ssh -o BatchMode=yes` for passwords and host keys, `sudo -n`, and `apt-get -y` with `DEBIAN_FRONTEND=noninteractive`.
- Start a long job on a remote host detached, as in `setsid nohup cmd > job.log 2>&1 < /dev/null &`, so that ssh returns at once, and have the job write a marker file when it ends. Check the marker later with one short command, or watch it with the Monitor tool.
- `until ! pgrep -f pattern; do sleep 5; done` never ends when it runs through `bash -c` or `ssh`, because `pgrep -f` also matches the shell that runs the loop, whose command line holds the pattern. Wait on a process id with `timeout 600 tail --pid="$pid" -f /dev/null`, or on a marker file, with a timeout either way.
- Write the output of a build, test or lint run to a file outside the repository with `cmd > "$log" 2>&1`, keep `$?`, and then search the file. Piped into `head`, `tail` or `grep`, the run returns the filter's status and loses the lines that explain the failure, and Claude Code shows a failing command's output only as a head-and-tail excerpt of about 10,000 characters.

## Remote commands over ssh

- ssh joins its arguments into one string that the remote login shell parses again. Single-quote the whole remote command, as in `ssh host 'cd /srv/app && git status'`, and quote local values for that second parse with `printf -v q '%q' "$val"`. `%q` can emit `$'...'`, which a dash login shell does not understand, so check the remote shell with `ssh host 'echo $0'` first.
- Send a multi-line script as `printf -v q '%q' "$arg"; ssh host "bash -s -- $q" < script.sh`, so that it runs in bash and not in a login shell that may be dash or zsh. A script saved on Windows keeps CRLF line endings and fails there with `$'\r': command not found`, so convert it with `sed -i 's/\r$//'` before sending.
- Give every ssh inside a `while read` loop `-n` or `< /dev/null`, or it reads the rest of the loop's input.
- Set `-o BatchMode=yes -o ConnectTimeout=10` on scripted ssh so that a missing key or a dead host fails instead of hanging. Leave out `-o StrictHostKeyChecking=no`, which accepts any host key.

## Git Bash on Windows

- Git Bash rewrites arguments and environment values that look like POSIX paths when it starts a native Windows program, which is anything outside `/usr/bin`, such as node, python, git, gh, docker or cmd. `/foo` becomes `C:/Program Files/Git/foo`, `/F` becomes `F:/`, and `/a:/b` becomes `C:\...\a;C:\...\b`. Prefix `MSYS_NO_PATHCONV=1` to stop it for arguments and environment alike, double the leading slash (`//F`), or exclude prefixes with `MSYS2_ARG_CONV_EXCL='/api;--dir='`.
- In Git Bash, `gh api /repos/o/r` fails with "invalid API endpoint: C:/Program Files/Git/repos/o/r", so write `gh api repos/o/r`. `cmd /c dir` starts an interactive cmd, so write `cmd //c dir`, and likewise `taskkill //F //PID 123`.
- A path inside JSON, a URL, a longer string or a file stays `/c/...`. Produce it for a native Windows program with `cygpath -w "$p"` for backslashes, or with `cygpath -m "$p"` and `pwd -W` for `C:/...`.
- Native Windows programs write CRLF into pipes and files. Git Bash drops the CR in `$(...)`, but `read` keeps it, so strip it with `line=${line%$'\r'}`.
- The Git for Windows installer defaults to `core.autocrlf=true`, so scripts check out with CRLF. Git Bash still runs them, while Linux, macOS and containers fail with `/usr/bin/env: 'bash\r': No such file or directory`. Fix line endings in `.gitattributes`.
- When `LANG` is unset, as in Claude Code's Bash tool on Windows unless `~/.bashrc` sets it, `grep -P` matches bytes, so `.`, `\p{L}` and `-i` miss non-ASCII letters without any error, and a pattern with a code point above `\x{FF}` fails with "character value in \x{} or \o{} is too large". Prefix `LC_ALL=C.UTF-8`.
- On Windows `python3` often resolves to the Microsoft Store alias, which prints "Python was not found" and exits 49. Call `python`, `py -3` or `uv run python`.
- npm runs `package.json` scripts with `cmd.exe` on Windows, also when started from Git Bash, so `FOO=1 cmd`, `$VAR` and single quotes fail there. Move such logic into a Node script.
- Windows refuses to delete or rename a file that another process holds open, so `rm` reports "Device or resource busy" and `mv` reports "Permission denied". Stop the dev server, watcher or test runner that holds it first.

## Gotchas

- A delete whose path comes from a variable runs on the wrong tree when the variable is empty, so `rm -rf "$dir"/*` empties the root and `find $dir -type f -delete` empties the current directory. Write `"${dir:?}"`, which stops the command with an error instead.
- `local v="$(cmd)"` returns the status of `local`, not of `cmd`, so `set -e` misses the failure (SC2155), and `export` and `readonly` behave the same. Declare on one line and assign on the next.
- A function called as an `if` or `while` condition, or with `&&`, `||` or `!`, runs its whole body with `set -e` off, so a failing step inside it does not stop it. End each step that must stop it with `|| return`.
- A command substitution inside an argument hides its status, so with `set -e`, `cd "$(get_dir)/etc"` runs `cd /etc` when `get_dir` fails (SC2312). Assign it to a variable first.
- `! cmd` never triggers `set -e` (SC2251), so write `if cmd; then exit 1; fi`.
- A backtick inside double quotes is command substitution, so `` grep -rn "user `name`" . `` runs `name` as a command and searches for what it printed. Put a pattern with backticks or `$` in single quotes.
- `(( i++ ))` exits under `set -e` when `i` is 0, because the expression evaluates to 0. Write `i=$((i + 1))`.
- With `pipefail`, `producer | head -n1` fails with status 141 while the producer still writes, so the outcome depends on the output size. Write `head -n1 < <(producer)`.
- zsh stops a command whose glob matches nothing, so quote `pip install 'pkg[extra]'` and expect `rm -f *.tmp` to fail when no file matches. zsh also leaves an unquoted `$var` unsplit, and its arrays start at 1.

Related skills: concise:server-ops for deploys, nginx and cron on Linux servers, concise:git for `.gitattributes` and line endings, concise:github-actions for shells inside CI steps, concise:containers-iac for Dockerfile `RUN` steps and entrypoints.
