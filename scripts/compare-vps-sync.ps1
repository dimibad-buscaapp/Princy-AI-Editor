<#
.SYNOPSIS
  Compare Git state between local PC repo and VPS (same commit / dirty files).
#>
param(
    [string]$VpsHost,
    [string]$RemotePath,
    [string]$RemoteUser,
    [string]$Branch
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "deploy.config.ps1")
if (!$VpsHost) { $VpsHost = $PrincyDeploy.VpsHost }
if (!$RemotePath) { $RemotePath = $PrincyDeploy.VpsRepoPath }
if (!$RemoteUser) { $RemoteUser = $PrincyDeploy.RemoteUser }
if (!$Branch) { $Branch = $PrincyDeploy.Branch }

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

git -C $repoRoot fetch origin $Branch 2>$null | Out-Null
$pcCommit = (git -C $repoRoot rev-parse HEAD).Trim()
$pcShort = (git -C $repoRoot rev-parse --short HEAD).Trim()
$pcDirty = (git -C $repoRoot status --porcelain).Trim()
$originMain = (git -C $repoRoot rev-parse "origin/$Branch").Trim()

$remoteScript = @"
Set-Location '$RemotePath'
git fetch origin 2>`$null
Write-Output ((git rev-parse HEAD).Trim())
Write-Output ((git rev-parse --short HEAD).Trim())
Write-Output ((git rev-parse origin/$Branch).Trim())
Write-Output ((git status --porcelain).Trim())
Write-Output ((git log -1 --oneline).Trim())
"@

$encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($remoteScript))
$raw = ssh -o BatchMode=yes "${RemoteUser}@${VpsHost}" "powershell -NoProfile -EncodedCommand $encoded"
$lines = @($raw -split "`r?`n" | Where-Object { $_.Trim() -ne "" })

$vpsCommit = $lines[0]
$vpsShort = $lines[1]
$vpsOrigin = $lines[2]
$vpsDirty = if ($lines.Length -gt 4) { ($lines[3..($lines.Length - 2)] -join "`n").Trim() } else { $lines[3].Trim() }
$vpsLog = $lines[-1]

Write-Host "=== PC vs VPS ($Branch) ===" -ForegroundColor Cyan
Write-Host "PC  : $pcShort  $pcCommit"
Write-Host "VPS : $vpsShort  $vpsCommit"
Write-Host "GitHub origin/$Branch : $(git -C $repoRoot rev-parse --short origin/$Branch)"
Write-Host "VPS log: $vpsLog"
Write-Host ""

$ok = $true
if ($pcCommit -ne $vpsCommit) {
    Write-Host "DIFF: PC and VPS are on different commits." -ForegroundColor Red
    $ok = $false
}
else {
    Write-Host "OK: Same commit on PC and VPS." -ForegroundColor Green
}

if ($vpsCommit -ne $originMain) {
    Write-Host "VPS is not at origin/$Branch — run: npm run deploy:vps" -ForegroundColor Yellow
    $ok = $false
}

if ($pcDirty) {
    Write-Host "PC has uncommitted changes." -ForegroundColor Yellow
}
if ($vpsDirty) {
    Write-Host "VPS has local modifications:" -ForegroundColor Yellow
    Write-Host $vpsDirty
    $ok = $false
}

if (!$ok) { exit 1 }
