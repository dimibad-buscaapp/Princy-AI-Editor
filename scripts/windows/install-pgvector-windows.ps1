# Installs pgvector binaries into an existing PostgreSQL on Windows (no CREATE EXTENSION).
# Requires Administrator. After this, run setup-pgvector.ps1.
param(
    [string]$PostgresRoot = "",
    [ValidateSet("prebuilt", "source")]
    [string]$Method = "prebuilt",
    [string]$PgVectorTag = "",
    [string]$PgVectorVersion = "0.8.2"
)

# GitHub release tag per PostgreSQL major (andreiramani/pgvector_pgsql_windows)
$PgvectorReleaseByMajor = @{
    13 = "0.8.2_13.23"
    14 = "0.8.2_14.20"
    15 = "0.8.2_15.14"
    16 = "0.8.2_16.1"
    17 = "0.8.2_17.6"
    18 = "0.8.2_18.0.2"
}

$ErrorActionPreference = "Stop"

function Resolve-PostgresRoot {
    param([string]$Override)
    if ($Override) {
        return $Override.TrimEnd('\')
    }
    $psql = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($psql) {
        $bin = Split-Path -Parent $psql.Source
        return (Split-Path -Parent $bin)
    }
    $postgresRoot = Join-Path $env:ProgramFiles "PostgreSQL"
    if (!(Test-Path $postgresRoot)) {
        return $null
    }
    foreach ($dir in (Get-ChildItem -Path $postgresRoot -Directory | Sort-Object Name -Descending)) {
        if (Test-Path (Join-Path $dir.FullName "bin\psql.exe")) {
            return $dir.FullName
        }
    }
    return $null
}

function Test-PgvectorInstalled {
    param([string]$Root)
    return (Test-Path (Join-Path $Root "share\extension\vector.control"))
}

function Get-PostgresMajorVersion {
    param([string]$Root)
    $name = Split-Path -Leaf $Root
    if ($name -match '^(\d+)') {
        return [int]$Matches[1]
    }
    return 17
}

function Get-PgvectorReleaseTag {
    param([int]$Major, [string]$OverrideTag)
    if ($OverrideTag) {
        return $OverrideTag
    }
    if ($PgvectorReleaseByMajor.ContainsKey($Major)) {
        return $PgvectorReleaseByMajor[$Major]
    }
    throw "No prebuilt pgvector mapping for PostgreSQL $Major. Set -PgVectorTag from https://github.com/andreiramani/pgvector_pgsql_windows/releases or use -Method source."
}

function Install-PrebuiltPgvector {
    param(
        [string]$Root,
        [int]$Major,
        [string]$Tag,
        [string]$Version
    )

    $assetName = "vector.v$Version-pg$Major.zip"
    $url = "https://github.com/andreiramani/pgvector_pgsql_windows/releases/download/$Tag/$assetName"

    Write-Host "Downloading unofficial prebuilt (PG $Major): $url"
    Write-Host "Source: https://github.com/andreiramani/pgvector_pgsql_windows (community build)"

    $tempDir = Join-Path $env:TEMP "princy-pgvector-$Major"
    if (Test-Path $tempDir) {
        Remove-Item -Recurse -Force $tempDir
    }
    New-Item -ItemType Directory -Path $tempDir | Out-Null

    $zipPath = Join-Path $tempDir $assetName
    try {
        Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
    }
    catch {
        throw "Download failed ($url). Install manually from the release page or use -Method source with Visual Studio nmake."
    }

    Expand-Archive -Path $zipPath -DestinationPath (Join-Path $tempDir "extracted") -Force
    $extracted = Join-Path $tempDir "extracted"

    $control = Get-ChildItem -Path $extracted -Recurse -Filter "vector.control" -ErrorAction SilentlyContinue | Select-Object -First 1
    if (!$control) {
        throw "vector.control not found inside $assetName. Follow readme.txt in the zip manually."
    }

    $extSource = $control.Directory.FullName
    $libDll = Get-ChildItem -Path $extracted -Recurse -Filter "vector.dll" -ErrorAction SilentlyContinue | Select-Object -First 1

    $extDest = Join-Path $Root "share\extension"
    $libDest = Join-Path $Root "lib"

    if (!(Test-Path $extDest)) {
        New-Item -ItemType Directory -Path $extDest -Force | Out-Null
    }
    if (!(Test-Path $libDest)) {
        New-Item -ItemType Directory -Path $libDest -Force | Out-Null
    }

    Copy-Item -Path (Join-Path $extSource "vector*") -Destination $extDest -Force
    if ($libDll) {
        Copy-Item -Path $libDll.FullName -Destination $libDest -Force
        Write-Host "Copied $($libDll.Name) -> $libDest"
    }
    else {
        Write-Warning "vector.dll not found in zip; extension SQL/control copied only. If CREATE EXTENSION fails, copy vector.dll to $libDest per readme.txt in the zip."
    }

    Write-Host "Copied extension files -> $extDest"
}

function Show-SourceBuildInstructions {
    param([string]$Root, [string]$Version)
    $pgroot = $Root -replace '\\', '\\'
    Write-Host @"

=== Build pgvector from source (official) ===
1. Install "Desktop development with C++" in Visual Studio Build Tools.
2. Open "x64 Native Tools Command Prompt for VS" as Administrator.
3. Run:

set "PGROOT=$Root"
cd %TEMP%
git clone --branch v$Version https://github.com/pgvector/pgvector.git
cd pgvector
nmake /F Makefile.win
nmake /F Makefile.win install

4. Then:
   powershell -ExecutionPolicy Bypass -File scripts\windows\setup-pgvector.ps1

"@
}

$pgRoot = Resolve-PostgresRoot -Override $PostgresRoot
if (!$pgRoot) {
    throw "PostgreSQL install not found. Set -PostgresRoot 'C:\Program Files\PostgreSQL\17'"
}

$major = Get-PostgresMajorVersion -Root $pgRoot
Write-Host "PostgreSQL root: $pgRoot (major $major)"

if (Test-PgvectorInstalled -Root $pgRoot) {
    Write-Host "pgvector already present: $(Join-Path $pgRoot 'share\extension\vector.control')"
    Write-Host "Run: powershell -ExecutionPolicy Bypass -File scripts\windows\setup-pgvector.ps1"
    exit 0
}

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)
if (!$isAdmin) {
    Write-Warning "Not running as Administrator. Copy to Program Files may fail."
    Write-Host "Re-run PowerShell as Administrator, then:"
    Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\windows\install-pgvector-windows.ps1"
}

if ($Method -eq "source") {
    Show-SourceBuildInstructions -Root $pgRoot -Version $PgVectorVersion
    exit 0
}

$releaseTag = Get-PgvectorReleaseTag -Major $major -OverrideTag $PgVectorTag
Write-Host "Using release tag: $releaseTag (PostgreSQL $major)"

Install-PrebuiltPgvector -Root $pgRoot -Major $major -Tag $releaseTag -Version $PgVectorVersion

if (!(Test-PgvectorInstalled -Root $pgRoot)) {
    throw "Install finished but vector.control is still missing under $pgRoot\share\extension"
}

Write-Host ""
Write-Host "pgvector binaries installed. Next:"
Write-Host "  cd C:\Apps\Princy-Ai-Editor"
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\windows\setup-pgvector.ps1"
