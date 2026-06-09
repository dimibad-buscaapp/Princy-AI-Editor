# FASE 67 — Roadmap Subfases 67.1–67.15

Plano técnico detalhado com critérios de aceite, entregáveis, dependências e estimativas de esforço.

---

## Visão geral

| Métrica | Valor |
|---------|-------|
| Total estimado | ~27 semanas-pessoa |
| 1 dev full-time | ~6–7 meses |
| 2 devs | ~3,5–4 meses |
| MVP utilizável (67.1–67.6) | ~11 semanas |
| Feature-complete (67.1–67.15) | ~27 semanas |

### Ordem de execução recomendada

```
67.1 → 67.2 → 67.3 → 67.5 → 67.6 → 67.4 → 67.7 → 67.9 → 67.13 → 67.8 → 67.10 → 67.11 → 67.12 → 67.14 → 67.15
```

MVP entrega IDE real com AI core (explorer, editor, ghost, inline, chat base, branding, instalador básico).

---

## 67.1 — Preparar Code-OSS

**Objetivo:** Submodule funcional, primeiro compile local, patch script MVP.

### Entregáveis

- `vendor/vscode` submodule pinado (tag release)
- `patch-code-oss.mjs` implementado (product.json + copy extension)
- Scripts npm: `princy-code:patch`, `princy-code:compile`
- `VSCODE_PIN.md` com versão base
- Primeiro binário unpacked executável

### Tarefas

1. `git submodule add microsoft/vscode` em `apps/princy-code/vendor/vscode`
2. Documentar requisitos build Windows (RAM, VS Build Tools)
3. `npm ci` + `npm run compile` no upstream
4. Implementar patch script (merge product.json.template)
5. Copiar `apps/vscode-extension` → `extensions/princy-assistant` (mirror inicial)
6. Smoke test: app abre com title "Princy Code"

### Critérios de aceite

- [ ] `npm run compile` exit 0 no Windows
- [ ] `princy-code.exe` (unpacked) abre sem crash
- [ ] Title bar mostra "Princy Code" (não "Code - OSS")
- [ ] Extensão princy-assistant listada em Extensions (built-in)
- [ ] `patch-code-oss.mjs` idempotente (re-run safe)

### Dependências

- Nenhuma (primeira subfase)

### Esforço

**3 semanas** (1 dev)

### Riscos

- Build upstream falha por RAM/toolchain → reservar máquina 16GB+

---

## 67.2 — Branding completo

**Objetivo:** Identidade visual Princy Code em toda shell da IDE.

### Entregáveis

- Ícones Windows/Linux/macOS
- Splash / welcome page custom
- About page Princy
- Protocol handler `princy-code://`
- Zero strings "Visual Studio Code" visíveis

### Tarefas

1. Copiar/adaptar assets de `apps/desktop/assets/`
2. Patch resources upstream (ico, png, icns)
3. Welcome page HTML custom
4. About dialog content via product.json / patch
5. Atalhos desktop "Princy Code"
6. Audit grep "Visual Studio Code" / "Microsoft" na UI

### Critérios de aceite

- [ ] Ícone Princy na taskbar e instalador
- [ ] Welcome page sem referências Microsoft
- [ ] About mostra Princy Code + MIT + Code-OSS credit
- [ ] `princy-code://` abre a IDE
- [ ] Grep UI strings: 0 ocorrências "Visual Studio Code"

### Dependências

- 67.1

### Esforço

**1 semana**

---

## 67.3 — Integração Princy Assistant

**Objetivo:** Extensão core built-in funcional com auth e chat base.

### Entregáveis

- `extensions/princy-assistant` built-in (migrado de `apps/vscode-extension`)
- Auth sign-in/out via gateway
- Activity bar Princy AI
- Chat webview básico (SSE)
- Settings `princy.gatewayUrl` default VPS

### Tarefas

1. Migrar código para `apps/princy-code/extensions/princy-assistant/`
2. Ajustar paths build esbuild no contexto submodule
3. Wire `@princy/vscode-api-client` (file: ou npm workspace link)
4. Testar todos 17 comandos existentes
5. Marcar `apps/vscode-extension` como deprecated (README)

### Critérios de aceite

- [ ] Sign-in funciona contra gateway `:3407`
- [ ] Chat envia mensagem e recebe SSE stream
- [ ] Ghost text provider registrado (mesmo se básico)
- [ ] Activity bar icon Princy visível
- [ ] Comandos palette listam "Princy: *"

### Dependências

- 67.1, 67.2

### Esforço

**1,5 semanas**

---

## 67.4 — Chat Premium

**Objetivo:** Experiência chat comparável ao frontend web.

### Entregáveis

- `packages/princy-ui` (MVP: ChatMessage, ChatInput, ThinkingBlock)
- Markdown rendering + syntax highlight
- Mermaid diagrams
- Diff viewer inline
- Tool calls visualization
- Animações: typing, thinking, tool running, streaming cursor

### Tarefas

1. Criar `packages/princy-ui` com componentes extraídos de `features/chat/`
2. esbuild bundle para webview
3. Implementar ThinkingBlock (glass/glow/neural)
4. Integrar mermaid.js (lazy load)
5. Tool call cards + file references
6. Animações CSS (performance budget < 16ms frame)

### Critérios de aceite

- [ ] Streaming token-by-token visível
- [ ] Code blocks com syntax highlight
- [ ] Mermaid renderiza diagrama válido
- [ ] Thinking UI mostra plano/subtarefas
- [ ] Paridade visual ≥80% vs `ChatView.tsx`
- [ ] Sem jank perceptível no editor durante chat

### Dependências

- 67.3

### Esforço

**3 semanas**

---

## 67.5 — Ghost Text

**Objetivo:** Inline completions via Neural Router.

### Entregáveis

- Ghost text provider otimizado
- Debounce configurável
- Indicador modelo routed (status bar)
- Suporte TS/JS/Python (mínimo)

### Tarefas

1. Refinar `ghostText.ts` — prefix extraction, cancellation
2. Endpoint `POST /api/code/ghost-text` (qwen2.5:3b via router)
3. Settings debounce + enable toggle
4. Status bar item "Princy Ghost" com modelo
5. Test latência < 800ms p95 (VPS)

### Critérios de aceite

- [ ] Ghost text aparece após pausa de digitação
- [ ] Tab aceita sugestão
- [ ] Esc cancela ghost
- [ ] Funciona em .ts, .js, .py
- [ ] Sem requests para localhost (settings VPS default)

### Dependências

- 67.3

### Esforço

**1 semana**

---

## 67.6 — Inline Edit

**Objetivo:** Edição inline estilo IDE moderna.

### Entregáveis

- Ctrl+K explain/refactor/fix/document/tests
- Ctrl+Shift+K inline edit expandido
- Diff preview antes de apply
- Apply / rollback patch

### Tarefas

1. Keybindings com `when: editorHasSelection`
2. Inline widget ou quick pick + diff editor
3. Integrar `codeExplain`, `codeRefactor`, `codeFix`, `codeTests`
4. Patch preview via `patch/preview.ts` existente
5. Resolver conflito Ctrl+K com chord VS Code

### Critérios de aceite

- [ ] Seleção → Explain → output em panel/webview
- [ ] Refactor → diff preview → apply altera arquivo
- [ ] Generate tests → novo arquivo ou inserção
- [ ] Rollback restaura versão anterior
- [ ] Ctrl+Shift+K abre inline edit mode

### Dependências

- 67.3, 67.5 (opcional)

### Esforço

**1,5 semanas**

---

## 67.7 — Swarm Sidebar

**Objetivo:** Painel swarm dedicado com visual neural e live updates.

### Entregáveis

- Extensão `princy-swarm` (ou módulo split)
- Webview com agentes: Coordinator, Architect, Developer, Tester, Reviewer, DevOps
- SSE `/api/events/stream`
- Animações: pulse, neural links, handoff, timeline

### Tarefas

1. Criar `extensions/princy-swarm`
2. Portar componentes de `features/swarm/` para princy-ui
3. Subscribe SSE events (agent status, pipeline progress)
4. Agent cards com modelo, tempo, artefatos
5. Timeline de handoffs

### Critérios de aceite

- [ ] Swarm panel abre via command palette
- [ ] 6+ agentes visíveis com status live
- [ ] Pipeline run mostra progresso em tempo real
- [ ] Animações neural links entre agentes ativos
- [ ] Criar e executar task swarm end-to-end

### Dependências

- 67.3, princy-ui swarm components

### Esforço

**2,5 semanas**

---

## 67.8 — Memory Sidebar

**Objetivo:** Visualização e gestão de memórias Princy.

### Entregáveis

- Extensão `princy-memory`
- Scopes: Project, Conversation, Code, Agent, Shared
- CRUD via gateway

### Tarefas

1. Criar extension scaffold
2. Portar UI de `features/memory/MemoryView.tsx`
3. APIs memory-service via gateway
4. Search/filter por scope
5. Link memory entry → arquivo no explorer

### Critérios de aceite

- [ ] Listar memórias por scope
- [ ] Criar/editar/excluir entrada
- [ ] Busca textual funcional
- [ ] Dados persistem no VPS (não local-only)

### Dependências

- 67.3

### Esforço

**2 semanas**

---

## 67.9 — Workspace Intelligence

**Objetivo:** Painel de patches, diffs e workspace index.

### Entregáveis

- Extensão `princy-workspace`
- Lista arquivos afetados
- Preview diff, apply, rollback
- Workspace index trigger

### Tarefas

1. Extension scaffold
2. Integrar patch APIs existentes
3. Explorer decorations para arquivos patched
4. Index workspace command + progress
5. Rollback multi-file

### Critérios de aceite

- [ ] Patch preview mostra diff side-by-side
- [ ] Apply altera arquivos no workspace local
- [ ] Rollback reverte todas alterações do patch
- [ ] Index workspace popula context graph

### Dependências

- 67.3, 67.6

### Esforço

**2 semanas**

---

## 67.10 — Marketplace

**Objetivo:** Marketplace Princy dentro da IDE.

### Entregáveis

- Webview marketplace
- Categorias: Agents, Tools, Templates, Themes, MCP
- Install/browse actions

### Tarefas

1. Portar `MarketplaceView.tsx` para webview
2. Gateway marketplace APIs
3. Install agent/template action
4. Tab navigation + search

### Critérios de aceite

- [ ] 5 categorias navegáveis
- [ ] Listar items do VPS
- [ ] Install action executa sem erro
- [ ] Equivalente funcional a `/marketplace` web

### Dependências

- 67.3, princy-ui

### Esforço

**2 semanas**

---

## 67.11 — MCP Center

**Objetivo:** Gestão MCP integrada.

### Entregáveis

- Painel MCP dedicado
- Lista MCP instalados, status, config, testes, logs

### Tarefas

1. Webview MCP center
2. APIs mcp-server `:3408` via gateway
3. Test connection button
4. Log viewer tail

### Critérios de aceite

- [ ] Listar MCP servers configurados
- [ ] Status online/offline correto
- [ ] Test connection retorna sucesso/falha clara
- [ ] Logs visíveis (últimas N linhas)

### Dependências

- 67.3

### Esforço

**1,5 semanas**

---

## 67.12 — Observability

**Objetivo:** Painel observability completo na IDE.

### Entregáveis

- Webview observability
- Router stats, cache, memory, swarm, scheduler, analytics, workers

### Tarefas

1. Portar `ObservabilityView.tsx`
2. Poll `/api/router/stats`, `/api/system/health`, agent metrics
3. Charts (lightweight — chart.js ou CSS bars)
4. Auto-refresh toggle

### Critérios de aceite

- [ ] Router stats exibem qwen25/qwen3/deepseek metrics
- [ ] Health de todos serviços visível
- [ ] Swarm worker status atualiza
- [ ] Equivalente a `/observability` web

### Dependências

- 67.3

### Esforço

**1,5 semanas**

---

## 67.13 — Autonomous Mode

**Objetivo:** Painel autonomous completo com timeline e aprovações.

### Entregáveis

- Webview autonomous
- Fluxo Goal → Plan → Tasks → Dev → Test → Review → Deploy
- Timeline, logs, artefatos, approval gates

### Tarefas

1. Portar `AutonomousView.tsx`
2. Opt-in setting enforcement
3. Approval UI antes de patch apply
4. SSE progress durante run
5. Artefact download/view

### Critérios de aceite

- [ ] Run autonomous end-to-end com objective
- [ ] Timeline mostra cada fase
- [ ] Patches requerem aprovação (default)
- [ ] Logs streaming durante execução
- [ ] Cancel run funcional

### Dependências

- 67.3, 67.9

### Esforço

**2 semanas**

---

## 67.14 — Settings

**Objetivo:** Configurações Princy completas na IDE.

### Entregáveis

- Settings categories: General, AI, Models, Memory, Swarm, Workspace, Marketplace, MCP, Appearance
- Todas URLs Princy configuráveis
- Tema default Princy Neural Dark

### Tarefas

1. Expand `contributes.configuration` em extensions
2. Settings UI sections (markdown descriptions)
3. Import/export settings JSON
4. Validate URLs on change
5. Default theme activation

### Critérios de aceite

- [ ] 9 categorias visíveis no Settings UI
- [ ] Alterar gateway URL reflete nas requests
- [ ] Tema Neural Dark aplicado por default em fresh install
- [ ] Settings sync-ready (future)

### Dependências

- 67.3–67.13 (settings para cada feature)

### Esforço

**1,5 semanas**

---

## 67.15 — Build Final

**Objetivo:** Instaladores produção, CI, deprecar Electron shell.

### Entregáveis

- `Princy-Code-Setup.exe` (Code-OSS NSIS)
- `Princy-Code.AppImage` (Linux)
- CI workflow `princy-code-build.yml`
- Auto-update metadata
- Smoke test checklist
- `apps/desktop` marcado deprecated

### Tarefas

1. Implementar `build-win.mjs`, `build-linux.mjs`
2. GitHub Actions com submodule cache
3. Upload artifacts + release
4. Adaptar `FASE-64-INSTALLER-QA.md` para IDE
5. README migration guide Electron → Code-OSS
6. Final smoke: explorer, editor, terminal, git, chat, swarm

### Critérios de aceite

- [ ] NSIS instala e abre IDE branded
- [ ] AppImage funciona em Ubuntu 22.04+
- [ ] CI verde em windows-latest + ubuntu-latest
- [ ] Artefato ≤ 150 MB (referência)
- [ ] Smoke test checklist 100% pass
- [ ] Electron shell documentado como legado

### Dependências

- 67.1–67.14 (mínimo 67.1–67.6 para MVP release)

### Esforço

**2 semanas**

---

## Tabela consolidada

| Subfase | Nome | Esforço | Dependências | MVP? |
|---------|------|---------|--------------|------|
| 67.1 | Preparar Code-OSS | 3 sem | — | Sim |
| 67.2 | Branding | 1 sem | 67.1 | Sim |
| 67.3 | Princy Assistant | 1,5 sem | 67.1–67.2 | Sim |
| 67.4 | Chat Premium | 3 sem | 67.3 | Não |
| 67.5 | Ghost Text | 1 sem | 67.3 | Sim |
| 67.6 | Inline Edit | 1,5 sem | 67.3 | Sim |
| 67.7 | Swarm Sidebar | 2,5 sem | 67.3 | Não |
| 67.8 | Memory Sidebar | 2 sem | 67.3 | Não |
| 67.9 | Workspace Intelligence | 2 sem | 67.3, 67.6 | Não |
| 67.10 | Marketplace | 2 sem | 67.3 | Não |
| 67.11 | MCP Center | 1,5 sem | 67.3 | Não |
| 67.12 | Observability | 1,5 sem | 67.3 | Não |
| 67.13 | Autonomous Mode | 2 sem | 67.3, 67.9 | Não |
| 67.14 | Settings | 1,5 sem | 67.3+ | Parcial |
| 67.15 | Build Final | 2 sem | 67.1+ | Sim |

**MVP total (67.1–67.6 + 67.15 parcial):** ~11 semanas

---

## Gates de aprovação humana

| Gate | Após | Decisão necessária |
|------|------|-------------------|
| G0 | Documentação FASE 67 | Aprovar início 67.1 |
| G1 | 67.1 compile OK | Aprovar branding + extensão |
| G2 | 67.6 MVP features | Aprovar investimento 67.4–67.13 |
| G3 | 67.14 settings | Aprovar release candidate |
| G4 | 67.15 CI green | Aprovar release pública |

---

## Referências

- [FASE-67-PRINCY-CODE-DESKTOP.md](./FASE-67-PRINCY-CODE-DESKTOP.md)
- [FASE-67-AUDITORIA.md](./FASE-67-AUDITORIA.md)
- [FASE-67-ARQUITETURA.md](./FASE-67-ARQUITETURA.md)
- [FASE-67-CODE-OSS-STRATEGY.md](./FASE-67-CODE-OSS-STRATEGY.md)
