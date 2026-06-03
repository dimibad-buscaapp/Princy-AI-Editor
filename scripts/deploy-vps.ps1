<#
.SYNOPSIS
  Deploy Princy AI Editor to the Windows VPS via SSH + GitHub (clone or pull, install, build).

.DESCRIPTION
  Run from the PC repo root after pushing to GitHub:
    git push origin main
    npm run deploy:vps

  Requires: SSH key to VPS, Git and Node.js 22+ on the VPS.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/deploy-vps.ps1

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/deploy-vps.ps1 -FreshClone -ExactSync

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/deploy-vps.ps1 -RemoteUser "Administrator" -Branch main
#>
param(
    [string]$VpsHost = "108.181.169.40",
    [string]$RemotePath = "C:\Apps\Princy-Ai-Editor",
    [string]$Repository = "https://github.com/dimibad-buscaapp/Princy-AI-Editor.git",
    [string]$RemoteUser = "Administrator",
    [string]$Branch = "main",
    [switch]$FreshClone,
    [switch]$ExactSync,
    [switch]$SkipBuild,
    [switch]$SkipDbDeploy,
    [switch]$SkipServices,
    [switch]$SkipHealth,
    [switch]$SkipLocalPushCheck
)

$ErrorActionPreference = "Stop"

function Get-RepoRoot {
    $root = Split-Path -Parent $PSScriptRoot
    if (Test-Path (Join-Path $root ".git")) {
        return (Resolve-Path $root).Path
    }
    return (Get-Location).Path
}

function Test-LocalPushPending {
    param([string]$Root, [string]$BranchName)
    Push-Location $Root
    try {
        git fetch origin $BranchName 2>$null | Out-Null
        $ahead = git rev-list --count "origin/$BranchName..HEAD" 2>$null
        if ($LASTEXITCODE -ne 0) {
            return $null
        }
        return [int]$ahead
    }
    finally {
        Pop-Location
    }
}

$repoRoot = Get-RepoRoot
Write-Host "=== Princy deploy: PC -> VPS via GitHub ===" -ForegroundColor Cyan
Write-Host "PC repo:     $repoRoot"
Write-Host "VPS target:  ${RemoteUser}@${VpsHost}"
Write-Host "Remote path: $RemotePath"
Write-Host "Repository:  $Repository"
Write-Host "Branch:      $Branch"
Write-Host "FreshClone:  $FreshClone  ExactSync: $ExactSync"
Write-Host ""

if (!$SkipLocalPushCheck) {
    $ahead = Test-LocalPushPending -Root $repoRoot -BranchName $Branch
    if ($null -ne $ahead -and $ahead -gt 0) {
        Write-Warning "PC has $ahead commit(s) not on origin/$Branch. Push first:"
        Write-Host "  git push origin $Branch" -ForegroundColor Yellow
        $answer = Read-Host "Continue deploy anyway? (y/N)"
        if ($answer -notmatch '^[yY]') {
            exit 1
        }
    }
    else {
        $pcHead = (git -C $repoRoot rev-parse --short HEAD).Trim()
        $originHead = (git -C $repoRoot rev-parse --short "origin/$Branch" 2>$null).Trim()
        Write-Host "PC HEAD: $pcHead  |  origin/$Branch : $originHead"
    }
}

$fresh = if ($FreshClone) { "`$true" } else { "`$false" }
$exact = if ($ExactSync) { "`$true" } else { "`$false" }
$doBuild = if ($SkipBuild) { "`$false" } else { "`$true" }
$doDb = if ($SkipDbDeploy) { "`$false" } else { "`$true" }
$doServices = if ($SkipServices) { "`$false" } else { "`$true" }
$doHealth = if ($SkipHealth) { "`$false" } else { "`$true" }

$remoteCommand = @"
`$ErrorActionPreference = "Stop"
`$Branch = "$Branch"
`$Repository = "$Repository"
`$RemotePath = "$RemotePath"
`$FreshClone = $fresh
`$ExactSync = $exact
`$DoBuild = $doBuild
`$DoDb = $doDb
`$DoServices = $doServices
`$DoHealth = $doHealth

function Require-Command([string]`$Name) {
  if (!(Get-Command `$Name -ErrorAction SilentlyContinue)) {
    throw "`$Name not found on VPS PATH. Install it before deploy."
  }
}

Require-Command git
Require-Command npm
Require-Command node

Write-Host "Node: `$(node -v)  npm: `$(npm -v)  git: `$(git --version)"

`$envBackup = Join-Path `$env:TEMP "princy-deploy-env.backup"
if (Test-Path (Join-Path `$RemotePath ".env")) {
  Copy-Item (Join-Path `$RemotePath ".env") `$envBackup -Force
  Write-Host "Backed up .env to `$envBackup"
}

if (`$FreshClone -and (Test-Path `$RemotePath)) {
  Write-Host "Removing existing folder for fresh clone: `$RemotePath"
  Remove-Item -LiteralPath `$RemotePath -Recurse -Force
}

`$parent = Split-Path `$RemotePath -Parent
if (!(Test-Path `$parent)) {
  New-Item -ItemType Directory -Force -Path `$parent | Out-Null
}

if (!(Test-Path (Join-Path `$RemotePath ".git"))) {
  Write-Host "Cloning `$Repository (branch `$Branch)..."
  git clone --branch `$Branch `$Repository `$RemotePath
}
else {
  Write-Host "Updating existing repo..."
}

Set-Location `$RemotePath
git fetch origin
git checkout `$Branch
if (`$ExactSync) {
  git reset --hard "origin/`$Branch"
  git clean -fd
  Write-Host "Exact sync: HEAD = origin/`$Branch"
}
else {
  git pull origin `$Branch
}

if (Test-Path `$envBackup) {
  Copy-Item `$envBackup (Join-Path `$RemotePath ".env") -Force
  Write-Host "Restored .env from backup"
}
elseif (!(Test-Path ".env") -and (Test-Path ".env.example")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example — edit secrets on VPS before production use."
}

Write-Host "VPS commit: `$(git rev-parse --short HEAD)  `$(git log -1 --oneline)"

Write-Host "npm install..."
npm install

if (`$DoDb) {
  Write-Host "prisma migrate deploy..."
  npm run db:deploy
}

if (`$DoBuild) {
  Write-Host "npm run build..."
  npm run build
}

if (`$DoServices) {
  if (Get-Command nssm.exe -ErrorAction SilentlyContinue) {
    Write-Host "Installing/updating Windows services (NSSM)..."
    powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/windows/install-services.ps1" -AppPath `$RemotePath
    powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/windows/restart-services.ps1"
  }
  else {
    Write-Warning "nssm.exe not in PATH. Skip services. Run manually: npm run services:install"
  }
}

if (`$DoHealth) {
  Write-Host "Health check..."
  npm run health
}

Write-Host "Deploy finished on VPS at `$RemotePath"
"@

$encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($remoteCommand))

Write-Host "Connecting via SSH..." -ForegroundColor Cyan
ssh -o BatchMode=yes "${RemoteUser}@${VpsHost}" "powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand $encodedCommand"

if ($LASTEXITCODE -ne 0) {
    throw "SSH deploy failed (exit $LASTEXITCODE). Check SSH key, user, and VPS path."
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "Verify same commit on PC and VPS:"
Write-Host "  git rev-parse HEAD"
Write-Host "  ssh ${RemoteUser}@${VpsHost} `"cd $RemotePath; git rev-parse HEAD`""
