# FASE 35 — Agent Memory

## Objetivo

Memória persistente por agente (decisões, erros recorrentes, preferências de projeto, contexto recuperável) integrada ao Memory V2, com API REST e injeção automática no `SwarmOrchestrator`.

## Tipos de memória

| Kind | Uso |
|------|-----|
| `decision` | Decisão ou output de execução bem-sucedida |
| `error` | Falha com `recurrenceKey` para agregação |
| `preference` | Preferências de projeto por agente |
| `context` | Contexto recuperável manualmente |

## Modelo `AgentMemory`

Campos principais: `agentRole`, `kind`, `projectId`, `content`, `recurrenceKey`, `taskId`, `success`, `durationMs`, `decision`, `metadata`.

Sincronização Memory V2: cada memória significativa gera `MemoryChunk` com `scope: AGENT`, tags `[agentRole, kind]`.

## Pacote `@princy/memory`

| Função | Descrição |
|--------|-----------|
| `createAgentMemory` | Persiste + sync Memory V2 |
| `deleteAgentMemory` | Remove registro + chunk AGENT |
| `getAgentMemory` | Lista, stats, erros recorrentes, preferências |
| `getAgentMemoryContext` | Texto injetado em `AgentContext.context` |
| `recordAgentMemory` | Registro enriquecido pós-execução |
| `aggregateRecurringErrors` | Top N erros por `recurrenceKey` |

## Endpoints (gateway :3407)

| Método | Path | Descrição |
|--------|------|-----------|
| `GET` | `/api/agents/:agentId/memory` | `?projectId=`, `?kind=`, `?limit=` |
| `POST` | `/api/agents/:agentId/memory` | `{ kind, content, projectId?, taskId?, success?, metadata? }` |
| `DELETE` | `/api/agents/:agentId/memory/:memoryId` | Remove memória |

`agentId` aceita role swarm (`DEVELOPER`, …) ou `Agent.id` (cuid) do banco.

## Injeção no Swarm

Antes de cada step em `SwarmOrchestrator.executeRun`:

```ts
const memoryContext = await getAgentMemoryContext(role, projectId);
const enrichedContext = [baseContext, memoryContext].filter(Boolean).join("\n\n");
```

`POST /api/swarm/run` aceita `projectId` opcional no body.

## Exemplos

```bash
# Criar preferência
curl -X POST http://127.0.0.1:3407/api/agents/DEVELOPER/memory \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"kind":"preference","content":"Usar TypeScript strict","projectId":"demo"}'

# Listar memória
curl "http://127.0.0.1:3407/api/agents/DEVELOPER/memory?projectId=demo" \
  -H "Authorization: Bearer $TOKEN"

# Remover
curl -X DELETE http://127.0.0.1:3407/api/agents/DEVELOPER/memory/MEMORY_ID \
  -H "Authorization: Bearer $TOKEN"

# Swarm com projectId
curl -X POST http://127.0.0.1:3407/api/swarm/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"objective":"Refatorar auth","projectId":"demo"}'
```

## Frontend

Seção **Agent Memory** em `MemoryView` — seletor de agente (6 roles), filtro por `kind`, erros recorrentes em destaque.

## Limitações

- `prisma generate` com `ERR_REQUIRE_ESM` — migrations via raw SQL
- Memory V2 AGENT sem embeddings dedicados nesta fase
- Shared/team memory (Fase 41) fora de escopo
