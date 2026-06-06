# Princy AI Editor — RC1 Release

**Version:** `1.0.0-rc.1`  
**Date:** 2026-06-06

## Highlights (Phases 39–60)

- Cloud Sync, Team Workspaces, Shared Memory
- Realtime Collaboration (locks + presence)
- Project Permissions + RBAC Enterprise
- Marketplace V2 + Agent/Template/MCP/Theme stores
- Audit Logs, SSO scaffold, Organizations, Usage Analytics
- Distributed Swarm workers, GPU pools, BullMQ scheduler (:3409)
- Hybrid Routing policies, Performance hardening

## Smoke

```bash
npm run auth-smoke
bash scripts/rc1-smoke.sh
npm run health:linux
```

### Auth smoke (endpoints autenticados)

Valida rotas críticas RC1 com JWT assinado via `JWT_SECRET` local (nunca logado).

```bash
npm run auth-smoke
```

Variáveis opcionais:

| Variável | Padrão |
|----------|--------|
| `BASE_URL` | `http://127.0.0.1:3407` |
| `JWT_SECRET` | `.env` ou ambiente |
| `USER_EMAIL` | primeiro usuário `ADMIN` no banco |
| `DATABASE_URL` | `.env` ou ambiente |

`GET /api/memory/team/demo-team` deve retornar **403** (sem membership) — contado como sucesso.

## Tag

```bash
git tag v1.0.0-rc.1
```
