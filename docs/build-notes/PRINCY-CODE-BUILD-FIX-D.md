# Princy Code Build Fix — Disco D

**Data:** 2026-06-08  
**Branch:** `fix/princy-code-modern-code-oss`  
**Projeto:** `D:\Projetos\Princy-AI-Editor`

## Ambiente baseline

| Ferramenta | Versão |
|------------|--------|
| Node.js (monorepo) | v22.22.0 |
| Node.js (vendor 1.123) | **v24.15.0** (`.nvmrc`) |
| npm | 10.9.4 |
| Python | 3.11.9 |
| Visual Studio | Build Tools 2022 (MSVC + ClangCL para tree-sitter) |
| OS | Windows 10 |

## Vendor antes da migração

| Campo | Valor |
|-------|-------|
| Tag pin (VSCODE_PIN.md) | `1.96.2` |
| `git describe --tags` | `1.96.2` |
| `package.json` version | `1.96.2` |

## Erro conhecido (pré-migração)

`npm run compile` no vendor 1.96.2 falha com conflitos de tipos em `src/vscode-dts/vscode.d.ts`:

- `ChatParticipantToolToken`
- `LanguageModelToolCallPart`
- `LanguageModelPromptTsxPart`
- `LanguageModelToolResult`
- `ChatResponsePart`
- `ChatRequestHandler`

**Causa:** base Code-OSS 1.96.2 incompatível com APIs modernas de Chat/Language Model exigidas pelas extensões Princy.

**Scripts Princy** ainda referenciavam `yarn`, mas o vendor 1.96.2 `preinstall.js` rejeita yarn (`npm i` only).

## Decisão

Migrar vendor para **Code-OSS 1.123.0** (última stable), pipeline **npm-only**, preservar branding/extensões Princy e URLs VPS.

## Comandos de referência

```powershell
cd D:\Projetos\Princy-AI-Editor
npm run princy-code:init-submodule
npm run princy-code:sync
npm run princy-code:patch
npm run princy-code:compile
npm run princy-code:build:win
```

## Resultado (preencher após execução)

| Etapa | Status | Notas |
|-------|--------|-------|
| Vendor 1.123.0 clone | pendente | |
| npm ci vendor | pendente | |
| compile Code-OSS puro | pendente | |
| princy-code:sync/patch/compile | pendente | |
| Princy-Code-Setup.exe | pendente | |
