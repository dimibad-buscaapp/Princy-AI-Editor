param(
    [string]$VpsHost = "108.181.169.40",
    [string]$RemotePath = "C:\Apps\Princy-Ai-Editor",
    [string]$Repository = "https://github.com/dimibad-buscaapp/Princy-AI-Editor.git",
    [string]$RemoteUser = "Administrator"
)

$ErrorActionPreference = "Stop"

Write-Host "Deploy target: $RemoteUser@$VpsHost"
Write-Host "Remote path: $RemotePath"

$remoteCommand = @"
`$ErrorActionPreference = "Stop"
if (!(Test-Path '$RemotePath')) {
  New-Item -ItemType Directory -Force -Path '$RemotePath' | Out-Null
}
if (!(Test-Path '$RemotePath\.git')) {
  git clone '$Repository' '$RemotePath'
}
Set-Location '$RemotePath'
git pull
if (!(Test-Path '.env') -and (Test-Path '.env.example')) {
  Copy-Item '.env.example' '.env'
}
npm install
npm run build --if-present
"@

$encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($remoteCommand))
ssh "$RemoteUser@$VpsHost" "powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand $encodedCommand"
