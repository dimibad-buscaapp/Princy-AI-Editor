# FASE 34 — Multi-Agent Real

## Objetivo

Transformar o Swarm em execução multiagente real com pipeline sequencial de 6 agentes, artefatos estruturados e API de runs.

## Pipeline

```
User Request → Coordinator → Architect → Developer → Tester → Reviewer → DevOps
```

## Agentes

| Agente | Classe | Artefatos |
|--------|--------|-----------|
| Coordinator | `CoordinatorAgent` | plan, subtasks |
| Architect | `ArchitectSwarmAgent` | files |
| Developer | `DeveloperAgent` | patch |
| Tester | `TesterAgent` | tests |
| Reviewer | `ReviewerSwarmAgent` | report |
| DevOps | `DevOpsAgent` | deploy_plan |

## Orquestração

- **`SwarmOrchestrator`** — [`services/agents/src/orchestrator/swarm-orchestrator.ts`](../services/agents/src/orchestrator/swarm-orchestrator.ts)
- Execução assíncrona após `POST /api/swarm/run`
- Eventos SSE: `swarm.started`, `neural.step.started|completed|failed`, `swarm.completed`

## Endpoints (gateway :3407)

| Método | Path | Descrição |
|--------|------|-----------|
| `POST` | `/api/swarm/run` | Inicia run completo `{ objective, context? }` |
| `GET` | `/api/swarm/runs` | Lista runs (`?status=`, `?limit=`) |
| `GET` | `/api/swarm/runs/:id` | Detalhe: run + steps + artefatos |
| `POST` | `/api/swarm/runs/:id/cancel` | Cancela run |

Endpoints legados mantidos: `/api/swarm/task`, `/api/swarm/tasks/*`, `/api/agents/swarm/run`.

## Modelo de dados

- **`SwarmRun`** — run agregado (`pipelineId`, `progress`, `currentAgent`, `artifacts`)
- **`SwarmTask`** — steps por agente (`output: { text, artifacts[] }`)

## Frontend

- `use-swarm-run.ts` — lifecycle de runs
- `SwarmHudBeta` — progresso, agente atual, artefatos, fila, SSE
- `SwarmView` — `Executar Swarm` via `POST /api/swarm/run`

## Exemplo

```bash
curl -X POST http://127.0.0.1:3407/api/swarm/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"objective":"Otimizar build do frontend"}'

curl http://127.0.0.1:3407/api/swarm/runs/RUN_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Limitações

- Artefatos gerados via LLM + parser heurístico (sem apply real no workspace)
- Fila não persistente após restart do processo
- `POST /agents/swarm/run` permanece com pipeline legado de 10 agentes
