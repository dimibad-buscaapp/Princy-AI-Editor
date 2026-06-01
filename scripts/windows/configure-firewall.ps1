param(
    [string]$LocalSubnet = "LocalSubnet"
)

$ErrorActionPreference = "Stop"

$publicPorts = @(3400, 3407)
$internalPorts = @(3401, 3402, 3403, 3404, 3405, 3406, 3408, 3409)

foreach ($port in $publicPorts) {
    $ruleName = "Princy AI Editor Public Port $port"
    if (!(Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow | Out-Null
    }
}

foreach ($port in $internalPorts) {
    $oldRuleName = "Princy AI Editor Port $port"
    Get-NetFirewallRule -DisplayName $oldRuleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule

    $ruleName = "Princy AI Editor Internal Port $port"
    if (!(Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule `
            -DisplayName $ruleName `
            -Direction Inbound `
            -Protocol TCP `
            -LocalPort $port `
            -RemoteAddress @("127.0.0.1", "::1", $LocalSubnet) `
            -Action Allow | Out-Null
    }
}

Write-Host "Firewall configured. Public ports: 3400, 3407. Internal ports: 3401-3406, 3408-3409."
