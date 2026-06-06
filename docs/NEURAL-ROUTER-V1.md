# Princy Neural Router V1

Roteamento automático de modelos Ollama por tipo de tarefa.

## Modelos

| Perfil | Modelo padrão | Variável de ambiente |
|--------|---------------|----------------------|
| Fast (chat, ghost, explain) | `qwen2.5:3b` | `DEFAULT_FAST_MODEL` |
| Code (refactor, testes) | `qwen3:8b` | `DEFAULT_CODE_MODEL` |
| Reasoning (architect, swarm) | `deepseek-r1:8b` | `DEFAULT_REASONING_MODEL` |

Aliases mantidos: `CHAT_FAST_MODEL`, `OLLAMA_CHAT_MODEL`, `CHAT_DEEP_MODEL`.

## Matriz de roteamento

| RequestType | Modelo | Casos |
|-------------|--------|-------|
| `chat_simple` | fast | perguntas rápidas, conversação |
| `ghost_text` | fast | autocomplete, inline suggestions |
| `explain_code` | fast | explicar funções, classes, docs |
| `refactor` | code | refatoração, testes, componentes |
| `architect` | reasoning | planejamento, arquitetura, roadmap |
| `autonomous` | reasoning | execução multi-step |
| `swarm` | reasoning | coordinator, developer, tester, reviewer |

## API

### `GET /api/router/stats`

Resposta:

```json
{
  "totalRequests": 120,
  "qwen25Requests": 80,
  "qwen3Requests": 25,
  "deepseekRequests": 15,
  "avgResponseTime": 340,
  "mostUsedModel": "qwen2.5:3b",
  "cacheHitRatio": 12.5
}
```

## Uso programático

```ts
import { getModelRouter } from "@princy/shared";

const router = getModelRouter();
router.routeChat("oi");              // qwen2.5:3b
router.routeTask("refatore X");      // qwen3:8b
router.routeTask("planeje arquitetura"); // deepseek-r1:8b
router.routeAgent("ARCHITECT");      // deepseek-r1:8b
router.routeAutocomplete();          // qwen2.5:3b
```

`@princy/model-router` reexporta `routeChat`, `routeTask`, `routeAgent`, `routeAutocomplete` para compatibilidade.

## Métricas

Cada decisão registra:

- `router_decision` / `request_type`
- `selected_model`
- `response_time`

Persistência em `ModelMetric` (agents) + agregação in-memory no `ModelRouter`.

## Meta de performance

Time To First Token alvo: **< 2 segundos** (modelo fast + warmup via `POST /api/models/warm`).

## Painel

Observability (`/observability`) exibe card **Neural Router** com requisições por modelo, tempo médio, modelo mais usado e cache hit ratio.
