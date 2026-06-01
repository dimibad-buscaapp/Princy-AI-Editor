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

$nssm = Resolve-Executable -Name "nssm.exe" -ExplicitPath $NssmPath
$npm = Resolve-Executable -Name "npm.cmd"
$logsPath = Join-Path $AppPath "logs"
New-Item -ItemType Directory -Force -Path $logsPath | Out-Null

$services = @(
    @{ Name = "PrincyFrontend"; Workspace = "@princy/frontend" },
    @{ Name = "PrincyApi"; Workspace = "@princy/api" },
    @{ Name = "PrincyAgents"; Workspace = "@princy/agents" },
    @{ Name = "PrincyWorkspace"; Workspace = "@princy/workspace-service" },
    @{ Name = "PrincyContextGraph"; Workspace = "@princy/context-graph" },
    @{ Name = "PrincyMemory"; Workspace = "@princy/memory-service" },
    @{ Name = "PrincyAutomation"; Workspace = "@princy/automation-service" },
    @{ Name = "PrincyGateway"; Workspace = "@princy/gateway" },
    @{ Name = "PrincyMCP"; Workspace = "@princy/mcp-server" }
)

foreach ($service in $services) {
    $name = $service.Name
    $workspace = $service.Workspace
    $stdout = Join-Path $logsPath "$name.out.log"
    $stderr = Join-Path $logsPath "$name.err.log"
    $existing = Get-Service -Name $name -ErrorAction SilentlyContinue

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
    Invoke-Nssm -Nssm $nssm -Arguments @("set", $name, "AppEnvironmentExtra", "NODE_ENV=$NodeEnv", "HOST=0.0.0.0")

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
