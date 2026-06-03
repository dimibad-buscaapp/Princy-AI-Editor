param(
    [string]$DatabaseName = "princy_ai_editor",
    [string]$DatabaseUser = "postgres",
    [string]$PostgresPassword = "",
    [string]$DatabaseHost = "localhost",
    [int]$DatabasePort = 5432
)

$ErrorActionPreference = "Stop"

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

$postgresBin = Resolve-PostgresBin
if (!$postgresBin) {
    throw "psql.exe not found. Install PostgreSQL and ensure pgvector binaries are available for your PostgreSQL version."
}

if (!$PostgresPassword) {
    $securePassword = Read-Host "PostgreSQL password for user '$DatabaseUser'" -AsSecureString
    $PostgresPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    )
}

$env:PGPASSWORD = $PostgresPassword
$env:Path = "$postgresBin;$env:Path"
$psql = Join-Path $postgresBin "psql.exe"

Write-Host "Enabling pgvector on $DatabaseName..."
& $psql -U $DatabaseUser -h $DatabaseHost -p $DatabasePort -d $DatabaseName -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS vector;"

$version = & $psql -U $DatabaseUser -h $DatabaseHost -p $DatabasePort -d $DatabaseName -tAc "SELECT extversion FROM pg_extension WHERE extname = 'vector';"
if (!$version.Trim()) {
    throw "pgvector extension is not available. Install pgvector for PostgreSQL on Windows, then rerun this script."
}

Write-Host "pgvector enabled. Version: $($version.Trim())"
Write-Host "Next: npm run db:deploy (from repo root)"
