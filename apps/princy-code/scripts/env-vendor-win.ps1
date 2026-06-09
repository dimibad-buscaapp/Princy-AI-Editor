# Princy Code — Windows vendor build environment
# Usage: . .\apps\princy-code\scripts\env-vendor-win.ps1

$node24 = "C:\Users\hp\AppData\Local\nvm\v24.15.0"
$env:Path = "$node24;$node24\node_modules\npm\bin;" + $env:Path

$env:PYTHON = "C:\Users\hp\AppData\Local\Programs\Python\Python311\python.exe"
$env:npm_config_python = $env:PYTHON
# Node 24 ships clang=1 in process.config; use MSVC for native addons (tree-sitter).
$env:npm_config_force_process_config = "false"

$llvmBin = "D:\Projetos\Princy-AI-Editor\.tools\llvm\bin"
if (Test-Path "$llvmBin\clang-cl.exe") {
  $env:Path = "$llvmBin;" + $env:Path
}

$vsLlvm = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\Llvm\bin"
if (Test-Path "$vsLlvm\clang-cl.exe") {
  $env:Path = "$vsLlvm;" + $env:Path
}

Write-Host "Node: $(node -v)"
Write-Host "npm:  $(npm -v)"
Write-Host "Python: $env:PYTHON"
