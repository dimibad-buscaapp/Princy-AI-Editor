$ErrorActionPreference = "Stop"

$services = @(
    @{ Name = "Frontend"; Url = "http://127.0.0.1:3400" },
    @{ Name = "API"; Url = "http://127.0.0.1:3401/health" },
    @{ Name = "Agents"; Url = "http://127.0.0.1:3402/health" },
    @{ Name = "Workspace Service"; Url = "http://127.0.0.1:3403/health" },
    @{ Name = "Context Graph"; Url = "http://127.0.0.1:3404/health" },
    @{ Name = "Memory Service"; Url = "http://127.0.0.1:3405/health" },
    @{ Name = "Automation Service"; Url = "http://127.0.0.1:3406/health" },
    @{ Name = "Gateway"; Url = "http://127.0.0.1:3407/health" },
    @{ Name = "MCP Server"; Url = "http://127.0.0.1:3408/health" }
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri $service.Url -UseBasicParsing -TimeoutSec 3
        Write-Host "$($service.Name): $($response.StatusCode) $($service.Url)"
    }
    catch {
        Write-Host "$($service.Name): unavailable $($service.Url)"
    }
}
