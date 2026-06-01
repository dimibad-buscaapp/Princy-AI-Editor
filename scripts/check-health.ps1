$ErrorActionPreference = "Stop"

$services = @(
    @{ Name = "Frontend"; Url = "http://127.0.0.1:3400" },
    @{ Name = "API"; Url = "http://127.0.0.1:3401/health/ready" },
    @{ Name = "Agents"; Url = "http://127.0.0.1:3402/health/ready" },
    @{ Name = "Workspace Service"; Url = "http://127.0.0.1:3403/health/ready" },
    @{ Name = "Context Graph"; Url = "http://127.0.0.1:3404/health/ready" },
    @{ Name = "Memory Service"; Url = "http://127.0.0.1:3405/health/ready" },
    @{ Name = "Automation Service"; Url = "http://127.0.0.1:3406/health/ready" },
    @{ Name = "Gateway"; Url = "http://127.0.0.1:3407/health/ready" },
    @{ Name = "Gateway Dependencies"; Url = "http://127.0.0.1:3407/gateway/ready" },
    @{ Name = "MCP Server"; Url = "http://127.0.0.1:3408/health/ready" }
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
