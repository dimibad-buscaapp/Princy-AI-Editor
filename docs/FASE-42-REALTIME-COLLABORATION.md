# FASE 42 — Realtime Collaboration

Locks de arquivo e presença Redis para colaboração no editor.

## Endpoints

| Método | Path |
|--------|------|
| `POST` | `/api/workspace/locks` |
| `DELETE` | `/api/workspace/locks` |
| `GET` | `/api/workspace/locks?workspaceId=` |
| `POST` | `/api/workspace/presence` |
| `GET` | `/api/workspace/presence?workspaceId=` |

## Modelos

- `WorkspaceLock` — lock exclusivo por arquivo/workspace

## UI

`EditorPresenceBadge` — badge de usuários online no editor.
