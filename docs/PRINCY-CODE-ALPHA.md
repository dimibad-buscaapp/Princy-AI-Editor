# Princy Code Alpha

Princy Code Alpha entrega a extensão VS Code funcional + scaffold para IDE custom Code-OSS.

## O que está incluído

- **VSIX:** `princy-assistant` com chat SSE, ghost text, inline actions, patch, terminal IA, swarm tasks, context graph, autonomous opt-in
- **Tema:** Princy Dark Neural
- **Gateway:** `http://13.140.129.77:3407`
- **Scaffold Code-OSS:** `apps/princy-code/` (sem build `.exe` nesta fase)

## Roadmap pós-Alpha

1. Submodule `microsoft/vscode`
2. Extensão built-in via `patch-code-oss.mjs`
3. Instaladores Windows/macOS/Linux
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

Ver também [VSCODE-EXTENSION-USAGE.md](./VSCODE-EXTENSION-USAGE.md).
