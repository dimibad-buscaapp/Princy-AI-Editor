# FASE 39 — Cloud Sync

Sync local/cloud de settings, projects, memories, agents e workspace metadata com fila offline e resolução LWW.

## Endpoints

| Método | Path |
|--------|------|
| `POST` | `/api/sync/push` |
| `GET` | `/api/sync/pull` |
| `GET` | `/api/sync/status` |
| `POST` | `/api/sync/queue` |

## Modelos

- `SyncState` — versão local/remota por entidade
- `SyncQueue` — fila offline (pending/conflict)

## UI

`SyncStatusPanel` em Configurações — push/pull de beta settings.
