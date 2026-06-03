# VPS helper: reads .env, enables pgvector, runs prisma migrate deploy.
# Assumes repo at C:\Apps\Princy-Ai-Editor and failed pgvector migration rolled back first if needed.
param(
    [string]$RepoRoot = "C:\Apps\Princy-Ai-Editor"
)

$ErrorActionPreference = "Stop"
Set-Location $RepoRoot

Write-Host "=== 1/5 install pgvector binaries (Admin) ==="
powershell -ExecutionPolicy Bypass -File (Join-Path $RepoRoot "scripts\windows\install-pgvector-windows.ps1")

Write-Host "=== 2/5 setup-pgvector (reads .env) ==="
powershell -ExecutionPolicy Bypass -File (Join-Path $RepoRoot "scripts\windows\setup-pgvector.ps1")

Write-Host "=== 3/5 prisma migrate deploy ==="
Set-Location (Join-Path $RepoRoot "packages\database")
$envFile = Join-Path $RepoRoot ".env"
if (Test-Path $envFile) {
    $line = Select-String -Path $envFile -Pattern '^\s*DATABASE_URL\s*=' | Select-Object -First 1
    if ($line) {
        $env:DATABASE_URL = $line.Line -replace '^\s*DATABASE_URL\s*=\s*', '' -replace '^["'']|["'']$', ''
    }
}
npx prisma migrate resolve --rolled-back 20260603120000_pgvector_memory_v2 2>$null
npx prisma migrate deploy
npx prisma migrate status

Write-Host "=== 4/5 build ==="
Set-Location $RepoRoot
npm run build

Write-Host "=== 5/5 restart services ==="
npm run services:restart
npm run health

Write-Host "Done."
