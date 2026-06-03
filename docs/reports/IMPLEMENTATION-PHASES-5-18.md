# Implementação Fases 5–18 — Resumo

## Pacotes novos

| Pacote | Função |
|--------|--------|
| `@princy/core` | Auth JWT, validação Zod, workspace guard, DB readiness |
| `@princy/ai-client` | Ollama embed/chat |
| `@princy/event-bus` | Eventos SSE (agent, patch, terminal, memory, context) |
| `@princy/tool-kit` | Tool registry/executor |
| `@princy/model-router` | AiRouter, ModelRegistry |

## Serviços

| Serviço | Fases | Rotas principais |
|---------|-------|------------------|
| memory-service | 5, 5.5, 5.6 | `/memory/*`, `/memory/rag` |
| context-graph | 6, 6.5 | `/context/*` |
| agents | 7, 7.5, 10, 12 | `/agents/*`, `/chat/stream`, `/events/stream` |
| workspace-service | 8, 9, 12.5 | `/workspace/*`, `/patch/*`, `/terminal/*` |
| api | 10 | `/projects/*` |
| automation-service | 18, 18.5 | `/automation/*` |
| mcp-server | 13 | `/mcp/tools`, `/mcp/servers`, `/mcp/discovery` |
| gateway | 12, 16 | rewrites + `/metrics` |

## Frontend

- `/chat` — Chat Princy SSE
- `/editor/[projectId]` — layout VS Code + Monaco
- `/swarm` — visualização agentes
- `/observability` — métricas Prometheus

## CI/CD (Fase 15)

- `.github/workflows/build.yml`
- `.github/workflows/deploy.yml`

## Observabilidade (Fase 16)

- Gateway `/metrics`
- `docker-compose.observability.yml` + `observability/prometheus.yml`

## Validação

```powershell
npm install
npm run db:generate
npm run build
npm run typecheck
npm run lint
npm run health
```
