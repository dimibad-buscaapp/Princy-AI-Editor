# FASE 37 — Task Learning

## Objetivo

Reconhecer padrões de tarefas repetidas, sugerir templates de execução e automações.

## Modelo `TaskPattern`

- `patternKey` — chave normalizada (categoria + trecho do objetivo)
- `category` — build_fix, test, refactor, deploy, bugfix, feature, general
- `occurrenceCount` — frequência
- `template` — steps sugeridos do pipeline
- `lastPlan` — último plano/artefatos bem-sucedidos

## Endpoints (gateway :3407)

| Método | Path |
|--------|------|
| `GET` | `/api/agents/task-learning/patterns` |
| `GET` | `/api/agents/task-learning/suggestions` |
| `POST` | `/api/agents/task-learning/classify` |
| `POST` | `/api/agents/task-learning/record` |

## Integração

- `SwarmOrchestrator.startRun` — registra padrão ao iniciar run
- `SwarmOrchestrator` ao completar — atualiza `lastPlan` com artefatos
- `AutonomousView` — classificação em tempo real + sugestões de automação

## Exemplo

```bash
curl -X POST http://127.0.0.1:3407/api/agents/task-learning/classify \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"objective":"corrigir build do frontend"}'
```
