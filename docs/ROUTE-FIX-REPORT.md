# Relatório — Correção rotas `/api/api`

## Causa

`getClientApiBaseUrl()` = `http://host:3407/api` + paths `/api/agents/status` → `/api/api/agents/status` (404).

## Rotas corrigidas

| Antes (bug) | Depois (correto) |
|-------------|------------------|
| `/api/api/agents/status` | `/api/agents/status` |
| `/api/api/agents/metrics` | `/api/agents/metrics` |
| `/api/api/automation/*` | `/api/automation/*` |
| `/api/api/memory/*` | `/api/memory/*` |
| `/api/api/context/*` | `/api/context/*` |
| `/api/api/patch/*` | `/api/patch/*` |
| `/api/api/chat/*` | `/api/chat/*` |
| `/api/observability/health` | `/api/system/health` |

## Arquivos alterados

- `apps/frontend/src/lib/api.ts` (novo)
- `apps/frontend/src/lib/safe-fetch.ts` (novo)
- `apps/frontend/src/lib/api-client.ts`
- `apps/frontend/src/features/swarm/use-swarm-stream.ts`
- `apps/frontend/src/features/swarm/SwarmView.tsx`
- `apps/frontend/src/features/autonomous/AutonomousView.tsx`
- `apps/frontend/src/features/observability/ObservabilityView.tsx`
- `apps/frontend/src/features/context-graph/ContextGraphView.tsx`
- `apps/frontend/src/features/memory/MemoryView.tsx`
- `apps/frontend/src/features/editor/*`
- `apps/frontend/src/features/chat/use-chat-stream.ts`
- `apps/frontend/src/features/system/SystemHealthView.tsx` (novo)
- `apps/frontend/app/(app)/system/page.tsx` (novo)
- `apps/frontend/app/icon.png`, `public/favicon.ico` (novo)
- `scripts/verify-routes.sh` (novo)

## Endpoints validados

- `GET /api/system/health` → 200
- `GET /v1/models` → 200
- `GET /api/agents/status` → 401 (auth required, não 404)
- `GET /api/agents/metrics` → 401
- `GET /api/events/stream` → 200

## Status final

Swarm e demais módulos passam a usar `apiUrl()` com paths relativos (`/agents/status`) sem duplicar prefixo `/api`.
