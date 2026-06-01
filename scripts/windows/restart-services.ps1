param(
    [int]$StartupDelaySeconds = 2
)

$ErrorActionPreference = "Stop"

$services = @(
    "PrincyFrontend",
    "PrincyApi",
    "PrincyAgents",
    "PrincyWorkspace",
    "PrincyContextGraph",
    "PrincyMemory",
    "PrincyAutomation",
    "PrincyGateway",
    "PrincyMCP"
)

foreach ($name in $services) {
    $service = Get-Service -Name $name -ErrorAction SilentlyContinue
    if (!$service) {
        Write-Host "$name not installed"
        continue
    }

    if ($service.Status -eq "Running") {
        Restart-Service -Name $name -Force
    }
    else {
        Start-Service -Name $name
    }

    Start-Sleep -Seconds $StartupDelaySeconds
    $updated = Get-Service -Name $name
    Write-Host "$name $($updated.Status)"
}
