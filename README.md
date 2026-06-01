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

Depois de instalados, os servicos iniciam automaticamente apos reiniciar a VPS. Nesta fase, os backends ainda usam `tsx` no `start`; a Fase 2 deve trocar o runtime para JavaScript compilado em producao.

## Proximos passos sugeridos

- Definir contratos reais da API e do Gateway.
- Adicionar persistencia para `memory-service` e `context-graph`.
- Conectar `agents` ao provedor de modelos.
- Expandir o `mcp-server` com ferramentas reais.
