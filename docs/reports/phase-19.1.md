# Relatório Técnico — Fase 19.1 PGVector + Memory V2

## Resumo

Memória vetorial migrada de `vectorUnsupported` (JSON TEXT) para coluna `vector(768)` com extensão pgvector, busca por similaridade no PostgreSQL e hybrid search otimizado.

## Arquivos criados

- `scripts/windows/setup-pgvector.ps1`
- `docker-compose.postgres.yml`
- `packages/database/src/vector-store.ts`
- `packages/database/prisma/migrations/20260603120000_pgvector_memory_v2/`
- `services/memory-service/src/services/similarity-search.service.ts`
- `services/memory-service/src/services/hybrid-search.service.ts`
- `scripts/benchmark-pgvector.mjs`

## Arquivos alterados

- `packages/database/prisma/schema.prisma` — extension `vector`, coluna `vector`
- `packages/database/src/index.ts`
- `packages/ai-client/src/vector.ts`, `ollama.client.ts`
- `services/memory-service` — embedding, rag, routes, index, memory.service
- `.env.example`, `README.md`

## Migration

`20260603120000_pgvector_memory_v2`:

- `CREATE EXTENSION vector`
- `ALTER TABLE Embedding ADD vector vector(768)`
- Backfill de `vectorUnsupported` (se existir)
- `DROP COLUMN vectorUnsupported`
- Índice HNSW `Embedding_vector_hnsw_idx`

## Benchmarks

Executar com PostgreSQL + pgvector ativos:

```powershell
node scripts/benchmark-pgvector.mjs
```

Métricas esperadas no output JSON:

- `sqlMs` — latência busca top-10 via `<=>`
- `memoryMs` — latência legado in-memory (referência)

## Resultado de busca vetorial

Fluxo:

1. Ollama gera embedding da query (`nomic-embed-text`, 768 dims)
2. `similaritySearch` executa `ORDER BY e.vector <=> query::vector`
3. Hybrid merge com `searchText` (pesos 0.7 / 0.3)

## Validação

```powershell
npm run build
npm run typecheck
npm run lint
npm run health
```

## Próximos passos

- IVFFlat para datasets > 1M vetores
- Monitorar `pendingVectors` via `/memory/vector/status`
- OpenTelemetry spans em `similaritySearch`
