---
name: shell
description: Writing and running shell commands and scripts in Bash, zsh, sh and PowerShell 7 on Windows with Git Bash, Linux and macOS. Use when writing, reviewing or debugging a .sh, .bash or .ps1 script or a one-line command, for quoting, pipes, exit codes, set -euo pipefail, $ErrorActionPreference or $LASTEXITCODE, when a command works on Linux but fails on macOS or Windows (sed -i, grep -P, date -d, stat, xargs), when Git Bash turns an argument into "C:/Program Files/Git/...", a script fails with "bash\r", PowerShell reports a ParserError, ConvertTo-Json output is cut off, python3 prints "Python was not found", a delete fails with "Device or resource busy", a package.json script fails on Windows, a command hangs on a password or sign-in, or long output must be read. Also for ShellCheck and PSScriptAnalyzer findings.
---

## Check first

- Find the shell that runs the command. Claude Code's Bash tool runs `$SHELL` when it is bash or zsh, unless `CLAUDE_CODE_SHELL` overrides it: zsh on macOS 10.15 and later, Git Bash (MSYS2 bash) on Windows. Its PowerShell tool runs `pwsh` 7, or Windows PowerShell 5.1 when `pwsh` is missing. Check with `echo "$BASH_VERSION$ZSH_VERSION $OSTYPE"` or `$PSVersionTable.PSVersion`.
- A script runs under its shebang, not the session shell. `#!/bin/bash` on macOS is bash 3.2.57, and `#!/bin/sh` is dash on Debian and Ubuntu. Write `#!/usr/bin/env bash` for bash scripts.
- `sed --version` fails on BSD tools. Linux and Git Bash ship GNU tools, macOS ships BSD ones.
- Lint bash with ShellCheck 0.11.0 (`shellcheck -x script.sh`, or `uvx --from shellcheck-py==0.11.0.1 shellcheck` where it is missing) and add `--enable=check-extra-masked-returns` for SC2312. Lint `.ps1` with PSScriptAnalyzer 1.25 (`Invoke-ScriptAnalyzer -Path script.ps1`).
- PowerShell 7.7.0 (2026-11-10, .NET 11) is current, 7.6 is the LTS until 2028-11-14, and 7.4 and 7.5 reached end of support on 2026-11-10.
- Current PowerShell stable and LTS tags: https://raw.githubusercontent.com/PowerShell/PowerShell/master/tools/metadata.json
- Facts verified 2026-11.

## Defaults

- Start bash scripts with `set -euo pipefail` and, on bash 4.4 or later, `shopt -s inherit_errexit`. Without it a failure inside `$(...)` does not stop the script.
- Read command output with `while IFS= read -r line; do ...; done < <(cmd)` or `readarray -t lines < <(cmd)`. In `cmd | while ...` the loop runs in a subshell, so variables it sets are lost.
- Save `PIPESTATUS` on the next line, as `rc=("${PIPESTATUS[@]}")`. Any later command, `[` included, overwrites it.
- Make a PowerShell script fail fast:

```powershell
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
Set-StrictMode -Version 3.0
```

- Without the second line (PowerShell 7.4 and later), a native command that exits non-zero never stops the script, even under `Stop`. Pin `-Version 3.0`, because `Latest` gets stricter with new releases.
- End a `.ps1` or `pwsh -Command` whose caller needs a native command's status with `exit $LASTEXITCODE`. `pwsh -File` exits 0 after normal termination, and `-Command` returns only 0 or 1, taken from the last statement.
- Git Bash converts an argument that starts with a POSIX path, also after `=`, `@` or a short option such as `-I`, and environment values. A path inside JSON, a URL, a longer string or a file stays `/c/...`, so produce it for a native Windows program with `cygpath -w "$p"` (backslashes) or `cygpath -m "$p"` and `pwd -W` (`C:/...`).
- Start a command that never exits (dev server, `--watch`, `tail -f`) in the background and read its output. In the foreground it blocks until the tool timeout and is then moved to the background anyway.
- Do not pipe a build, test or lint run into `head`, `tail` or `grep`. The pipeline returns the filter's status and drops the lines that explain the failure. Write the full output to a file outside the repository (`cmd > "$log" 2>&1`), keep `$?`, then search the file. A failing command's tool result keeps only about 10,000 characters of head and tail.
- Make prompts fail at once instead of waiting for input that never comes: `GIT_TERMINAL_PROMPT=0` for git credential prompts, `GCM_INTERACTIVE=0` for the Git Credential Manager sign-in window on Windows, `ssh -o BatchMode=yes` for passwords and host keys, and `sudo -n`.
- Shells inside CI steps are in concise:github-actions, container `RUN` steps and entrypoints in concise:containers-iac.

## Gotchas

- `local v="$(cmd)"` returns the status of `local`, not of `cmd`, so `set -e` misses the failure (SC2155). The same holds for `export` and `readonly`. Declare on one line, assign on the next.
- A function called as an `if` or `while` condition, or with `&&`, `||` or `!`, runs with `set -e` off for its whole body.
- A command substitution inside an argument hides its status. With `set -e`, `cd "$(get_dir)/etc"` runs `cd /etc` when `get_dir` fails (SC2312). Assign to a variable first.
- `! cmd` never triggers `set -e`, whether `cmd` fails or succeeds (SC2251). Write `if cmd; then exit 1; fi`.
- `set -e; i=0; (( i++ ))` exits, because the expression evaluates to 0. Write `i=$((i + 1))`.
- With `pipefail`, `producer | head -n1` fails with status 141 while the producer still writes, so the outcome depends on output size. Write `head -n1 < <(producer)`.
- `${path#$prefix}` treats `$prefix` as a glob, so `[`, `*` or `?` in it break the match. Quote the inner expansion, `${path#"$prefix"}` (SC2295). The right side of `==` in `[[ ]]` is a pattern the same way unless quoted.
- macOS `/bin/bash` 3.2 lacks `readarray` and `mapfile`, associative arrays and `${v,,}` (bash 4.0) and `inherit_errexit` (4.4). Before 4.4, `"${arr[@]}"` of an empty array fails as unbound under `set -u`.
- zsh, the Bash tool's shell on macOS, reports an error for a glob that matches nothing and skips the command, so quote `pip install 'pkg[extra]'`, and `rm -f *.tmp` fails when no file matches. It does not split an unquoted `$var` into words, and its arrays start at 1.
- GNU and BSD tools differ:

| Task | GNU (Linux, Git Bash) | BSD (macOS) | Works on both |
|---|---|---|---|
| Edit in place | `sed -i 's/a/b/' f` | `sed -i '' 's/a/b/' f` | `sed -i.bak 's/a/b/' f && rm f.bak` |
| Perl regex | `grep -P` | none | `grep -E`, `rg`, `perl -ne` |
| Date arithmetic | `date -d '1 day ago'` | `date -v-1d` | none |
| File size | `stat -c %s f` | `stat -f %z f` | `wc -c < f` (BSD pads with spaces) |
| NUL after file names | `grep -lZ` | `-Z` means decompress | `grep -l --null` |
| Empty input | `xargs` runs the command once | runs nothing | `xargs -r` |

- Git Bash rewrites arguments and environment values that look like POSIX paths when it starts a native Windows program (anything outside `/usr/bin`, such as node, python, git, gh, docker or cmd). `/foo` becomes `C:/Program Files/Git/foo`, `/F` becomes `F:/`, and `/a:/b` becomes `C:\...\a;C:\...\b`. Prefix `MSYS_NO_PATHCONV=1` to stop it for arguments and environment alike, double the leading slash (`//F`), or exclude prefixes with `MSYS2_ARG_CONV_EXCL='/api;--dir='`.
- In Git Bash, `gh api /repos/o/r` fails with "invalid API endpoint: C:/Program Files/Git/repos/o/r", so write `gh api repos/o/r`. `cmd /c dir` starts an interactive cmd, so write `cmd //c dir`, and likewise `taskkill //F //PID 123`.
- Native Windows programs write CRLF into pipes and files. Git Bash drops the CR in `$(...)`, but `read` keeps it, so strip it with `line=${line%$'\r'}`.
- The Git for Windows installer defaults to `core.autocrlf=true`, so scripts check out with CRLF. Git Bash still runs them, while Linux, macOS and containers fail with `/usr/bin/env: 'bash\r': No such file or directory`. Fix line endings in `.gitattributes` as concise:git describes.
- When `LANG` is unset, as in Claude Code's Bash tool on Windows unless `~/.bashrc` sets it, Git Bash's `grep -P` fails with "supports only unibyte and UTF-8 locales" and `.` does not match non-ASCII text. Prefix `LC_ALL=C.UTF-8`.
- npm runs `package.json` scripts with `cmd.exe` on Windows, also when started from Git Bash, so `FOO=1 cmd`, `$VAR` and single quotes fail there. Use double quotes and no shell syntax in scripts, or move the logic into a Node script.
- On Windows `python3` often resolves to the Microsoft Store alias, which prints "Python was not found" and exits 49. Call `python`, `py -3` or `uv run python`.
- Windows refuses to delete or rename a file another process holds open: `rm` reports "Device or resource busy" and `mv` "Permission denied". Stop the dev server, watcher or test runner that holds it first.
- PowerShell reads the `$h:` in `"$h:8080"` as a scope or drive prefix, so the string comes out empty. Write `"${h}:8080"`.
- In PowerShell, `@` opens a hash table or splat only at the start of a token, and `{` opens a script block anywhere. `git log @{u}` is a parse error and `HEAD@{u}` reaches git as `HEAD@`. Quote such revisions: `'@{u}'`, `'HEAD@{1}'`. An unquoted `#` at the start of a token begins a comment.
- `ConvertTo-Json` stops at depth 2 by default and writes deeper objects as their type name, such as `"System.Collections.Hashtable"`, with only a warning. Pass `-Depth 10` (at most 100). A one-element array piped in comes out as a bare value, so add `-AsArray` or pass `-InputObject $list`.
- Piping a string to a native command appends a newline, `\r\n` on Windows, so `'abc' | tool` sends five bytes. Pass the value as an argument, or write it with `Set-Content -NoNewline` and pass the file.
- In PowerShell, `where`, `sort`, `diff`, `tee` and `kill` are aliases of `Where-Object`, `Sort-Object`, `Compare-Object`, `Tee-Object` and `Stop-Process`. Call `where.exe` to locate a program. Windows PowerShell 5.1 also maps `curl` and `wget` to `Invoke-WebRequest` and `sc` to `Set-Content`.
- In Windows PowerShell 5.1, `2>&1` under `$ErrorActionPreference = 'Stop'` turns a native command's first stderr line, such as git progress output, into a terminating error. PowerShell 7.2 and later leave redirected stderr alone.
