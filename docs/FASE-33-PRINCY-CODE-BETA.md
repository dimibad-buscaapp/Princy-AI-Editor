# FASE 33 — Princy Code Beta

Guia de uso da transição **Princy Code Alpha → Beta** no frontend web (porta 3400) e shell Electron.

## Visão geral

O Beta evolui a UI existente com tema **Princy Neural Dark**, dashboard na home, chat premium, Swarm HUD, marketplace com abas, painel de serviços e configurações locais — **sem alterar portas, APIs ou Prisma**.

## Telas

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | `HomeView` | Dashboard Beta com router, modelos, swarm, memory e widget de serviços |
| `/chat` | `ChatView` + `ChatHeader` | Tier Fast/Code/Reasoning, thinking, cache hit, ações copiar/workspace/autônomo |
| `/swarm` | `SwarmView` + `SwarmHudBeta` | Pipeline Coordinator → DevOps com status live |
| `/marketplace` | `MarketplaceView` | Abas Agents, Tools, Templates, Themes, MCP |
| `/system` | `SystemHealthView` | `ServiceStatusPanel` completo (12+ serviços) |
| `/configuracoes` | `BetaSettingsPanel` | Preferências em `localStorage` (`princy-beta-settings-v1`) |

## Endpoints reutilizados

| Dado | Endpoint |
|------|----------|
| Health | `GET /api/system/health` |
| Router stats | `GET /api/router/stats` |
| Modelos | health → `models` |
| Swarm tasks | `GET /api/swarm/tasks` |
| Agentes | `GET /api/agents/status`, `/api/agents/metrics` |
| Marketplace | `GET /api/agents/marketplace` |
| Cache | `GET /api/memory/cache/stats` |
| Chat métricas | SSE `done` em `/api/chat/stream` |

## Tema e design system

- Tokens em `apps/frontend/src/styles/tokens.css`
- Utilitários Beta em `apps/frontend/src/styles/beta.css`
- Componentes: `BetaBadge`, `LoadingSkeleton`, `EmptyState`, `ErrorState`

## Desktop Electron

- Título: **Princy Code Beta**
- Splash e error page atualizados
- IPC seguro: `princy:retry` (re-bootstrap), `princy:open-logs` (pasta `logs/` no monorepo)
- `productName: Princy Code Beta` em `electron-builder.yml`

## Configurações locais

Chave `princy-beta-settings-v1` — preferências de UI apenas; não propagam ao Ollama até Fase 34.

## Build e validação

```bash
npm run build -w @princy/shared
npm run test -w @princy/shared
npm run build -w @princy/frontend
npm run build -w @princy/desktop
npm run health:linux
npm run pack -w @princy/desktop
```

## Limitações

- Templates / MCP no marketplace: empty state até catálogo expandir
- PostgreSQL: status inferido via API
- Settings locais não alteram env do servidor
- `Princy-Code-Setup.exe` requer build Windows
