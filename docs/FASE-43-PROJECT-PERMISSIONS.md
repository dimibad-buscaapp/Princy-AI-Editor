# FASE 43 — Project Permissions

Capabilities granulares por projeto com `requireProjectCapability` em `@princy/core`.

## Modelo

- `ProjectPermission` — `(projectId, userId, capability)` único

## Capabilities

`read`, `write`, `swarm`, `devops`, `autonomous`, `patch`, `admin`

## Guards

- `POST /api/swarm/run` — `swarm`
- `POST /api/devops/diagnose` — `devops`
- `POST /api/patch/create` — `patch`
- `POST /api/autonomous/projects` — `autonomous`
