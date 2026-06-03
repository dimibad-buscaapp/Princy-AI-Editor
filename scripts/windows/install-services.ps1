param(
    [string]$AppPath = "C:\Apps\Princy-Ai-Editor",
    [string]$NssmPath = "",
    [string]$NodeEnv = "production",
    [switch]$SkipStart
)

$ErrorActionPreference = "Stop"

function Resolve-Executable {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [string]$ExplicitPath = ""
    )

    if ($ExplicitPath -and (Test-Path $ExplicitPath)) {
        return (Resolve-Path $ExplicitPath).Path
    }

    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    throw "Executable '$Name' was not found. Install it or pass the full path."
}

function Invoke-Nssm {
    param(
        [Parameter(Mandatory = $true)][string]$Nssm,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    & $Nssm @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "nssm $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

if (!(Test-Path (Join-Path $AppPath "package.json"))) {
    throw "package.json not found in $AppPath. Deploy the project before installing services."
}

Push-Location $AppPath
try {
    node scripts/validate-production-env.mjs
    if ($LASTEXITCODE -ne 0) {
        throw ".env validation failed. Run: npm run env:setup"
    }
}
finally {
    Pop-Location
}

$nssm = Resolve-Executable -Name "nssm.exe" -ExplicitPath $NssmPath
$npm = Resolve-Executable -Name "npm.cmd"
$logsPath = Join-Path $AppPath "logs"
New-Item -ItemType Directory -Force -Path $logsPath | Out-Null

$services = @(
    @{ Name = "PrincyFrontend"; Workspace = "@princy/frontend"; Dist = "" },
    @{ Name = "PrincyApi"; Workspace = "@princy/api"; Dist = "services/api/dist/index.js" },
    @{ Name = "PrincyAgents"; Workspace = "@princy/agents"; Dist = "services/agents/dist/index.js" },
    @{ Name = "PrincyWorkspace"; Workspace = "@princy/workspace-service"; Dist = "services/workspace-service/dist/index.js" },
    @{ Name = "PrincyContextGraph"; Workspace = "@princy/context-graph"; Dist = "services/context-graph/dist/index.js" },
    @{ Name = "PrincyMemory"; Workspace = "@princy/memory-service"; Dist = "services/memory-service/dist/index.js" },
    @{ Name = "PrincyAutomation"; Workspace = "@princy/automation-service"; Dist = "services/automation-service/dist/index.js" },
    @{ Name = "PrincyGateway"; Workspace = "@princy/gateway"; Dist = "services/gateway/dist/index.js" },
    @{ Name = "PrincyMCP"; Workspace = "@princy/mcp-server"; Dist = "services/mcp-server/dist/index.js" }
)

foreach ($service in $services) {
    $name = $service.Name
    $workspace = $service.Workspace
    $dist = $service.Dist
    $stdout = Join-Path $logsPath "$name.out.log"
    $stderr = Join-Path $logsPath "$name.err.log"
    $existing = Get-Service -Name $name -ErrorAction SilentlyContinue

    if ($dist -and !(Test-Path (Join-Path $AppPath $dist))) {
        throw "$name production build was not found at $dist. Run npm run build before installing services."
    }

    if (!$existing) {
        Invoke-Nssm -Nssm $nssm -Arguments @("install", $name, $npm, "run", "start", "-w", $workspace)
    }
    else {
        Invoke-Nssm -Nssm $nssm -Arguments @("set", $name, "Application", $npm)
        Invoke-Nssm -Nssm $nssm -Arguments @("set", $name, "AppParameters", "run start -w $workspace")
    }

    Invoke-Nssm -Nssm $nssm -Arguments @("set", $name, "AppDirectory", $AppPath)
    Invoke-Nssm -Nssm $nssm -Arguments @("set", $name, "AppStdout", $stdout)
    Invoke-Nssm -Nssm $nssm -Arguments @("set", $name, "AppStderr", $stderr)
    Invoke-Nssm -Nssm $nssm -Arguments @("set", $name, "AppRotateFiles", "1")
    Invoke-Nssm -Nssm $nssm -Arguments @("set", $name, "AppRotateOnline", "1")
    Invoke-Nssm -Nssm $nssm -Arguments @("set", $name, "AppRotateBytes", "10485760")
    Invoke-Nssm -Nssm $nssm -Arguments @("set", $name, "AppThrottle", "1500")
    Invoke-Nssm -Nssm $nssm -Arguments @("set", $name, "AppRestartDelay", "5000")
    Invoke-Nssm -Nssm $nssm -Arguments @("set", $name, "Start", "SERVICE_AUTO_START")
    $logDir = Join-Path $AppPath "logs"
    Invoke-Nssm -Nssm $nssm -Arguments @(
        "set", $name, "AppEnvironmentExtra",
        "NODE_ENV=$NodeEnv",
        "HOST=0.0.0.0",
        "PRINCY_LOG_DIR=$logDir"
    )

    if (!$SkipStart) {
        $current = Get-Service -Name $name -ErrorAction SilentlyContinue
        if ($current -and $current.Status -eq "Running") {
            Restart-Service -Name $name -Force
        }
        else {
            Start-Service -Name $name
        }
    }

    Write-Host "$name configured for $workspace"
}

Write-Host "Princy AI Editor Windows services are installed."
