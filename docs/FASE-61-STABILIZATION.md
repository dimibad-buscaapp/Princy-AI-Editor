# FASE 61 — Stabilization

Eliminar bugs e regressões antes do Release 1.0.

## Escopo de auditoria

| Área | Foco |
|------|------|
| Frontend | build, typecheck, imports, UI version |
| API / Gateway | rotas, proxy, auth |
| Agents / Swarm | `/api/agents`, `/api/swarm` |
| Scheduler | BullMQ `:3409` |
| Workspace / Memory | FS guards, memory scopes |
| Marketplace | stores + manifest v2 |
| Electron | preload, splash, branding |
| Observability | metrics, health, SSE |

## Comandos gate

```bash
npm run build
npm run health:linux
npm run auth-smoke
```

Complementares:

```bash
npm run typecheck
npm run lint
bash scripts/verify-routes.sh
bash scripts/rc1-smoke.sh
npm run desktop:build
```

## Critérios de aceite

- Health 16/16 OK
- Auth smoke 20/20 OK
- `verify-routes.sh` sem FAIL
- Findings documentados no REPORT
- Correções apenas de baixo risco (sem mudança arquitetural)
