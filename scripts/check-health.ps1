$ErrorActionPreference = "Stop"

$services = @(
    @{ Name = "Frontend"; Url = "http://localhost:3400" },
    @{ Name = "API"; Url = "http://localhost:3401/health" },
    @{ Name = "Agents"; Url = "http://localhost:3402/health" },
    @{ Name = "Workspace Service"; Url = "http://localhost:3403/health" },
    @{ Name = "Context Graph"; Url = "http://localhost:3404/health" },
    @{ Name = "Memory Service"; Url = "http://localhost:3405/health" },
    @{ Name = "Automation Service"; Url = "http://localhost:3406/health" },
    @{ Name = "Gateway"; Url = "http://localhost:3407/health" },
    @{ Name = "MCP Server"; Url = "http://localhost:3408/health" }
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
