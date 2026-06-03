param(
    [string]$EnvFile = "",
    [string]$PostgresRoot = "",
    [string]$DatabaseName = "",
    [string]$DatabaseUser = "",
    [string]$PostgresPassword = "",
    [string]$DatabaseHost = "",
    [int]$DatabasePort = 0
)

$ErrorActionPreference = "Stop"

function Get-RepoRoot {
    return (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

function Read-DatabaseUrlFromEnvFile {
    param([string]$Path)
    if (!(Test-Path $Path)) {
        return $null
    }
    foreach ($line in Get-Content -Path $Path -Encoding UTF8) {
        $trimmed = $line.Trim()
        if ($trimmed -match '^\s*#' -or !$trimmed) {
            continue
        }
        if ($trimmed -match '^\s*DATABASE_URL\s*=\s*(.+)\s*$') {
            return $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
    return $null
}

function Import-DatabaseUrlConfig {
    param([hashtable]$Config, [string]$DatabaseUrl)
    if (!$DatabaseUrl) {
        return $false
    }
    $pattern = '^postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/([^?]+)'
    if ($DatabaseUrl -notmatch $pattern) {
        throw "DATABASE_URL invalid in .env. Expected postgresql://user:password@host:port/database"
    }
    $Config.User = $Matches[1]
    $Config.Password = [Uri]::UnescapeDataString($Matches[2])
    $Config.Host = $Matches[3]
    $Config.Port = [int]$Matches[4]
    $Config.Name = $Matches[5]
    return $true
}

function Get-PostgresInstallCandidates {
    $seen = @{}
    $list = New-Object System.Collections.Generic.List[object]

    $base = Join-Path $env:ProgramFiles "PostgreSQL"
    if (Test-Path $base) {
        foreach ($dir in (Get-ChildItem -Path $base -Directory | Sort-Object Name -Descending)) {
            $bin = Join-Path $dir.FullName "bin"
            $psql = Join-Path $bin "psql.exe"
            if ((Test-Path $psql) -and !$seen.ContainsKey($dir.FullName)) {
                $seen[$dir.FullName] = $true
                $list.Add([pscustomobject]@{ Root = $dir.FullName; Bin = $bin })
            }
        }
    }

    $cmd = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($cmd) {
        $root = Split-Path (Split-Path $cmd.Source -Parent) -Parent
        if (!$seen.ContainsKey($root)) {
            $seen[$root] = $true
            $list.Add([pscustomobject]@{ Root = $root; Bin = Split-Path $cmd.Source -Parent })
        }
    }

    return $list
}

function Resolve-PostgresForDatabase {
    param(
        [hashtable]$Config,
        [string]$ForcedRoot
    )

    if ($ForcedRoot) {
        $root = $ForcedRoot.TrimEnd('\')
        $bin = Join-Path $root "bin"
        if (!(Test-Path (Join-Path $bin "psql.exe"))) {
            throw "psql.exe not found under $bin"
        }
        return [pscustomobject]@{ Root = $root; Bin = $bin; ServerVersion = "(forced)" }
    }

    $candidates = Get-PostgresInstallCandidates
    if ($candidates.Count -eq 0) {
        throw "No PostgreSQL installs found under Program Files\PostgreSQL"
    }

    $prev = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    $env:PGPASSWORD = $Config.Password
    try {
        foreach ($candidate in $candidates) {
            $psql = Join-Path $candidate.Bin "psql.exe"
            $versionLine = & $psql -U $Config.User -h $Config.Host -p $Config.Port -d $Config.Name -tAc "SELECT version();" 2>&1
            if ($LASTEXITCODE -eq 0 -and $versionLine) {
                return [pscustomobject]@{
                    Root           = $candidate.Root
                    Bin            = $candidate.Bin
                    ServerVersion  = ($versionLine | Out-String).Trim()
                }
            }
        }
    }
    finally {
        $ErrorActionPreference = $prev
    }

    throw "Cannot connect to $($Config.Host):$($Config.Port)/$($Config.Name) with any local psql (tried $($candidates.Count) installs)."
}

function Test-PgvectorControlFile {
    param([string]$PostgresRoot)
    return (Test-Path (Join-Path $PostgresRoot "share\extension\vector.control"))
}

function Throw-PgvectorMissing {
    param([string]$PostgresRoot, [string]$RepoRoot, [string]$ServerVersion)
    $major = if ($PostgresRoot -match '\\PostgreSQL\\(\d+)') { $Matches[1] } else { "?" }
    throw @"
pgvector binaries missing for the PostgreSQL SERVER that owns port 5432:
  Install path: $PostgresRoot
  Server: $ServerVersion

You may have installed pgvector on PostgreSQL 18 while the database service is still PostgreSQL $major.

Fix (PowerShell as Administrator):
  powershell -ExecutionPolicy Bypass -File scripts\windows\install-pgvector-windows.ps1 -PostgresRoot "$PostgresRoot"
  powershell -ExecutionPolicy Bypass -File scripts\windows\setup-pgvector.ps1 -PostgresRoot "$PostgresRoot"
"@
}

$db = @{
    Name     = "princy_ai_editor"
    User     = "postgres"
    Password = ""
    Host     = "localhost"
    Port     = 5432
}

$repoRoot = Get-RepoRoot
if (!$EnvFile) {
    $EnvFile = Join-Path $repoRoot ".env"
}

$databaseUrl = Read-DatabaseUrlFromEnvFile -Path $EnvFile
if (Import-DatabaseUrlConfig -Config $db -DatabaseUrl $databaseUrl) {
    Write-Host "Loaded DATABASE_URL from $EnvFile"
}
else {
    Write-Host "DATABASE_URL not found in: $EnvFile"
}

if ($DatabaseName) { $db.Name = $DatabaseName }
if ($DatabaseUser) { $db.User = $DatabaseUser }
if ($DatabaseHost) { $db.Host = $DatabaseHost }
if ($DatabasePort) { $db.Port = $DatabasePort }
if ($PostgresPassword) { $db.Password = $PostgresPassword }

if (!$db.Password) {
    $securePassword = Read-Host "PostgreSQL password for user '$($db.User)'" -AsSecureString
    $db.Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    )
}

$pg = Resolve-PostgresForDatabase -Config $db -ForcedRoot $PostgresRoot
Write-Host "PostgreSQL server: $($pg.ServerVersion)"
Write-Host "Install path (must match server): $($pg.Root)"

if (!(Test-PgvectorControlFile -PostgresRoot $pg.Root)) {
    Throw-PgvectorMissing -PostgresRoot $pg.Root -RepoRoot $repoRoot -ServerVersion $pg.ServerVersion
}

$env:PGPASSWORD = $db.Password
$env:DATABASE_URL = "postgresql://$($db.User):$($db.Password)@$($db.Host):$($db.Port)/$($db.Name)"
$env:Path = "$($pg.Bin);$env:Path"
$psql = Join-Path $pg.Bin "psql.exe"

Write-Host "Target: $($db.User)@$($db.Host):$($db.Port)/$($db.Name)"
Write-Host "Enabling pgvector extension..."
& $psql -U $db.User -h $db.Host -p $db.Port -d $db.Name -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS vector;"
if ($LASTEXITCODE -ne 0) {
    throw "CREATE EXTENSION vector failed (exit $LASTEXITCODE). Install pgvector on: $($pg.Root)"
}

$version = & $psql -U $db.User -h $db.Host -p $db.Port -d $db.Name -tAc "SELECT extversion FROM pg_extension WHERE extname = 'vector';"
$versionText = if ($null -eq $version) { "" } else { $version.ToString().Trim() }
if (!$versionText) {
    throw "Extension vector not registered. Restart PostgreSQL service for version $($pg.Root) and retry."
}

Write-Host "pgvector enabled. Version: $versionText"
Write-Host ""
Write-Host "Next:"
Write-Host "  cd $repoRoot\packages\database"
Write-Host "  npx prisma migrate resolve --rolled-back 20260603120000_pgvector_memory_v2"
Write-Host "  npx prisma migrate deploy"
