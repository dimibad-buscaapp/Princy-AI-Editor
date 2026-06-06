# FASE 41 — Shared Memory

Memória compartilhada por time com escopo `TEAM` e auditoria via `@princy/audit-kit`.

## Endpoints

| Método | Path |
|--------|------|
| `GET` | `/api/memory/team/:teamId` |
| `POST` | `/api/memory/create` (scope `TEAM` + `teamId`) |

## Modelos

- `MemoryChunk.teamId` — FK opcional para `Team`
- `MemoryScope.TEAM` — escopo de memória compartilhada

## Pacotes

- `@princy/audit-kit` — `recordAudit()` grava em `AuditLog`

## UI

`MemoryView` — filtro `TEAM` nos scopes.
