# Princy Code Alpha

> **Transição:** A Fase 33 evoluiu o frontend e desktop para **Princy Code Beta**. Ver [FASE-33-PRINCY-CODE-BETA.md](./FASE-33-PRINCY-CODE-BETA.md).

Princy Code Alpha entrega a extensão VS Code funcional + scaffold para IDE custom Code-OSS.

## O que está incluído

- **VSIX:** `princy-assistant` com chat SSE, ghost text, inline actions, patch, terminal IA, swarm tasks, context graph, autonomous opt-in
- **Tema:** Princy Dark Neural
- **Gateway:** `http://13.140.129.77:3407`
- **Scaffold Code-OSS:** `apps/princy-code/`
- **Desktop Electron (Fase 32–33):** `apps/desktop` — shell **Princy Code Beta**, instalador `Princy-Code-Setup.exe`

## Roadmap pós-Alpha

1. Submodule `microsoft/vscode`
2. Extensão built-in via `patch-code-oss.mjs`
3. Instaladores macOS/Linux assinados
4. Swarm neural UI na extensão desktop

## Checklist Alpha

- [x] Sign In + token SecretStorage
- [x] Chat streaming com métricas TTFT
- [x] Ghost text 500ms
- [x] Inline explain/refactor/fix/tests
- [x] Patch preview/apply/rollback
- [x] Swarm tasks API
- [x] Workspace profile + memory V2
- [ ] Screenshots oficiais (adicionar em release)

## Build VSIX

```bash
npm run package:vscode-extension
```

## Build Desktop (Fase 32)

```bash
npm run desktop:dev      # desenvolvimento
npm run desktop:dist     # Princy-Code-Setup.exe (Windows)
```

Ver [FASE-32-ELECTRON-DESKTOP.md](./FASE-32-ELECTRON-DESKTOP.md) e [VSCODE-EXTENSION-USAGE.md](./VSCODE-EXTENSION-USAGE.md).
