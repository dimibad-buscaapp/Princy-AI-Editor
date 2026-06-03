# Princy AI Editor

Monorepo inicial do **Princy AI Editor**, preparado para frontend, API, agentes, servicos de contexto, memoria, automacao, gateway e MCP server.

## Dados do projeto

- GitHub: `https://github.com/dimibad-buscaapp/Princy-AI-Editor.git`
- Local: `C:\Users\hp\Desktop\Princy-AI-Editor`
- VPS: `108.181.169.40`
- Caminho na VPS: `C:\Apps\Princy-Ai-Editor`

## Portas

| Porta | Servico |
| --- | --- |
| `3400` | Frontend |
| `3401` | API |
| `3402` | Agents |
| `3403` | Workspace Service |
| `3404` | Context Graph |
| `3405` | Memory Service |
| `3406` | Automation Service |
| `3407` | Gateway |
| `3408` | MCP Server |
| `3409` | Future |

## Estrutura

```text
apps/
  frontend/
services/
  api/
  agents/
  workspace-service/
  context-graph/
  memory-service/
  automation-service/
  gateway/
  mcp-server/
packages/
  service-kit/
scripts/
```

## Rodar localmente

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Frontend:

```text
http://localhost:3400
```

Cada servico backend expoe:

```text
http://localhost:<porta>/health
```

Para verificar todos os endpoints:

```powershell
npm run health
```

## Rodar com Docker

```powershell
Copy-Item .env.example .env
docker compose up --build
```

## Deploy na VPS (PC → GitHub → VPS)

Fluxo recomendado: **commit/push no PC**, depois **deploy via SSH** (a VPS faz `git clone` ou `git pull`, nao copia pasta do PC).

Destino na VPS:

```text
C:\Apps\Princy-Ai-Editor
```

### 1. No PC (antes do deploy)

```powershell
cd C:\Users\hp\Desktop\Princy-AI-Editor
git add .
git commit -m "sua mensagem"
git push origin main
```

### 2. Deploy completo (clone/pull + npm install + build + servicos)

```powershell
npm run deploy:vps
```

Equivalente:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-vps.ps1
```

Opcoes uteis:

| Parametro | Efeito |
| --- | --- |
| `-FreshClone` | Apaga `C:\Apps\Princy-Ai-Editor` e clona de novo (faz backup do `.env`) |
| `-ExactSync` | `git reset --hard origin/main` + `git clean -fd` na VPS |
| `-SkipDbDeploy` | Nao roda `npm run db:deploy` |
| `-SkipServices` | Nao reinicia servicos NSSM |
| `-RemoteUser` | Utilizador SSH (padrao `Administrator`) |

Exemplo — igualar VPS ao GitHub do zero (mantem `.env`):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-vps.ps1 -FreshClone -ExactSync
```

### 3. Verificar se PC e VPS estao no mesmo commit

```powershell
npm run sync:check-vps
```

Requisitos: SSH com chave para `108.181.169.40`, Git, Node.js 22+ e (opcional) NSSM na VPS.

Ambiente de producao:

```powershell
Copy-Item .env.production.example .env.production
Copy-Item .env.production.example .env
notepad .env
```

Preencha `DATABASE_URL`, `JWT_SECRET` e `JWT_REFRESH_SECRET` com valores reais na VPS. Arquivos `.env` reais continuam fora do Git.

## Producao persistente no Windows

A Fase 1 usa NSSM para manter cada app como um servico automatico do Windows. Instale o `nssm.exe` na VPS e deixe-o disponivel no `PATH`, ou informe o caminho completo com `-NssmPath`.

Servicos criados:

| Servico Windows | Workspace |
| --- | --- |
| `PrincyFrontend` | `@princy/frontend` |
| `PrincyApi` | `@princy/api` |
| `PrincyAgents` | `@princy/agents` |
| `PrincyWorkspace` | `@princy/workspace-service` |
| `PrincyContextGraph` | `@princy/context-graph` |
| `PrincyMemory` | `@princy/memory-service` |
| `PrincyAutomation` | `@princy/automation-service` |
| `PrincyGateway` | `@princy/gateway` |
| `PrincyMCP` | `@princy/mcp-server` |

Instalar ou atualizar os servicos na VPS:

```powershell
cd C:\Apps\Princy-Ai-Editor
npm install
npm run build
npm run services:install
```

Se o NSSM nao estiver no `PATH`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/windows/install-services.ps1 -NssmPath "C:\Tools\nssm\nssm.exe"
```

Reiniciar servicos:

```powershell
npm run services:restart
```

Remover servicos:

```powershell
npm run services:remove
```

Logs:

```text
C:\Apps\Princy-Ai-Editor\logs
```

Validar saude dos servicos:

```powershell
npm run health
```

Depois de instalados, os servicos iniciam automaticamente apos reiniciar a VPS.

## Producao real

A Fase 2 troca o runtime dos servicos backend de TypeScript direto para JavaScript compilado em `dist/`.

Fluxo de producao:

```powershell
npm install
npm run build
npm run services:restart
npm run health
```

Cada backend gera um arquivo de entrada em:

```text
services/<servico>/dist/index.js
```

O pacote compartilhado tambem e compilado:

```text
packages/service-kit/dist/index.js
```

Os servicos Windows continuam chamando `npm run start -w <workspace>`, mas agora os backends executam `node dist/index.js`.

## Logs

Os servicos usam logs estruturados com Pino. Por padrao, os arquivos ficam em:

```text
C:\Apps\Princy-Ai-Editor\logs
```

Arquivos esperados:

```text
api.log
agents.log
workspace-service.log
context-graph.log
memory-service.log
automation-service.log
gateway.log
mcp-server.log
errors.log
```

Variaveis:

```text
LOG_LEVEL=info
PRINCY_LOG_DIR=logs
```

## Health checks

Cada servico backend expoe:

```text
/health
/health/live
/health/ready
```

O Gateway tambem expoe:

```text
/gateway/ready
```

`npm run health` valida os endpoints locais usando `127.0.0.1`.

## Gateway V2

O Gateway roda na porta `3407` e passa a ser o ponto central para rotas internas.

Rotas iniciais:

| Rota | Destino |
| --- | --- |
| `/api/chat` | Agents |
| `/api/projects` | API |
| `/api/files` | Workspace Service |
| `/api/workspace` | Workspace Service |
| `/api/context` | Context Graph |
| `/api/memory` | Memory Service |
| `/api/agents` | Agents |
| `/api/automation` | Automation Service |

Recursos iniciais:

- Request IDs com header `X-Request-Id`
- Proxy interno
- Service discovery em `/services`
- Timeouts de proxy
- Rate limiting
- Logs de requests
- Error tracking em `errors.log`
- Circuit breaker simples
- Readiness agregada em `/gateway/ready`

## Seguranca imediata

O `service-kit` aplica Helmet, CORS configuravel e tratamento global de erros.

Variaveis principais:

```text
CORS_ORIGINS=http://localhost:3400,http://127.0.0.1:3400
GATEWAY_RATE_LIMIT_WINDOW_MS=60000
GATEWAY_RATE_LIMIT_MAX=300
GATEWAY_PROXY_TIMEOUT_MS=10000
GATEWAY_HEALTH_TIMEOUT_MS=1500
GATEWAY_EXPOSE_INTERNAL_URLS=false
```

Script opcional de firewall na VPS:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/windows/configure-firewall.ps1
```

Ele mantem publicas as portas `3400` e `3407`, e restringe `3401-3406`, `3408` e `3409` para acesso local/rede interna. Execute apenas depois de validar que o Gateway esta respondendo corretamente.

## Database Foundation

As Fases 3.1 e 3.2 adicionam o pacote isolado `@princy/database` com PostgreSQL + Prisma. Nesta fase, o pacote ainda nao e importado por `services/api`, Gateway ou outros servicos.

Estrutura:

```text
packages/database/
  prisma/
    schema.prisma
    seed.ts
  prisma.config.ts
  scripts/
  src/
    client.ts
    index.ts
    repositories/
```

Variavel necessaria:

```text
DATABASE_URL=postgresql://postgres:SENHA@localhost:5432/princy_ai_editor
```

Comandos:

```powershell
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:seed
npm run db:studio
```

Uso recomendado nesta fase:

```powershell
npm install
npm run db:generate
npm run build
npm run typecheck
npm run lint
```

`db:migrate` usa `prisma migrate dev` e deve ser usado em desenvolvimento. `db:deploy` usa `prisma migrate deploy` e deve ser usado na VPS/producao depois que migrations existirem.

Prisma 7 usa `packages/database/prisma.config.ts` para carregar `DATABASE_URL`; por isso o datasource no schema nao contem `url`.

Schema inicial:

```text
User, Project, Workspace, Conversation, Message, Agent, Task,
MemoryChunk, Embedding, ContextNode, ContextEdge, AuditLog
```

Seed inicial:

```text
admin@princy.local
senha inicial: princy-admin-change-me
```

A senha e salva apenas como hash `bcryptjs`. O seed tambem cria os agentes base de forma idempotente.

Preparar PostgreSQL na VPS:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/windows/setup-postgres.ps1
```

Depois ajuste `C:\Apps\Princy-Ai-Editor\.env` com a senha real:

```text
DATABASE_URL=postgresql://postgres:<PASSWORD>@localhost:5432/princy_ai_editor
```

Validacao com banco real:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build
npm run typecheck
npm run lint
npm run health
```

## Fases 5–18 (implementadas)

| Fase | Descricao |
|------|-----------|
| 5 | Memory Service — CRUD, busca, scopes USER/PROJECT/CONVERSATION/WORKSPACE |
| 5.5 | Embeddings Ollama `nomic-embed-text` — `/memory/embed`, `/memory/reindex` |
| 5.6 | RAG hibrido — `/memory/rag` |
| 6 | Context Graph — indexador, `/context/index`, `/context/search` |
| 6.5 | Relationship engine — IMPORTS, CALLS, EXTENDS, etc. |
| 7 | Agents — Planner, Coder, Reviewer, Debugger, Architect, Terminal, Auto |
| 7.5 | Orchestrator — pipeline Planner → Architect → Coder → Reviewer |
| 8 | Workspace — read/write/rename/delete, scan, guard |
| 9 | Patch engine — create/apply/rollback/history |
| 10 | Chat Princy — SSE `/chat/stream`, projects API |
| 10.5 | Tool kit — registry, executor, permissions |
| 11 | Editor layout VS Code-like — `/editor/[projectId]` |
| 11.5 | Monaco Editor integrado |
| 12 | Event bus + SSE `/events/stream` |
| 12.5 | Live terminal — `/terminal/run`, `/terminal/stream` |
| 13 | MCP — `/mcp/tools`, `/mcp/servers`, `/mcp/discovery` |
| 14–14.5 | Swarm visual + neural links animados |
| 15 | GitHub Actions build + deploy |
| 16 | Prometheus `/metrics`, docker observability |
| 17–17.5 | Model router + Ollama multi-modelo |
| 18–18.5 | Autonomous goals + approval workflow |

### Gateway rewrites

| Rota publica | Servico | Prefixo interno |
|--------------|---------|-----------------|
| `/api/memory` | Memory | `/memory` |
| `/api/context` | Context | `/context` |
| `/api/agents` | Agents | `/agents` |
| `/api/chat` | Agents | `/chat` |
| `/api/projects` | API | `/projects` |
| `/api/workspace`, `/api/files` | Workspace | `/workspace` |
| `/api/patch` | Workspace | `/patch` |
| `/api/terminal` | Workspace | `/terminal` |
| `/api/mcp` | MCP | `/mcp` |
| `/api/automation` | Automation | `/automation` |
| `/api/events` | Agents | `/events` |

Relatorios em `docs/reports/`.

## Fase 19.1 — PGVector + Memory V2

Substitui `Embedding.vectorUnsupported` (JSON em TEXT) por coluna `vector(768)` com extensao **pgvector**.

### Setup pgvector

```powershell
# VPS — 1) binarios (Admin), 2) CREATE EXTENSION (le .env)
cd C:\Apps\Princy-Ai-Editor
git pull
powershell -ExecutionPolicy Bypass -File scripts\windows\install-pgvector-windows.ps1
powershell -ExecutionPolicy Bypass -File scripts\windows\setup-pgvector.ps1

# Ou tudo de uma vez (PowerShell como Administrador):
powershell -ExecutionPolicy Bypass -File scripts\windows\deploy-pgvector-vps.ps1
```

Se `vector.control` nao existir, `setup-pgvector.ps1` para antes e indica `install-pgvector-windows.ps1`.
Build oficial (nmake): `install-pgvector-windows.ps1 -Method source`.

Dev com Docker (opcional):

```powershell
docker compose -f docker-compose.postgres.yml up -d
```

### Variaveis

```text
EMBEDDING_DIMENSIONS=768
MEMORY_HYBRID_VECTOR_WEIGHT=0.7
MEMORY_HYBRID_TEXT_WEIGHT=0.3
MEMORY_REINDEX_BATCH=50
MEMORY_AUTO_EMBED=false
```

### Rotas novas / alteradas

- `GET /api/memory/vector/status` — status pgvector + pendentes
- `POST /api/memory/reindex` — retorna `{ embedded, migrated, failed, pendingVectors }`
- Busca `semantic` / `hybrid` usa similaridade SQL (`<=>`)

### Benchmark

```powershell
node scripts/benchmark-pgvector.mjs
```

Relatorio: `docs/reports/phase-19.1.md`

## Proximos passos sugeridos

- Rodar `setup-pgvector.ps1` + `db:deploy` na VPS apos cada deploy.
- `POST /api/memory/reindex` com JWT apos migracao.
- Configurar `OLLAMA_BASE_URL` (dev local, prod VPS).
- Tuning HNSW / IVFFlat para grande volume.
