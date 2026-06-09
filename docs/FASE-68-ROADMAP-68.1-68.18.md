# FASE 68 — Roadmap 68.1–68.18

Subfases executáveis com entregáveis, critérios de aceite e estimativa de esforço.

**Ordem recomendada:**

```
68.1 → 68.2 → 68.3 → 68.4 → 68.5 → 68.6 → 68.7 → 68.8 → 68.9 → 68.10 → 68.11 → 68.13 → 68.12 → 68.14 → 68.15 → 68.16 → 68.17 → 68.18
```

---

## 68.1 — Gate Code-OSS + VPS hardening

**Esforço:** 1,5 semanas

### Entregáveis

- Submodule `vendor/vscode` init + compile smoke
- Completar `packages/extension-shared/src/config.ts` com `:3404`, `:3406`
- `apps/vscode-extension/src/config/validate-urls.ts` — reject loopback
- Startup connectivity probe (gateway health)

### Aceite

- [ ] `npm run compile` OK no submodule
- [ ] Zero requests loopback em runtime
- [ ] Health check no splash/welcome

### Arquivos principais

- `packages/extension-shared/src/config.ts`
- `apps/princy-code/config/princy-services.json`
- `apps/vscode-extension/src/config/validate-urls.ts`
- `apps/vscode-extension/src/extension.ts`

---

## 68.2 — `packages/princy-ui` foundation

**Esforço:** 2,5 semanas

### Entregáveis

- Novo package React 18 + design tokens (glass/glow/neural)
- Extrair: `ChatMessage`, `ThinkingPanel`, `AgentOrbitalCard`, `DiffViewer`, `MetricCounter`
- esbuild pipeline para webview bundles

### Origem frontend

- `apps/frontend/src/features/chat/*`
- `apps/frontend/src/features/swarm/components/*`
- `apps/frontend/src/design-system/*`

### Aceite

- [ ] 5 componentes renderizam em webview sandbox
- [ ] Bundle < 500KB gzip por painel (target)

### Arquivos novos

- `packages/princy-ui/package.json`
- `packages/princy-ui/src/components/*`
- `packages/princy-ui/src/animations/*`
- `packages/princy-ui/scripts/build-webview.mjs`

---

## 68.3 — Princy Chat V3

**Esforço:** 3 semanas

### Entregáveis

- Sidebar fixa com histórico conversas (API gateway)
- Agent picker + `agentType` + `thinkingMode` em `chatStream`
- Tool call cards, file references, code blocks com highlight
- Anexos (file, selection, image base64)
- Persistência `conversationId`

### Modificar

- `apps/vscode-extension/src/webviews/chat/chatPanel.ts` → React bundle
- `packages/vscode-api-client` — `conversationsList`, `conversationHistory`

### Aceite

- [ ] TTFT < 2s (VPS)
- [ ] Paridade ≥ 90% vs `ChatView.tsx`

---

## 68.4 — Animation system

**Esforço:** 1 semana

### Entregáveis

- Hook settings `princy.chatAnimations`, `princy.motionEnabled`
- 10 animações: typing, thinking, streaming cursor, tool running, agent working, patch applying, memory loading, workspace scan, autonomous execution, task complete
- Performance budget: CSS `transform`/`opacity` only

### Modificar

- `packages/extension-shared/src/premium-ui.ts`
- `packages/princy-ui/src/animations/*`

### Aceite

- [ ] Settings respeitados em runtime
- [ ] Sem layout thrashing (DevTools Performance)

---

## 68.5 — Thinking Panel + Agent HUD

**Esforço:** 2,5 semanas

### Entregáveis

- Thinking Panel standalone: objetivo, plano, etapas, ferramentas, agentes, status, tempo, tokens
- Agent HUD: 6 agentes com modelo, latência, artefatos
- Port `SwarmHudBeta.tsx`

### Modificar

- `swarmPanel.ts` → React
- Novo `src/webviews/hud/agentHudPanel.ts`

### Aceite

- [ ] HUD atualiza em tempo real via SSE
- [ ] Thinking panel sincronizado com chat stream

---

## 68.6 — Neural Links + Swarm SSE

**Esforço:** 2 semanas

### Entregáveis

- Wire `eventsStreamUrl()` — substituir poll 10s
- Animações handoff, task flow, coordenação
- Swarm execution: create/run task, pipeline timeline
- Honor `princy.swarmLiveUpdates`

### Modificar

- `apps/vscode-extension/src/webviews/swarm/swarmPanel.ts`
- Port `use-swarm-stream.ts`

### Aceite

- [ ] Latência evento→UI < 500ms
- [ ] Zero poll HTTP quando SSE ativo

---

## 68.7 — Inline AI V2 + Advanced actions

**Esforço:** 2 semanas

### Entregáveis

- Inline widget (port `InlineChatWidget.tsx`)
- Ctrl+Shift+L — quick chat on selection
- Context menu: Explain, Refactor, Tests, Docs, API, Migration, Fix, Performance, Security, Open in Chat, Send to Swarm
- Commands: `princy.optimizeSelection`, `princy.securityReview`, `princy.performanceReview`

### Modificar

- `apps/vscode-extension/src/providers/inlineChat.ts`
- `apps/vscode-extension/package.json` menus/keybindings

### Aceite

- [ ] Widget inline funcional sem output channel
- [ ] 10+ ações no context menu

---

## 68.8 — Ghost text performance

**Esforço:** 1 semana

### Entregáveis

- Meta p95 **< 300ms** (debounce 200ms default, prefix window otimizado)
- Status bar indicator com modelo routed
- Cancellation agressiva on cursor move

### Modificar

- `apps/vscode-extension/src/providers/ghostText.ts`

### Aceite

- [ ] p95 < 300ms medido em benchmark script
- [ ] Status bar mostra modelo ativo

---

## 68.9 — Workspace Intelligence dashboard

**Esforço:** 2,5 semanas

### Entregáveis

- Auto-detect: framework, DB, ORM, tests, CI/CD, Docker, linguagem, deps
- Dashboard técnico visual
- Wire preview/rollback buttons em `workspacePanel.ts`
- Explorer file decorations para patches

### API

- `workspaceProfile` enrichment + `GET /api/workspace/detect` (gateway se necessário)

### Aceite

- [ ] Detect ≥ 5 categorias em projeto típico
- [ ] Preview/rollback funcional end-to-end

---

## 68.10 — Memory Center

**Esforço:** 2 semanas

### Entregáveis

- 6 scopes: Project, Conversation, Code, Agent, Shared, Team
- CRUD + search
- Port `MemoryView.tsx`
- Meta load **< 1s**

### API client

- `memoryCreate`, `memoryUpdate`, `memoryDelete`, `memorySearch`, `agentMemory`

### Modificar

- `apps/vscode-extension/src/webviews/memory/memoryPanel.ts`

### Aceite

- [ ] CRUD completo funcional
- [ ] Load < 1s em VPS

---

## 68.11 — Patch Engine professional

**Esforço:** 1,5 semanas

### Entregáveis

- Patch list from workspace service
- Side-by-side diff (port `DiffViewer.tsx`)
- Apply / reject / rollback multi-file
- Patch applying animation

### Modificar

- `apps/vscode-extension/src/patch/preview.ts`
- Workspace panel integration

### Aceite

- [ ] Multi-file rollback funcional
- [ ] Diff side-by-side nativo VS Code

---

## 68.12 — Terminal AI V2

**Esforço:** 1 semana

### Entregáveis

- Structured log panel com badges
- Generate command, retry, auto-detect errors
- Streaming output integration

### Modificar

- `apps/vscode-extension/src/terminal/monitor.ts`

### Aceite

- [ ] Badges error/warn/info em logs
- [ ] Generate command com confirmação

---

## 68.13 — Autonomous Mode V2

**Esforço:** 2,5 semanas

### Entregáveis

- Full flow Goal→Plan→Architect→Dev→Test→Review→Deploy
- Timeline + SSE + cancel
- Approval gates + DiffViewer
- Port `AutonomousView.tsx`

### Modificar

- `apps/vscode-extension/src/webviews/autonomous/autonomousPanel.ts`

### Aceite

- [ ] Timeline SSE em tempo real
- [ ] Cancel interrompe execução no backend

---

## 68.14 — MCP + Observability + Marketplace V2

**Esforço:** 2,5 semanas

### MCP

- Real test API, log tail, latency, config editor — `mcpPanel.ts`

### Observability

- Charts, scheduler/workers, cache — port `ObservabilityView.tsx`

### Marketplace

- Search, loading/error states — `marketplacePanel.ts`

### Aceite

- [ ] MCP test retorna latência real
- [ ] Observability com ≥ 3 charts
- [ ] Marketplace search funcional

---

## 68.15 — Settings V2

**Esforço:** 1 semana

### Categorias

AI, Models, Swarm, Memory, Workspace, Marketplace, MCP, Appearance, Advanced

### Entregáveis

- import/export JSON
- URL validation
- settings webview panel

### Modificar

- `apps/vscode-extension/package.json` configuration
- Novo `settingsPanel.ts`

### Aceite

- [ ] Import/export round-trip sem perda
- [ ] Loopback URLs rejeitadas na UI

---

## 68.16 — Startup Experience

**Esforço:** 1,5 semanas

### Entregáveis

- Startup hub webview: Recent Projects, Autonomous Projects, Templates, Marketplace, System Health, Latest Swarm Runs
- Integração Code-OSS welcome (patch upstream ou custom editor tab)
- Splash durante health-check VPS

### Modificar

- `apps/princy-code/assets/welcome.html`
- Novo `startupHubPanel.ts`

### Aceite

- [ ] Hub carrega em < 3s com VPS healthy
- [ ] Recent projects persistidos

---

## 68.17 — Security + Performance

**Esforço:** 1,5 semanas

### Security

- JWT refresh token flow em `auth.ts`
- RBAC permission checks before patch/autonomous/memory write
- Audit log hook

### Performance

- Instrumentação TTFT, ghost p95, workspace scan
- Script `scripts/princy-perf-benchmark.mjs`
- Metas: Chat TTFT < 2s, Ghost < 300ms, Scan < 5s, Memory < 1s

### Aceite

- [ ] Refresh token automático sem re-login
- [ ] Benchmark script gera relatório JSON

---

## 68.18 — Build Ultimate

**Esforço:** 2 semanas

### Entregáveis

- Code-OSS `Princy-Code-Setup.exe` verified (sem `continue-on-error`)
- Linux AppImage
- **Portable** Windows zip
- Smoke checklist FASE 64 adaptado
- Deprecar artefato Electron definitivamente

### Modificar

- `apps/princy-code/scripts/build-win.mjs`
- `.github/workflows/princy-code-build.yml`
- Novo `build-portable.mjs`

### Aceite

- [ ] CI verde end-to-end
- [ ] Smoke checklist 100% pass
- [ ] Portable zip extraível e funcional

---

## Estimativa consolidada

| Métrica | Valor |
|---------|-------|
| **Total** | ~30 semanas-pessoa |
| **1 dev** | ~7–8 meses |
| **2 devs** | ~4 meses |
| **MVP Ultimate** (68.1–68.3, 68.5–68.6, 68.18) | ~12 semanas |
| **Feature-complete** (68.1–68.18) | ~30 semanas |

## Riscos

| Risco | Mitigação |
|-------|-----------|
| React em webview bundle size | Code-split, lazy mermaid/charts |
| SSE em webview CSP | Nonce scripts + gateway proxy |
| Code-OSS build time | CI cache, nightly builds |
| Frontend↔webview drift | Single source `princy-ui` |
| Performance targets on VPS latency | Debounce tuning, regional CDN future |

## Referências

- [FASE-68-PRINCY-CODE-ULTIMATE.md](./FASE-68-PRINCY-CODE-ULTIMATE.md)
- [FASE-68-AUDITORIA.md](./FASE-68-AUDITORIA.md)
- [FASE-68-ARQUIVOS.md](./FASE-68-ARQUIVOS.md)
