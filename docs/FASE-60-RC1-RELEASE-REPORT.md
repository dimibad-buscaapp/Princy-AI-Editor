# FASE 60 — Relatório

- [x] Bump desktop 1.0.0-rc.1
- [x] rc1-smoke.sh
- [x] auth-smoke.sh (`npm run auth-smoke`)
- [x] RC1-RELEASE.md
- [x] Tag v1.0.0-rc.1

## Validação autenticada RC1

```bash
npm run auth-smoke
```

Cobre 20 rotas críticas (scheduler, sync, agents, marketplace, stores, orgs, teams, workers, routing, memory team 403 esperado). Falha com exit code `1` se qualquer endpoint crítico não bater o status esperado.
