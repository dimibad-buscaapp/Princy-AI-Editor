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
bash scripts/rc1-smoke.sh
npm run health:linux
```

## Tag

```bash
git tag v1.0.0-rc.1
```
