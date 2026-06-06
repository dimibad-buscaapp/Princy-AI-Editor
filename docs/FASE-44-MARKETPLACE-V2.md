# FASE 44 — Marketplace V2

Marketplace genérico com `InstalledItem`, manifest JSON e schema.

## Endpoints

| Método | Path |
|--------|------|
| `GET` | `/api/agents/marketplace?type=` |
| `GET` | `/api/agents/marketplace/:type` |
| `POST` | `/api/agents/marketplace/:type/:id/install` |
| `POST` | `/api/agents/marketplace/:type/:id/uninstall` |

## Arquivos

- `marketplace/manifest.json`
- `marketplace/manifest.schema.json`

## Modelo

- `InstalledItem` — `(userId, itemType, itemId)` genérico
