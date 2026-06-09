# Code-OSS Pin

| Field | Value |
|-------|-------|
| Repository | https://github.com/microsoft/vscode |
| Tag pin | `1.123.0` |
| Submodule path | `apps/princy-code/vendor/vscode` |

**Importante:** sempre usar tag fixa — nunca `main` solto.

## Upgrade procedure

1. Atualizar `Tag pin` neste arquivo
2. Deletar `apps/princy-code/vendor/vscode`
3. `npm run princy-code:init-submodule`
4. `cd apps/princy-code/vendor/vscode && npm ci`
5. `npm run compile` (dentro do vendor)
6. `npm run princy-code:patch`
7. `npm run princy-code:compile`
8. Smoke test extensões Princy

## Build requirements

- **Node.js 24.15.0+** (conforme `.nvmrc` do vendor — `nvm use 24.15.0`)
- **npm 10.x** (não yarn — vendor rejeita yarn no preinstall)
- **Python 3.11** (Windows — native modules)
- 16 GB RAM recomendado
- Windows: Visual Studio Build Tools 2022 (C++)
- Linux: build-essential, libsecret, libxkbfile

## Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `yarn which is not supported` / `npm i instead` | Usou yarn ou clonou `main` | Usar `npm ci`; re-clonar tag do pin |
| `git describe` não bate com pin | Checkout errado | Deletar vendor, `npm run princy-code:init-submodule` |
| Node version check failed | Node 24+ | Usar Node 22: `nvm use 22` |
| vscode.d.ts type conflicts | Pin antigo | Atualizar para tag moderna (ex. 1.123.0) |
