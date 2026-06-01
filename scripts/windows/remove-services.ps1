param(
    [string]$NssmPath = ""
)

$ErrorActionPreference = "Stop"

function Resolve-Nssm {
    param([string]$ExplicitPath = "")

    if ($ExplicitPath -and (Test-Path $ExplicitPath)) {
        return (Resolve-Path $ExplicitPath).Path
    }

    $command = Get-Command "nssm.exe" -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    throw "nssm.exe was not found. Install NSSM or pass -NssmPath."
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

$nssm = Resolve-Nssm -ExplicitPath $NssmPath
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

    if ($service.Status -ne "Stopped") {
        Stop-Service -Name $name -Force -ErrorAction SilentlyContinue
    }

    Invoke-Nssm -Nssm $nssm -Arguments @("remove", $name, "confirm")
    Write-Host "$name removed"
}
