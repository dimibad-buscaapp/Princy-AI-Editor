# Arquitetura Oficial IA — Princy Neural Core

Documento de referência para portas, agentes, rotas e modelos oficiais do Princy AI Editor.

## URLs de produção

Mapa completo de URLs (frontend, gateway, OpenAI-compat): **[URLS-PRODUCAO.md](./URLS-PRODUCAO.md)**

| Recurso | URL |
|---------|-----|
| Frontend | http://13.140.129.77:3400 |
| Gateway | http://13.140.129.77:3407 |
| OpenAI models | http://13.140.129.77:3407/v1/models |
| System health | http://13.140.129.77:3407/api/system/health |

## Visão geral

```text
Frontend (:3400) → Gateway (:3407) → Neural Core / Agents (:3402)
                                      ↳ Memory (:3405), Context Graph (:3404), Workspace (:3403)
                                      ↳ Redis (princy:events)
                                      ↳ Ollama (qwen3:8b, deepseek-r1:8b, nomic-embed-text)
```

## Portas dos serviços

| Serviço | Porta | Variável |
|---------|-------|----------|
| Frontend | 3400 | `FRONTEND_PORT` |
| API | 3401 | `API_PORT` |
| Agents (Neural Core) | 3402 | `AGENTS_PORT` |
| Workspace / Patch | 3403 | `WORKSPACE_SERVICE_PORT` |
| Context Graph | 3404 | `CONTEXT_GRAPH_PORT` |
| Memory | 3405 | `MEMORY_SERVICE_PORT` |
| Automation | 3406 | `AUTOMATION_SERVICE_PORT` |
| Gateway | 3407 | `GATEWAY_PORT` |
| MCP | 3408 | `MCP_SERVER_PORT` |
| Ollama | 11434 | `OLLAMA_BASE_URL` |
| Redis | 6379 | `REDIS_URL` |

## 10 agentes oficiais

| Role | Nome UI | Função |
|------|---------|--------|
| `COORDINATOR` | Coordenador | Planejamento e orquestração (Neural Core) |
| `ARCHITECT` | Arquiteto | Design e arquitetura |
| `DEVELOPER` | Desenvolvedor | Implementação de código |
| `TESTER` | Testador | Testes e debug |
| `REVIEWER` | Revisor | Revisão de qualidade |
| `RESEARCHER` | Pesquisador | RAG e pesquisa |
| `DEVOPS` | DevOps | Terminal e deploy |
| `WRITER` | Escritor | Documentação |
| `MEMORY` | Memória | Delegate HTTP → `:3405` |
| `CONTEXT_GRAPH` | Graph | Delegate HTTP → `:3404` |

### Pipelines

**Swarm completo:**
```text
COORDINATOR → RESEARCHER → MEMORY → CONTEXT_GRAPH → ARCHITECT → DEVELOPER → TESTER → REVIEWER → WRITER → DEVOPS
```

**Autonomous:**
```text
COORDINATOR → ARCHITECT → DEVELOPER → TESTER → REVIEWER → DEVOPS
```

## Neural Router V1

Pacote: `packages/shared/src/router` — seleciona automaticamente o modelo por tipo de tarefa.

| Tarefa | Modelo | Env |
|--------|--------|-----|
| Chat simples, ghost text, explain code | `qwen2.5:3b` | `DEFAULT_FAST_MODEL` |
| Refactor, testes, geração de código | `qwen3:8b` | `DEFAULT_CODE_MODEL` |
| Architect, autonomous, swarm | `deepseek-r1:8b` | `DEFAULT_REASONING_MODEL` |
| Embeddings | `nomic-embed-text` | `OLLAMA_EMBED_MODEL` |

**Endpoint:** `GET /api/router/stats` — agregação por modelo (`qwen25`, `qwen3`, `deepseek`), tempo médio e cache hit ratio.

Documentação completa: [NEURAL-ROUTER-V1.md](./NEURAL-ROUTER-V1.md)

Modelos extras via `OLLAMA_EXTRA_MODELS` (lista separada por vírgula).

## Rotas Gateway

### Sistema

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/system/health` | Health unificado + Neural Core + modelos |
| `GET` | `/observability/health` | Alias interno (mesmo payload) |
| `GET` | `/api/events/stream` | SSE eventos Redis |

### Code API

| Método | Rota | Intent |
|--------|------|--------|
| `POST` | `/api/code/complete` | code |
| `POST` | `/api/code/explain` | chat |
| `POST` | `/api/code/refactor` | plan+code |
| `POST` | `/api/code/tests` | code |

### OpenAI-compatible (`/v1/*`)

| Método | Rota |
|--------|------|
| `GET` | `/v1/models` |
| `POST` | `/v1/chat/completions` |
| `POST` | `/v1/embeddings` |

Auth opcional: `GATEWAY_API_KEY` (Bearer ou `X-Api-Key`).

### Swarm (Fase 34)

| Método | Rota |
|--------|------|
| `POST` | `/api/swarm/run` |
| `GET` | `/api/swarm/runs` |
| `GET` | `/api/swarm/runs/:id` |
| `POST` | `/api/swarm/runs/:id/cancel` |
| `POST` | `/api/swarm/task` |
| `GET` | `/api/swarm/tasks` |

### Agents

| Método | Rota |
|--------|------|
| `POST` | `/api/agents/swarm/run` |
| `POST` | `/api/agents/autonomous/run` |
| `GET` | `/api/agents/status` |
| `GET` | `/api/agents/metrics` |
| `GET` | `/api/agents/:agentId/memory` |
| `POST` | `/api/agents/:agentId/memory` |
| `DELETE` | `/api/agents/:agentId/memory/:memoryId` |
| `POST` | `/api/chat/complete` | *(deprecated alias)* |

## Eventos Redis

| Evento | Quando |
|--------|--------|
| `neural.plan` | Início de pipeline |
| `neural.route` | Roteamento de agente/modelo |
| `neural.step.started` | Step do swarm iniciado |
| `neural.step.completed` | Step concluído |
| `autonomous.planning` | Fase PLANNING |
| `autonomous.executing` | Fase EXECUTING |
| `swarm.started` / `swarm.completed` | Ciclo swarm |

## Validação

```bash
npm run build -w @princy/frontend
npm run build -w @princy/agents
npm run build -w @princy/gateway
pm2 restart ecosystem.config.cjs --update-env && pm2 save
npm run health:linux
```

```bash
# Externo (produção)
curl http://13.140.129.77:3407/api/system/health
curl http://13.140.129.77:3407/v1/models
curl -X POST http://13.140.129.77:3407/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-r1:8b","messages":[{"role":"user","content":"oi"}]}'

# Local na VPS (health:linux usa 127.0.0.1)
curl http://127.0.0.1:3407/api/system/health
```
