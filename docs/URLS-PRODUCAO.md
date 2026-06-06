# URLs de Produção — Princy AI Editor

Referência oficial para recuperação de contexto (VPS Linux).

**Servidor:** `13.140.129.77`

Documentação complementar: [ARQUITETURA-IA.md](./ARQUITETURA-IA.md) (agentes, pipelines, modelos, eventos Redis).

---

## Frontend (`:3400`)

| Página | URL |
|--------|-----|
| Home | http://13.140.129.77:3400 |
| Chat | http://13.140.129.77:3400/chat |
| Swarm (10 agentes) | http://13.140.129.77:3400/swarm |
| Editor | http://13.140.129.77:3400/editor/demo |
| Context Graph | http://13.140.129.77:3400/graph |
| Memória | http://13.140.129.77:3400/memoria |
| Automações | http://13.140.129.77:3400/automacoes |
| Observability | http://13.140.129.77:3400/observability |

O frontend consome a API via proxy interno para o Gateway (`NEXT_PUBLIC_GATEWAY_URL`).

---

## API Gateway (`:3407`)

**Base:** http://13.140.129.77:3407

| Recurso | URL |
|---------|-----|
| API base | http://13.140.129.77:3407/api |
| Health unificado | http://13.140.129.77:3407/api/system/health |
| Gateway ready | http://13.140.129.77:3407/gateway/ready |
| SSE eventos | http://13.140.129.77:3407/api/events/stream |

### Proxies principais (`/api/*`)

| Prefixo | Destino |
|---------|---------|
| `/api/auth` | API `:3401` |
| `/api/chat` | Agents `:3402` |
| `/api/code` | Agents `:3402` |
| `/api/agents` | Agents `:3402` |
| `/api/memory` | Memory `:3405` |
| `/api/context` | Context Graph `:3404` |
| `/api/automation` | Automation `:3406` |
| `/api/patch` | Workspace `:3403` |

---

## Compatibilidade OpenAI (`/v1/*`)

Para VS Code, Cursor e clientes externos:

| Método | URL |
|--------|-----|
| `GET` | http://13.140.129.77:3407/v1/models |
| `POST` | http://13.140.129.77:3407/v1/chat/completions |
| `POST` | http://13.140.129.77:3407/v1/embeddings |

Auth opcional: `GATEWAY_API_KEY` (header `Authorization: Bearer <key>` ou `X-Api-Key`).

Exemplo:

```bash
curl -X POST http://13.140.129.77:3407/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-r1:8b","messages":[{"role":"user","content":"oi"}]}'
```

---

## Health e validação

Na VPS (checks locais):

```bash
npm run health:linux
curl -s http://127.0.0.1:3407/api/system/health
curl -s http://127.0.0.1:3407/v1/models
```

Externamente:

```bash
curl -s http://13.140.129.77:3407/api/system/health
curl -s http://13.140.129.77:3407/v1/models
```

PM2: processo `princy-ai-editor` via `ecosystem.config.cjs` — `pm2 restart princy-ai-editor --update-env`

---

## Nota operacional — modelos Ollama

| Modelo oficial | Env | Status típico na VPS |
|----------------|-----|----------------------|
| `qwen3:8b` | `OLLAMA_CHAT_MODEL` | Requer `ollama pull qwen3:8b` |
| `deepseek-r1:8b` | `DEFAULT_REASONING_MODEL` | Instalado |
| `nomic-embed-text` | `OLLAMA_EMBED_MODEL` | Instalado |

Se `qwen3:8b` não estiver instalado, use `deepseek-r1:8b` em `/v1/chat/completions` até o pull.

---

## Portas internas (referência)

| Porta | Serviço |
|-------|---------|
| 3400 | Frontend |
| 3401 | API |
| 3402 | Agents (Neural Core) |
| 3403 | Workspace |
| 3404 | Context Graph |
| 3405 | Memory |
| 3406 | Automation |
| 3407 | Gateway |
| 3408 | MCP |
| 11434 | Ollama |
| 6379 | Redis |
