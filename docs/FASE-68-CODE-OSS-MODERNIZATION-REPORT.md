# FASE 68 — Code-OSS Modernization Report

**Data:** 2026-06-09  
**Branch:** `fix/princy-code-modern-code-oss`  
**Projeto:** `D:\Projetos\Princy-AI-Editor`

## Resumo

| Item | Antes | Depois |
|------|-------|--------|
| Code-OSS pin | 1.96.2 | **1.123.0** |
| Pipeline | yarn (scripts) / npm (vendor) | **npm-only** |
| Node vendor | 20/22 (doc) | **24.15.0** (`.nvmrc`) |
| Extensões engines | ^1.85.0 | **^1.123.0** |
| URLs VPS | 13.140.129.77 | **inalteradas** |
| Branding | Princy Code | **preservado + reaplicado** |

## Fases concluídas (código e config)

- [x] Branch `fix/princy-code-modern-code-oss`
- [x] `VSCODE_PIN.md` → 1.123.0
- [x] `init-vscode-submodule.mjs` lê pin + valida tag
- [x] `.gitmodules` → branch 1.123.0
- [x] Vendor reset + clone 1.123.0 (`git describe` = 1.123.0)
- [x] Scripts migrados: `vscode-compile.mjs`, `build-win.mjs`, `build-linux.mjs`
- [x] `patch-code-oss.mjs`: `force_process_config=false` no Windows (evita ClangCL)
- [x] Extensões atualizadas + sync OK
- [x] `princy-code:patch` OK (product.json, 4 extensões, icon, welcome)
- [x] Auditoria VPS: sem localhost nos defaults
- [x] CI workflow Node 24 + Python env
- [x] `env-vendor-win.ps1` helper script
- [x] Documentação FASE-68 + build-notes

## Erros encontrados e mitigações

### 1. Node 22 rejeitado pelo vendor 1.123

**Erro:** `Please use Node.js v24.15.0 or newer`  
**Fix:** Usar `nvm use 24.15.0` para vendor build; documentado em `VSCODE_PIN.md`.

### 2. ClangCL / tree-sitter / @vscode/deviceid

**Erro:** `MSB8020: ClangCL toolset not found`  
**Causa:** Node 24 + `force_process_config=true` em `build/.npmrc` faz node-gyp gerar projetos ClangCL.  
**Fix:** `patch-code-oss.mjs` define `force_process_config="false"` em `.npmrc` e `build/.npmrc`; scripts passam `npm_config_force_process_config=false`.

### 3. nvm symlink quebrado em shells novos

**Workaround:** Usar path direto `C:\Users\hp\AppData\Local\nvm\v24.15.0` ou `env-vendor-win.ps1`.

## Build status (runtime)

| Etapa | Status |
|-------|--------|
| `npm ci` vendor | em execução / verificar log |
| `npm run compile` Code-OSS | pendente |
| `princy-code:compile` | pendente |
| `Princy-Code-Setup.exe` | pendente |

## Comandos pós-merge (referência)

```powershell
. D:\Projetos\Princy-AI-Editor\apps\princy-code\scripts\env-vendor-win.ps1
cd D:\Projetos\Princy-AI-Editor
npm run princy-code:init-submodule
npm run princy-code:sync
npm run princy-code:patch
cd apps\princy-code\vendor\vscode
npm ci
npm run compile
cd D:\Projetos\Princy-AI-Editor
npm run princy-code:build:win
```

## Pendências

1. Confirmar `npm ci` + `compile` + `build:win` com sucesso nesta máquina
2. QA manual pós-instalação (checklist FASE-68-BUILD-CHECKLIST.md)
3. Aprovação humana antes de commit
4. Opcional: instalar **C++ Clang tools** no VS Build Tools se algum módulo ainda exigir ClangCL nativo

## Regras respeitadas

- Nenhum commit automático
- Nenhuma funcionalidade Princy removida
- Sem localhost/127.0.0.1 como defaults
- Sem Electron shell / sem Copilot / sem Cursor na UI
