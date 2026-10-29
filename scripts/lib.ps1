$script:Utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)
$script:ManagedDirectories = @("skills", "agents", "output-styles", "mods")
$script:PreservedSkills = @("synced", ".trash")
$script:PluginDirectoriesVariable = "CLAUDE_CODE_PLUGIN_DIRS"
$script:IsWindowsPlatform = [System.IO.Path]::DirectorySeparatorChar -eq [char]"\"

function Copy-ClaudeBackupPath {
    param(
        [Parameter(Mandatory)][string]$Destination,
        [Parameter(Mandatory)][string]$BackupDirectory,
        [Parameter(Mandatory)][string]$RelativePath
    )

    $SourcePath = Join-Path $Destination $RelativePath
    if (-not (Test-Path -LiteralPath $SourcePath)) {
        return
    }

    $BackupPath = Join-Path $BackupDirectory $RelativePath
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $BackupPath) | Out-Null
    Copy-Item -LiteralPath $SourcePath -Destination $BackupPath -Recurse -Force
}

function Get-ClaudeFileCount {
    param([Parameter(Mandatory)][System.IO.FileSystemInfo]$Entry)

    $IsLink = [bool]($Entry.Attributes -band [System.IO.FileAttributes]::ReparsePoint)
    if ($Entry.PSIsContainer -and -not $IsLink) {
        return @(Get-ChildItem -LiteralPath $Entry.FullName -File -Recurse -Force).Count
    }
    return 1
}

function Test-ClaudeEntryReplaced {
    param(
        [Parameter(Mandatory)][string]$Source,
        [Parameter(Mandatory)][string]$Directory,
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$Mode
    )

    if ($Mode -eq "Merge") {
        return Test-Path -LiteralPath (Join-Path (Join-Path $Source $Directory) $Name)
    }
    return -not ($Directory -eq "skills" -and $script:PreservedSkills -contains $Name)
}

function Get-ClaudePayloadFiles {
    param([Parameter(Mandatory)][string]$Source)

    $SourcePrefix = $Source.TrimEnd("\", "/") + [System.IO.Path]::DirectorySeparatorChar
    $RelativePaths = New-Object System.Collections.Generic.List[string]
    foreach ($Directory in $script:ManagedDirectories) {
        foreach ($File in Get-ChildItem -LiteralPath (Join-Path $Source $Directory) -File -Recurse -Force) {
            $RelativePaths.Add($File.FullName.Substring($SourcePrefix.Length).Replace("\", "/"))
        }
    }
    $RelativePaths.Sort([System.StringComparer]::Ordinal)
    return $RelativePaths.ToArray()
}

function Write-ClaudeManifest {
    param(
        [Parameter(Mandatory)][string]$Source,
        [Parameter(Mandatory)][string]$Destination,
        [Parameter(Mandatory)][string[]]$RelativePaths
    )

    $Hasher = [System.Security.Cryptography.SHA256]::Create()
    try {
        $Manifest = foreach ($Relative in $RelativePaths) {
            $Bytes = [System.IO.File]::ReadAllBytes((Join-Path $Source $Relative))
            $Hash = [BitConverter]::ToString($Hasher.ComputeHash($Bytes)).Replace("-", "").ToLowerInvariant()
            "$Hash`t$Relative"
        }
    }
    finally {
        $Hasher.Dispose()
    }
    [System.IO.File]::WriteAllLines(
        (Join-Path $Destination ".anthropic-claude-code-agent-skills.manifest"),
        [string[]]$Manifest,
        $script:Utf8WithoutBom
    )
}

function ConvertFrom-ClaudeJson {
    param([Parameter(Mandatory)][AllowEmptyString()][string]$Text)

    $Parameters = @{ InputObject = $Text }
    if ((Get-Command ConvertFrom-Json).Parameters.ContainsKey("DateKind")) {
        $Parameters.DateKind = "String"
    }
    return ConvertFrom-Json @Parameters
}

function Read-ClaudeSettings {
    param([Parameter(Mandatory)][string]$Path)

    $Text = [System.IO.File]::ReadAllText($Path)
    try {
        $Settings = ConvertFrom-ClaudeJson -Text $Text
    }
    catch {
        throw "Settings file is not valid JSON: $Path"
    }
    if ($Settings -isnot [System.Management.Automation.PSCustomObject]) {
        throw "Settings file must contain a JSON object: $Path"
    }
    return $Settings
}

function Add-ClaudeMissingSettings {
    param(
        [Parameter(Mandatory)]$Settings,
        [Parameter(Mandatory)]$Portable
    )

    $Added = 0
    foreach ($Property in $Portable.PSObject.Properties) {
        $Current = $Settings.PSObject.Properties[$Property.Name]
        if ($null -eq $Current) {
            $Settings | Add-Member -NotePropertyName $Property.Name -NotePropertyValue $Property.Value
            $Added++
        }
        elseif ($Current.Value -is [System.Management.Automation.PSCustomObject] -and $Property.Value -is [System.Management.Automation.PSCustomObject]) {
            $Added += Add-ClaudeMissingSettings -Settings $Current.Value -Portable $Property.Value
        }
    }
    return $Added
}

function Get-ClaudeLocationKey {
    param([Parameter(Mandatory)][string]$Path)

    if ($Path -eq "~" -or $Path.StartsWith("~/") -or $Path.StartsWith("~\")) {
        $Path = $HOME + $Path.Substring(1)
    }
    if ($script:IsWindowsPlatform) {
        $Path = $Path.Replace("\", "/").ToLowerInvariant()
    }
    return $Path.TrimEnd("/")
}

function Join-ClaudePluginDirectories {
    param(
        $Current,
        [Parameter(Mandatory)][AllowEmptyCollection()][string[]]$Bundled,
        [Parameter(Mandatory)][string]$Mode
    )

    $Separator = [string][System.IO.Path]::PathSeparator
    $Existing = @()
    if ($Mode -eq "Merge" -and $Current -is [string]) {
        $Existing = @($Current.Split([char[]]$Separator) | Where-Object { $_ })
    }
    $Listed = @($Existing | ForEach-Object { Get-ClaudeLocationKey -Path $_ })
    $Added = @($Bundled | Where-Object { $Listed -cnotcontains (Get-ClaudeLocationKey -Path $_) })
    return (@($Existing) + @($Added)) -join $Separator
}

function Merge-ClaudeSettings {
    param(
        [Parameter(Mandatory)][string]$PortablePath,
        [Parameter(Mandatory)][string]$SettingsPath,
        [Parameter(Mandatory)][AllowEmptyCollection()][string[]]$PluginDirectories,
        [Parameter(Mandatory)][string]$Mode
    )

    $Portable = Read-ClaudeSettings -Path $PortablePath
    $Settings = if (Test-Path -LiteralPath $SettingsPath -PathType Leaf) {
        Read-ClaudeSettings -Path $SettingsPath
    }
    else {
        [pscustomobject]@{}
    }

    $Changed = Add-ClaudeMissingSettings -Settings $Settings -Portable $Portable
    $OutputStyle = $Portable.PSObject.Properties["outputStyle"]
    if ($null -ne $OutputStyle -and $Settings.outputStyle -cne $OutputStyle.Value) {
        $Settings.outputStyle = $OutputStyle.Value
        $Changed++
    }

    if ($null -eq $Settings.PSObject.Properties["env"]) {
        $Settings | Add-Member -NotePropertyName "env" -NotePropertyValue ([pscustomobject]@{})
    }
    $Environment = $Settings.env
    if ($Environment -isnot [System.Management.Automation.PSCustomObject]) {
        throw "Settings file must contain a JSON object in env: $SettingsPath"
    }
    $Current = $Environment.PSObject.Properties[$script:PluginDirectoriesVariable]
    $CurrentValue = if ($null -ne $Current) { $Current.Value } else { $null }
    $Value = Join-ClaudePluginDirectories -Current $CurrentValue -Bundled $PluginDirectories -Mode $Mode
    if ($null -eq $Current) {
        $Environment | Add-Member -NotePropertyName $script:PluginDirectoriesVariable -NotePropertyValue $Value
        $Changed++
    }
    elseif ($Current.Value -cne $Value) {
        $Current.Value = $Value
        $Changed++
    }

    return [pscustomobject]@{
        Settings = $Settings
        Changed = $Changed
    }
}

function Sync-ClaudePayload {
    param(
        [Parameter(Mandatory)][string]$Source,
        [Parameter(Mandatory)][string]$Destination,
        [Parameter(Mandatory)][string]$BackupDirectory,
        [ValidateSet("Merge", "Replace")][string]$Mode = "Replace"
    )

    $Source = [System.IO.Path]::GetFullPath($Source).TrimEnd("\", "/")
    $Destination = [System.IO.Path]::GetFullPath($Destination).TrimEnd("\", "/")
    foreach ($RequiredPath in @("settings.json") + $script:ManagedDirectories) {
        if (-not (Test-Path -LiteralPath (Join-Path $Source $RequiredPath))) {
            throw "Payload is missing claude/$RequiredPath."
        }
    }
    if ($Source -eq $Destination) {
        throw "Source and destination must be different directories."
    }
    foreach ($Directory in $script:ManagedDirectories) {
        $ManagedPath = Join-Path $Destination $Directory
        if ((Test-Path -LiteralPath $ManagedPath) -and ((Get-Item -LiteralPath $ManagedPath -Force).Attributes -band [System.IO.FileAttributes]::ReparsePoint)) {
            throw "Managed directory must not be a symbolic link: $ManagedPath"
        }
        if ($Source -eq $ManagedPath -or $Source.StartsWith($ManagedPath + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Source must not be inside a managed destination directory."
        }
    }

    $InstalledMods = Join-Path $Destination "mods"
    $PluginDirectories = @(Get-ChildItem -LiteralPath (Join-Path $Source "mods") -Directory |
        Sort-Object Name |
        ForEach-Object {
            $DefaultDestination = Join-Path ([Environment]::GetFolderPath("UserProfile")) ".claude"
            if ($Destination -eq $DefaultDestination) {
                "~/.claude/mods/$($_.Name)"
            } else {
                Join-Path $InstalledMods $_.Name
            }
        })
    $SettingsPath = Join-Path $Destination "settings.json"
    $Merged = Merge-ClaudeSettings `
        -PortablePath (Join-Path $Source "settings.json") `
        -SettingsPath $SettingsPath `
        -PluginDirectories $PluginDirectories `
        -Mode $Mode

    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    foreach ($RelativePath in $script:ManagedDirectories + "settings.json") {
        Copy-ClaudeBackupPath -Destination $Destination -BackupDirectory $BackupDirectory -RelativePath $RelativePath
    }

    $Removed = 0
    if ($Mode -eq "Replace") {
        $LegacyInstructions = Join-Path $Destination "CLAUDE.md"
        if (Test-Path -LiteralPath $LegacyInstructions) {
            Copy-ClaudeBackupPath -Destination $Destination -BackupDirectory $BackupDirectory -RelativePath "CLAUDE.md"
            Remove-Item -LiteralPath $LegacyInstructions -Force
            $Removed++
        }
    }
    foreach ($Directory in $script:ManagedDirectories) {
        $DestinationDirectory = Join-Path $Destination $Directory
        if (Test-Path -LiteralPath $DestinationDirectory) {
            $ReplacedEntries = @(Get-ChildItem -LiteralPath $DestinationDirectory -Force |
                Where-Object { Test-ClaudeEntryReplaced -Source $Source -Directory $Directory -Name $_.Name -Mode $Mode })
            foreach ($Entry in $ReplacedEntries) {
                $Removed += Get-ClaudeFileCount -Entry $Entry
                Remove-Item -LiteralPath $Entry.FullName -Recurse -Force
            }
        }
        New-Item -ItemType Directory -Force -Path $DestinationDirectory | Out-Null
        Get-ChildItem -LiteralPath (Join-Path $Source $Directory) -Force |
            Copy-Item -Destination $DestinationDirectory -Recurse -Force
    }

    [System.IO.File]::WriteAllText(
        $SettingsPath,
        (ConvertTo-Json -InputObject $Merged.Settings -Depth 100) + [Environment]::NewLine,
        $script:Utf8WithoutBom
    )
    $PayloadFiles = @(Get-ClaudePayloadFiles -Source $Source)
    Write-ClaudeManifest -Source $Source -Destination $Destination -RelativePaths $PayloadFiles

    return [pscustomobject]@{
        Updated = $PayloadFiles.Count
        Removed = $Removed
        SettingsChanged = $Merged.Changed
    }
}
