# PowerShell

Rules for PowerShell 7 (`pwsh`), and where Windows PowerShell 5.1 differs.

## Versions

- PowerShell 7.7.0 was released on 2026-11-10 on .NET 11. 7.6 is the LTS release on .NET 10, supported until 2028-11-14, and 7.4 and 7.5 reached end of support on 2026-11-10.
- `https://raw.githubusercontent.com/PowerShell/PowerShell/master/tools/metadata.json` publishes the current release tags as `StableReleaseTag` and `LTSReleaseTag`.
- 7.7 makes `New-Guid` return version 7 (time-sortable) UUIDs, so use `[guid]::NewGuid()` where a random version 4 value is required.

## Fail fast

Start scripts with these three lines.

```powershell
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true
Set-StrictMode -Version 3.0
```

- Without the second line (7.4 and later), a native command that exits non-zero never stops the script, even under `Stop`. For a tool such as `robocopy`, whose non-zero codes are not all errors, set it to `$false` inside a script block and test `$LASTEXITCODE` yourself.
- Pin `Set-StrictMode -Version 3.0`, because `Latest` gets stricter with new releases.

## Exit codes

- `pwsh -File script.ps1` exits 0 after normal termination, or with the number given to `exit`. `pwsh -Command` exits only 0 or 1, taken from `$?` of the last statement, and turns any other native exit code into 1.
- End a `.ps1` file or a `-Command` string whose caller needs a native command's status with `exit $LASTEXITCODE`.

## Parsing and quoting

- In a double-quoted string, `$name:` starts a drive-qualified variable, so `"$h:8080"` expands to an empty string without any error, even under strict mode, and `"$h: x"` fails to parse. Write `"${h}:8080"`.
- `< > @ #` are special only at the start of a token, while `{ }` are special anywhere in argument mode. `git log @{u}` is a parse error, and `HEAD@{u}` reaches git as `HEAD@` followed by an encoded script block, so quote such revisions as `'@{u}'` and `'HEAD@{1}'`. An unquoted `#` at the start of a token begins a comment.
- `--%`, the stop-parsing token, passes the rest of the line to a native command unchanged, for arguments full of quotes or `@`.

## Output and pipes

- `ConvertTo-Json` stops at depth 2 by default and writes deeper objects as their type name, such as `"System.Collections.Hashtable"`, with only a warning. Pass `-Depth 10` (at most 100). A one-element array piped in comes out as a bare value, so add `-AsArray` or pass `-InputObject $list`.
- Piping a string to a native command appends a newline, `\r\n` on Windows, so `'abc' | tool` sends five bytes. Pass the value as an argument, or write it with `Set-Content -NoNewline` and pass the file.
- Since 7.4, redirecting a native command's stdout to a file or piping it to another native command keeps the raw bytes.

## Aliases and Windows PowerShell 5.1

- `where`, `sort`, `diff`, `tee` and `kill` are aliases of `Where-Object`, `Sort-Object`, `Compare-Object`, `Tee-Object` and `Stop-Process`, so call `where.exe` to locate a program.
- Windows PowerShell 5.1 also maps `curl` and `wget` to `Invoke-WebRequest` and `sc` to `Set-Content`, so call `curl.exe` there.
- In Windows PowerShell 5.1, `2>&1` under `$ErrorActionPreference = 'Stop'` turns a native command's first stderr line, such as git progress output, into a terminating error. PowerShell 7.2 and later leave redirected stderr alone.
- Claude Code starts its PowerShell tool with `-ExecutionPolicy Bypass` at process scope, so `.ps1` files run without a change to the machine policy, while Group Policy still applies.
