# FASE 36 — Self Improvement — Relatório

## Entregas

- [x] `getSelfImprovementStats()` — agregação de model/patch/task/swarm/agent
- [x] `GET /api/agents/self-improvement/stats`
- [x] `ModelRouter.recordOutcome()` + `getOutcomeScores()`
- [x] `AgentExecutionEngine` persiste falhas em `AgentExecution` (status FAILED)
- [x] `PatchService.reject()` + `POST /api/patch/reject`
- [x] Card Self Improvement em Observability
- [x] Documentação FASE-36

## Validação

```bash
npm run build -w @princy/shared
npm run test -w @princy/shared
npm run build -w @princy/agents
npm run build -w @princy/frontend
npm run health:linux
```

## Próxima fase

**Fase 37 — Task Learning** — classificação de tarefas, templates, sugestões de automação.
