# Princy AI Editor — deploy/sync defaults (PC, VPS, GitHub)
# Dot-sourced by scripts/deploy-vps.ps1 and scripts/compare-vps-sync.ps1

$PrincyDeploy = @{
    LocalRepoPath  = "C:\Users\hp\Desktop\Princy-AI-Editor"
    VpsRepoPath    = "C:\Apps\Princy-Ai-Editor"
    Repository     = "https://github.com/dimibad-buscaapp/Princy-AI-Editor.git"
    VpsHost        = "108.181.169.40"
    RemoteUser     = "Administrator"
    Branch         = "main"
    # URLs publicas (portas fixas do monorepo)
    FrontendUrl    = "http://108.181.169.40:3400"
    GatewayUrl     = "http://108.181.169.40:3407"
    ApiUrl         = "http://108.181.169.40:3407/api"
}
