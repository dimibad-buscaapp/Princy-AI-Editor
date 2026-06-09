# FASE 67 — Auditoria do Repositório

Inventário completo do estado atual do monorepo Princy AI Editor em relação ao objetivo **Princy Code Desktop Real**.

Data de referência: FASE 67 (documentação).

---

## 1. Resumo executivo

| Pergunta | Resposta |
|----------|----------|
| Existe IDE Code-OSS? | **Não** — apenas scaffold em `apps/princy-code` |
| Existe extensão VS Code funcional? | **Sim** — `apps/vscode-extension` (VSIX 0.1.0) |
| Existe Electron desktop? | **Sim** — `apps/desktop` (shell URL, legado) |
| Existe UI rica de IA? | **Sim** — `apps/frontend` (Next.js) |
| Backend produção? | **Sim** — VPS `13.140.129.77` portas 3400–3409 |
| Docs FASE 67 anteriores? | **Não** — última fase documentada: FASE 65 |

---

## 2. Inventário por área

### 2.1 `apps/princy-code` — Scaffold Code-OSS

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `README.md` | Existe | Instruções futuras |
| `product.json.template` | Existe | Branding Princy Code, protocol `princy-code://` |
| `scripts/patch-code-oss.mjs` | Placeholder | Exige `vendor/vscode`; não implementado |

**Ausente:**

- `vendor/vscode` (submodule Code-OSS)
- `package.json`, scripts de build
- `extensions/` built-in
- `config/`, `patches/`, `assets/`
- Qualquer binário compilado

### 2.2 `apps/vscode-extension` — Extensão Princy Assistant

| Item | Detalhe |
|------|---------|
| Package | `princy-assistant` v0.1.0, publisher `princy-ai` |
| Build | esbuild → `dist/extension.js`; VSIX via `@vscode/vsce` |
| Dependência | `@princy/vscode-api-client` |
| Activation | `onStartupFinished`, `workspaceContains:**/*` |
| Gateway default | `http://13.140.129.77:3407/api` |

**Estrutura:**

```
apps/vscode-extension/
  src/extension.ts
  src/auth.ts
  src/princyClient.ts
  src/providers/ghostText.ts, inlineChat.ts
  src/patch/preview.ts
  src/terminal/monitor.ts
  src/security/fileGuard.ts
  src/webviews/chat/, swarm/, context/, autonomous/
  themes/princy-dark-neural.json
  media/princy-icon.svg
```

**Comandos (17):** sign in/out, chat, explain/refactor/fix/tests selection, patch preview/apply/rollback, terminal explain/fix, swarm, autonomous, index workspace, context graph.

**Views:** Activity bar `princy-ai` com Chat e Swarm webviews.

**Scripts raiz:**

- `npm run build:vscode-extension`
- `npm run package:vscode-extension`

### 2.3 `apps/desktop` — Electron Shell (legado)

| Item | Detalhe |
|------|---------|
| Package | `@princy/desktop` v1.0.0, Electron 34.5.8 |
| Modo atual | Cloud — carrega `PRINCY_FRONTEND_URL` (default VPS `:3400`) |
| Instalador | `Princy-Code-Setup.exe` via electron-builder NSIS |
| Capabilities | Splash, tray, health-check, auto-update, Ctrl+K IPC |

**Limitações vs FASE 67:**

- Não é IDE — BrowserWindow com URL remota
- Sem Explorer, Git, Terminal nativo, extensões VS Code
- `services.ts` (`startMonorepo`) existe mas não é usado no bootstrap cloud

**Arquivos principais:**

- `src/main.ts`, `src/bootstrap.ts`, `src/config/urls.ts`
- `src/preload.ts`, `src/health.ts`, `src/splash.ts`, `src/updater.ts`
- `electron-builder.yml`, `assets/icon.ico`, `assets/splash.html`

### 2.4 `apps/frontend` — UI web rica

Rotas relevantes para portar à IDE:

| Rota | Módulo | Maturidade |
|------|--------|------------|
| `/chat` | `features/chat/` | Produção — SSE, agent types, métricas |
| `/swarm` | `features/swarm/` | Produção — neural UI, SSE live, pipeline |
| `/editor/[projectId]` | `features/editor/` | Monaco, ghost text, inline chat |
| `/memoria` | `features/memory/` | Memory scopes, agent memory |
| `/marketplace` | `features/marketplace/` | Tabs Agents/Tools/Templates/Themes/MCP |
| `/observability` | `features/observability/` | Router stats, health, model metrics |
| `/automacoes` | `features/autonomous/` | Autonomous mode UI |
| `/mcp` | MCP management | Status, config |
| `/graph` | `features/context-graph/` | Context graph visual |
| `/configuracoes` | `features/configuracoes/` | Settings, modelos, sync |

Nav: `apps/frontend/src/design-system/layout/nav-items.ts`.

### 2.5 `packages/` — Bibliotecas reutilizáveis

| Package | Path | Uso FASE 67 |
|---------|------|-------------|
| `@princy/vscode-api-client` | `packages/vscode-api-client/` | **Crítico** — HTTP/SSE para extensões |
| `@princy/shared` (router) | `packages/shared/src/router/` | Neural Router V1 (backend) |
| `@princy/model-router` | `packages/model-router/` | Roteamento server-side |
| `@princy/ai-client` | `packages/ai-client/` | Ollama (backend) |
| `@princy/memory` | `packages/memory/` | Memory service lib |
| `@princy/core` | `packages/core/` | Auth, validation |
| `@princy/database` | `packages/database/` | Prisma + pgvector |
| `@princy/event-bus` | `packages/event-bus/` | Redis SSE bridge |
| `@princy/tool-kit` | `packages/tool-kit/` | Agent tools |

**Ausente:** `packages/princy-ui` — componentes React compartilhados web ↔ webview.

### 2.6 `services/` — Backend microserviços

| Serviço | Porta | Relevância IDE |
|---------|-------|----------------|
| frontend | 3400 | Web UI (referência UX) |
| api | 3401 | REST core |
| agents | 3402 | Neural Core, swarm, autonomous |
| workspace-service | 3403 | Patches, index |
| context-graph | 3404 | Graph |
| memory-service | 3405 | Memory panel |
| automation-service | 3406 | Autonomous |
| gateway | 3407 | **Ponto único de entrada da IDE** |
| mcp-server | 3408 | MCP Center |
| scheduler-service | 3409 | Jobs, observability |

### 2.7 Documentação existente

| Doc | Fase | Relevância |
|-----|------|------------|
| `PRINCY-CODE.md` | Visão produto | Phase 1 done, Phase 2 scaffold |
| `PRINCY-CODE-ALPHA.md` | Alpha checklist | Status extensão + scaffold |
| `VSCODE-EXTENSION.md` | Extensão | Build/install VSIX |
| `FASE-32-ELECTRON-DESKTOP.md` | Electron | Legado |
| `FASE-33-PRINCY-CODE-BETA.md` | Beta branding | Parcialmente desatualizado |
| `FASE-63/64/65` | Release 1.0 | Instalador Electron |
| `ARQUITETURA-IA.md` | IA | Portas, agentes, router, APIs |

---

## 3. `@princy/vscode-api-client` — Superfície de API

Métodos disponíveis para extensões (via gateway):

| Categoria | Métodos |
|-----------|---------|
| Auth | `login`, `me` |
| Chat | `chatStream`, `chatComplete` |
| Code | `ghostText`, `codeComplete`, `codeExplain`, `codeRefactor`, `codeFix`, `codeTests` |
| Patch | `patchPreview`, `patchApply`, `patchRollback` |
| Workspace | `workspaceLink`, `workspaceIndex`, `workspaceProfile` |
| Terminal | `terminalExplainError`, `terminalFixError` |
| Agents | `agentsStatus`, `agentsMetrics`, `autonomousRun` |
| Swarm | `swarmTasks`, `swarmCreateTask`, `swarmRunTask` |
| Context | `contextGraph` |
| Events | `eventsStreamUrl` |

---

## 4. Matriz de paridade

| Feature | Frontend web | VS Code ext | Spec FASE 67 | Gap |
|---------|-------------|-------------|--------------|-----|
| Chat SSE | Rico | Básico | Premium + animações | Alto |
| Ghost text | Monaco | InlineCompletion | Neural Router | Baixo |
| Inline edit | Widget | Commands | Ctrl+K + Shift+K | Médio |
| Swarm UI | Neural completo | Webview simples | Sidebar + animações | Alto |
| Memory | `/memoria` | Index only | Sidebar dedicada | Alto |
| Workspace patches | Parcial | Preview/apply | Panel completo | Médio |
| Marketplace | Sim | Não | Sim | Alto |
| MCP Center | `/mcp` | Não | Sim | Alto |
| Observability | Sim | Não | Sim | Alto |
| Autonomous | Sim | Command | Panel + timeline | Alto |
| Explorer/Tabs/Terminal/Git | N/A | Via VS Code host | Nativo Code-OSS | Requer fork |
| Thinking UI | Parcial web | Não | Glass/glow/neural | Alto |
| Terminal IA | Não | Sim | Sim + streaming logs | Médio |

---

## 5. Gaps críticos para FASE 67

| # | Gap | Bloqueador | Subfase |
|---|-----|------------|---------|
| 1 | Sem `vendor/vscode` | Build IDE impossível | 67.1 |
| 2 | `patch-code-oss.mjs` placeholder | Sem branding/built-in | 67.1 |
| 3 | Extensão monolítica | Split dificulta manutenção | 67.3+ |
| 4 | Sem `packages/princy-ui` | Duplicação web ↔ webview | 67.4+ |
| 5 | Features só no web | UX IDE inferior | 67.4–67.13 |
| 6 | Instalador Electron ≠ IDE | Produto errado no mercado | 67.15 |
| 7 | Docs FASE 67 | Escopo indefinido | **Esta entrega** |

---

## 6. Ativos prontos para reaproveitamento imediato

1. **`apps/vscode-extension`** — base built-in da IDE (67.3)
2. **`packages/vscode-api-client`** — camada de integração
3. **`apps/princy-code/product.json.template`** — branding
4. **`themes/princy-dark-neural.json`** — tema default
5. **`apps/frontend/src/features/*`** — referência UX + futuro `princy-ui`
6. **`apps/desktop/assets/*`** — ícones/splash (67.2)
7. **Gateway + microserviços VPS** — backend sem alteração
8. **CI Windows** (`.github/workflows/build.yml`) — padrão para 67.15
9. **`docs/ARQUITETURA-IA.md`** — contrato de APIs e portas

---

## 7. Conclusão da auditoria

O monorepo possui **todos os ingredientes de backend e uma extensão VS Code funcional (Phase 1)**, mas **não possui a IDE Code-OSS compilada**. O Electron shell atual não substitui uma IDE nativa.

A FASE 67 deve focar em:

1. Fork Code-OSS via submodule (`apps/princy-code`)
2. Built-in extensions Princy
3. Port gradual da UX web para webviews via `packages/princy-ui`
4. Substituir instalador Electron por build Code-OSS em 67.15

Próximo documento: [FASE-67-ARQUITETURA.md](./FASE-67-ARQUITETURA.md).
