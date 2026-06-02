param(
    [string]$DatabaseName = "princy_ai_editor",
    [string]$DatabaseUser = "postgres",
    [string]$PostgresPassword = ""
)

$ErrorActionPreference = "Stop"

function Resolve-PostgresBin {
    $psqlCommand = Get-Command psql.exe -ErrorAction SilentlyContinue

    if ($psqlCommand) {
        return Split-Path -Parent $psqlCommand.Source
    }

    $postgresRoot = Join-Path $env:ProgramFiles "PostgreSQL"

    if (Test-Path $postgresRoot) {
        $versionDirectories = Get-ChildItem -Path $postgresRoot -Directory | Sort-Object Name -Descending

        foreach ($versionDirectory in $versionDirectories) {
            $candidate = Join-Path $versionDirectory.FullName "bin"
            $candidatePsql = Join-Path $candidate "psql.exe"
            $candidateCreatedb = Join-Path $candidate "createdb.exe"

            if ((Test-Path $candidatePsql) -and (Test-Path $candidateCreatedb)) {
                return $candidate
            }
        }
    }

    return $null
}

if (!(Get-Command choco.exe -ErrorAction SilentlyContinue)) {
    throw "Chocolatey was not found. Install Chocolatey before running this script."
}

$postgresBin = Resolve-PostgresBin

if (!$postgresBin) {
    choco install postgresql -y
    $postgresBin = Resolve-PostgresBin
}

if (!$postgresBin) {
    throw "PostgreSQL was installed, but psql.exe was not found. Reopen PowerShell or add PostgreSQL bin to PATH."
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
$createdb = Join-Path $postgresBin "createdb.exe"

$databaseExists = & $psql -U $DatabaseUser -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName'"

if ($databaseExists.Trim() -ne "1") {
    & $createdb -U $DatabaseUser -h localhost $DatabaseName
    Write-Host "Database '$DatabaseName' created."
}
else {
    Write-Host "Database '$DatabaseName' already exists."
}

Write-Host "Set this in C:\Apps\Princy-Ai-Editor\.env:"
Write-Host "DATABASE_URL=postgresql://${DatabaseUser}:<PASSWORD>@localhost:5432/${DatabaseName}"
