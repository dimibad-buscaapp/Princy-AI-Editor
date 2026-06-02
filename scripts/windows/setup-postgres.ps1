param(
    [string]$DatabaseName = "princy_ai_editor",
    [string]$DatabaseUser = "postgres",
    [string]$PostgresPassword = ""
)

$ErrorActionPreference = "Stop"

if (!(Get-Command choco.exe -ErrorAction SilentlyContinue)) {
    throw "Chocolatey was not found. Install Chocolatey before running this script."
}

if (!(Get-Command psql.exe -ErrorAction SilentlyContinue)) {
    choco install postgresql -y
}

if (!$PostgresPassword) {
    $securePassword = Read-Host "PostgreSQL password for user '$DatabaseUser'" -AsSecureString
    $PostgresPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    )
}

$env:PGPASSWORD = $PostgresPassword

$databaseExists = psql -U $DatabaseUser -h localhost -tAc "SELECT 1 FROM pg_database WHERE datname = '$DatabaseName'"

if ($databaseExists.Trim() -ne "1") {
    createdb -U $DatabaseUser -h localhost $DatabaseName
    Write-Host "Database '$DatabaseName' created."
}
else {
    Write-Host "Database '$DatabaseName' already exists."
}

Write-Host "Set this in C:\Apps\Princy-Ai-Editor\.env:"
Write-Host "DATABASE_URL=postgresql://$DatabaseUser:<PASSWORD>@localhost:5432/$DatabaseName"
