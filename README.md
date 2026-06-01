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

## Proximos passos sugeridos

- Definir contratos reais da API e do Gateway.
- Adicionar persistencia para `memory-service` e `context-graph`.
- Conectar `agents` ao provedor de modelos.
- Expandir o `mcp-server` com ferramentas reais.
