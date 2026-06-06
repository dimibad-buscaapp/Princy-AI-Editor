# FASE 36 — Self Improvement

## Objetivo

A Princy aprende com resultados anteriores: sucesso/falha de tarefas, patches aceitos/rejeitados, score de modelo por tipo de tarefa e recomendações para o Neural Router.

## Componentes

| Componente | Path |
|------------|------|
| Stats service | `services/agents/src/self-improvement/self-improvement.service.ts` |
| API | `GET /api/agents/self-improvement/stats` |
| Outcomes router | `ModelRouter.recordOutcome()` / `getOutcomeScores()` |
| Patch reject | `POST /api/patch/reject` |
| Dashboard | `ObservabilityView` — card Self Improvement |

## Métricas

- **Model score** — combinação de success rate, latência e volume (`ModelMetric` + `AgentMemory`)
- **Patch stats** — applied vs rejected/rolled_back (`Patch`, `PatchHistory`)
- **Task stats** — `AgentExecution` por status
- **Swarm stats** — `SwarmRun` por status
- **Agent efficiency** — `AgentMemory` por `agentRole`

## Endpoints

```bash
curl http://127.0.0.1:3407/api/agents/self-improvement/stats \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://127.0.0.1:3407/api/patch/reject \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"patchId":"PATCH_ID","reason":"Não aplicável"}'
```

## Recomendações automáticas

O serviço gera até 8 recomendações textuais e `routerHints` com modelo sugerido por `taskType` quando há dados suficientes (≥3 runs).

## Limitações

- Ajuste automático de slots do router é somente sugestivo (não altera config sem ação manual)
- Scores dependem de volume de execuções reais
- `prisma generate` continua com workaround raw SQL
