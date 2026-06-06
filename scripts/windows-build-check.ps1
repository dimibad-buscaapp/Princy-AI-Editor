#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

$Failures = 0
function Pass([string]$Msg) { Write-Host "OK   $Msg" -ForegroundColor Green }
function Fail([string]$Msg) { Write-Host "FAIL $Msg" -ForegroundColor Red; $script:Failures++ }

Write-Host "=== Princy Windows Build Check ===" -ForegroundColor Cyan

# Node version
try {
  $nodeVersion = (node -v) -replace '^v', ''
  $major = [int]($nodeVersion.Split('.')[0])
  if ($major -ge 22) { Pass "Node $nodeVersion" } else { Fail "Node $nodeVersion (need >= 22)" }
} catch {
  Fail "Node not found"
}

# Required files
$required = @(
  "apps/desktop/electron-builder.yml",
  "apps/desktop/assets/icon.ico",
  "apps/desktop/assets/splash.html",
  "apps/desktop/package.json"
)
foreach ($rel in $required) {
  if (Test-Path (Join-Path $Root $rel)) { Pass "file $rel" } else { Fail "missing $rel" }
}

# electron-builder config sanity
$yml = Get-Content (Join-Path $Root "apps/desktop/electron-builder.yml") -Raw
if ($yml -match "artifactName: Princy-Code-Setup") { Pass "NSIS artifactName" } else { Fail "NSIS artifactName" }
if ($yml -match "owner: dimibad-buscaapp") { Pass "publish owner" } else { Fail "publish owner (expected dimibad-buscaapp)" }

Write-Host "--- desktop:build ---"
npm run desktop:build
if ($LASTEXITCODE -eq 0) { Pass "npm run desktop:build" } else { Fail "npm run desktop:build (exit $LASTEXITCODE)" }

if ($IsWindows -or $env:OS -match "Windows") {
  Write-Host "--- desktop:dist (Windows) ---"
  npm run desktop:dist
  if ($LASTEXITCODE -eq 0) { Pass "npm run desktop:dist" } else { Fail "npm run desktop:dist (exit $LASTEXITCODE)" }

  $setup = Join-Path $Root "apps/desktop/dist/Princy-Code-Setup.exe"
  if (Test-Path $setup) {
    $sizeMb = [math]::Round((Get-Item $setup).Length / 1MB, 2)
    Pass "Princy-Code-Setup.exe (${sizeMb} MB)"
  } else {
    Fail "apps/desktop/dist/Princy-Code-Setup.exe not found"
  }

  $updateYml = Get-ChildItem (Join-Path $Root "apps/desktop/dist") -Filter "*.yml" -ErrorAction SilentlyContinue
  if ($updateYml) { Pass "auto-update metadata ($($updateYml.Name))" } else { Fail "auto-update yml missing in dist/" }
} else {
  Write-Host "SKIP desktop:dist — requires Windows host" -ForegroundColor Yellow
}

Write-Host "=== Summary: $Failures failure(s) ==="
if ($Failures -gt 0) { exit 1 }
Write-Host "=== Windows Build Check OK ===" -ForegroundColor Green
