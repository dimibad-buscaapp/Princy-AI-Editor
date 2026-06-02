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

## Deploy na VPS

O destino esperado na VPS Windows e:

```text
C:\Apps\Princy-Ai-Editor
```

Script inicial:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-vps.ps1
```

O script assume acesso SSH ao host `108.181.169.40`, Git e Node.js instalados na VPS. Ajuste o usuario com `-RemoteUser` se necessario.

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

A Fase 3.1 adiciona o pacote isolado `@princy/database` com PostgreSQL + Prisma. Nesta fase, o pacote ainda nao e importado por `services/api`, Gateway ou outros servicos.

Estrutura:

```text
packages/database/
  prisma/
    schema.prisma
    seed.ts
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

Nao rode `npm run db:migrate` ate existir um PostgreSQL configurado com a `DATABASE_URL` real. O seed inicial cria um usuario admin local e os agentes base de forma idempotente.

## Proximos passos sugeridos

- Implementar PostgreSQL e Prisma.
- Criar autenticacao JWT com RBAC.
- Transformar `memory-service` em memoria persistente com embeddings.
- Transformar `context-graph` em indexador real com Tree-sitter.
