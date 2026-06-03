param(
    [string]$EnvFile = "",
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

function Resolve-PostgresBin {
    $psqlCommand = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($psqlCommand) {
        return Split-Path -Parent $psqlCommand.Source
    }
    $postgresRoot = Join-Path $env:ProgramFiles "PostgreSQL"
    if (Test-Path $postgresRoot) {
        foreach ($versionDirectory in (Get-ChildItem -Path $postgresRoot -Directory | Sort-Object Name -Descending)) {
            $candidate = Join-Path $versionDirectory.FullName "bin"
            if ((Test-Path (Join-Path $candidate "psql.exe"))) {
                return $candidate
            }
        }
    }
    return $null
}

function Get-PostgresRootFromBin {
    param([string]$Bin)
    return (Split-Path -Parent $Bin)
}

function Test-PgvectorControlFile {
    param([string]$PostgresRoot)
    return (Test-Path (Join-Path $PostgresRoot "share\extension\vector.control"))
}

function Throw-PgvectorMissing {
    param([string]$PostgresRoot, [string]$RepoRoot)
    throw @"
pgvector is NOT installed on PostgreSQL at:
  $PostgresRoot

The error "vector.control: No such file or directory" means binaries are missing.

Fix (PowerShell as Administrator):
  cd $RepoRoot
  powershell -ExecutionPolicy Bypass -File scripts\windows\install-pgvector-windows.ps1
  powershell -ExecutionPolicy Bypass -File scripts\windows\setup-pgvector.ps1

Official build (Visual Studio nmake):
  powershell -ExecutionPolicy Bypass -File scripts\windows\install-pgvector-windows.ps1 -Method source
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
    Write-Host "Add DATABASE_URL=postgresql://user:pass@localhost:5432/princy_ai_editor or pass -PostgresPassword"
}

if ($DatabaseName) { $db.Name = $DatabaseName }
if ($DatabaseUser) { $db.User = $DatabaseUser }
if ($DatabaseHost) { $db.Host = $DatabaseHost }
if ($DatabasePort) { $db.Port = $DatabasePort }
if ($PostgresPassword) { $db.Password = $PostgresPassword }

$postgresBin = Resolve-PostgresBin
if (!$postgresBin) {
    throw "psql.exe not found. Install PostgreSQL first."
}

$postgresRoot = Get-PostgresRootFromBin -Bin $postgresBin
if (!(Test-PgvectorControlFile -PostgresRoot $postgresRoot)) {
    Throw-PgvectorMissing -PostgresRoot $postgresRoot -RepoRoot $repoRoot
}

if (!$db.Password) {
    $securePassword = Read-Host "PostgreSQL password for user '$($db.User)'" -AsSecureString
    $db.Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    )
}

$env:PGPASSWORD = $db.Password
$env:DATABASE_URL = "postgresql://$($db.User):$($db.Password)@$($db.Host):$($db.Port)/$($db.Name)"
$env:Path = "$postgresBin;$env:Path"
$psql = Join-Path $postgresBin "psql.exe"

Write-Host "Target: $($db.User)@$($db.Host):$($db.Port)/$($db.Name)"
Write-Host "Enabling pgvector extension..."
& $psql -U $db.User -h $db.Host -p $db.Port -d $db.Name -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS vector;"
if ($LASTEXITCODE -ne 0) {
    throw "CREATE EXTENSION vector failed (exit $LASTEXITCODE). Check PostgreSQL logs."
}

$version = & $psql -U $db.User -h $db.Host -p $db.Port -d $db.Name -tAc "SELECT extversion FROM pg_extension WHERE extname = 'vector';"
$versionText = if ($null -eq $version) { "" } else { $version.ToString().Trim() }
if (!$versionText) {
    throw "Extension vector not registered after CREATE EXTENSION. Restart PostgreSQL service and retry."
}

Write-Host "pgvector enabled. Version: $versionText"
Write-Host ""
Write-Host "Next:"
Write-Host "  cd $repoRoot\packages\database"
Write-Host "  npx prisma migrate resolve --rolled-back 20260603120000_pgvector_memory_v2"
Write-Host "  npx prisma migrate deploy"
Write-Host "  cd $repoRoot"
Write-Host "  npm run build"
Write-Host "  npm run services:restart"
