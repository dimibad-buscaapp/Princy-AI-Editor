<#
.SYNOPSIS
  Creates or updates C:\Apps\Princy-Ai-Editor\.env for VPS production.
#>
param(
    [string]$AppPath = "C:\Apps\Princy-Ai-Editor",
    [string]$Template = ".env.production.example",
    [switch]$ForceRegenerateSecrets
)

$ErrorActionPreference = "Stop"

function New-Secret {
    $bytes = New-Object byte[] 48
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', 'x').Replace('/', 'y')
}

function Read-EnvMap {
    param([string]$Path)
    $map = [ordered]@{}
    if (!(Test-Path $Path)) {
        return $map
    }
    foreach ($line in Get-Content $Path -Encoding UTF8) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$' -and $line -notmatch '^\s*#') {
            $map[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
        }
    }
    return $map
}

function Write-EnvFile {
    param(
        [string]$Path,
        [System.Collections.IDictionary]$Map,
        [string[]]$TemplateLines
    )
    $written = @{}
    $out = New-Object System.Collections.Generic.List[string]
    foreach ($line in $TemplateLines) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=') {
            $key = $Matches[1]
            if ($Map.Contains($key)) {
                $out.Add("$key=$($Map[$key])")
                $written[$key] = $true
            }
            else {
                $out.Add($line)
            }
        }
        else {
            $out.Add($line)
        }
    }
    foreach ($key in $Map.Keys) {
        if (!$written.ContainsKey($key)) {
            $out.Add("$key=$($Map[$key])")
        }
    }
    Set-Content -Path $Path -Value $out -Encoding UTF8
}

$repo = if (Test-Path (Join-Path $AppPath "package.json")) { $AppPath } else { (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path }
$templatePath = Join-Path $repo $Template
$envPath = Join-Path $repo ".env"

if (!(Test-Path $templatePath)) {
    throw "Template not found: $templatePath"
}

$templateLines = Get-Content $templatePath -Encoding UTF8
$existing = Read-EnvMap -Path $envPath
$map = Read-EnvMap -Path $templatePath

foreach ($key in $existing.Keys) {
    $val = $existing[$key]
    if ($val -and $val -notmatch 'CHANGE_ME|GERAR_|SUA_SENHA') {
        $map[$key] = $val
    }
}

if ($map["DATABASE_URL"] -match 'CHANGE_ME|SUA_SENHA|GERAR_') {
    $dbPass = Read-Host "PostgreSQL password (user postgres)" -AsSecureString
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass)
    )
    $map["DATABASE_URL"] = "postgresql://postgres:${plain}@localhost:5432/princy_ai_editor"
}

$jwt = [string]$map["JWT_SECRET"]
$needJwt = $ForceRegenerateSecrets -or !$jwt -or ($jwt -match 'CHANGE_ME|GERAR_') -or ($jwt.Length -lt 32)
if ($needJwt) {
    $map["JWT_SECRET"] = New-Secret
    Write-Host "Generated JWT_SECRET"
}

$refresh = [string]$map["JWT_REFRESH_SECRET"]
$needRefresh = $ForceRegenerateSecrets -or !$refresh -or ($refresh -match 'CHANGE_ME|GERAR_') -or ($refresh.Length -lt 32)
if ($needRefresh) {
    $map["JWT_REFRESH_SECRET"] = New-Secret
    Write-Host "Generated JWT_REFRESH_SECRET"
}

$map["APP_ENV"] = "production"
$map["NODE_ENV"] = "production"
$map["HOST"] = "0.0.0.0"
$map["PRINCY_LOG_DIR"] = Join-Path $repo "logs"

Write-EnvFile -Path $envPath -Map $map -TemplateLines $templateLines
Write-Host "Wrote $envPath"

$frontendEnv = Join-Path $repo "apps\frontend\.env"
Copy-Item $envPath $frontendEnv -Force
Write-Host "Synced $frontendEnv for Next.js"

Push-Location $repo
try {
    node scripts/validate-production-env.mjs
    if ($LASTEXITCODE -ne 0) {
        throw "Validation failed"
    }
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Next:"
Write-Host "  npm run build"
Write-Host "  npm run services:install"
Write-Host "  npm run services:restart"
Write-Host "  npm run health"
