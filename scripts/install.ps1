param(
    [ValidateSet("Merge", "Replace")]
    [string]$Mode = "Replace",
    [string]$Source = (Join-Path (Split-Path -Parent $PSScriptRoot) "claude")
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib.ps1")

$Destination = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $HOME ".claude" }
$Destination = [System.IO.Path]::GetFullPath($Destination)
$Backup = Join-Path $Destination (".anthropic-claude-code-agent-skills-backups/" + [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssfffffffZ"))

$Result = Sync-ClaudePayload `
    -Source $Source `
    -Destination $Destination `
    -BackupDirectory $Backup `
    -Mode $Mode

[System.IO.File]::WriteAllText(
    (Join-Path $Destination ".anthropic-claude-code-agent-skills.install-mode"),
    "$($Mode.ToLowerInvariant())`n",
    $script:Utf8WithoutBom
)
Write-Host "Claude Code setup installed in $Mode mode: updated=$($Result.Updated) removed=$($Result.Removed) settings_changed=$($Result.SettingsChanged)."
if (Test-Path -LiteralPath $Backup) {
    Write-Host "Previous files were backed up to $Backup"
}
Write-Host "Restart Claude Code to load the new skills, agents, output style, mods, and settings."
