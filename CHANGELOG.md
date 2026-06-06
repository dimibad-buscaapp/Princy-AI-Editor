# Changelog

All notable changes to Princy AI Editor / Princy Code.

## [1.0.0] — 2026-06-07

### Release 1.0 (GA)

First general-availability release after RC1 (`v1.0.0-rc.1`).

### Added (Phases 1–60)

- Neural router, swarm orchestration, agent memory, self-improvement, task learning
- Autonomous projects, cloud sync, team workspaces, shared memory
- Realtime collaboration (presence, locks), project permissions
- Marketplace V2 + Agent/Template/MCP/Theme stores
- RBAC scaffold, audit logs, SSO scaffold, organizations, usage analytics
- Distributed swarm workers, GPU pools, BullMQ scheduler (`:3409`)
- Hybrid routing policies, performance hardening
- Electron desktop shell, authenticated smoke suite (`npm run auth-smoke`)

### Fixed (Phases 61–65)

- UI version aligned to `v1.0.0` (was `v2.5.0`)
- Desktop and electron-builder branding: "Princy Code" GA (removed Beta suffix)
- `electron-builder` publish owner → `dimibad-buscaapp`
- `GET /api/audit` restricted to `ADMIN` role
- JWT secret validation aligned (min 32 chars, placeholder rejection)
- Removed accidental `.github-push-probe-*` file from repository

### Security (Phase 62)

- Documented CRITICAL/HIGH findings in `docs/FASE-62-SECURITY-AUDIT-REPORT.md`
- Minimal hardening: audit route + JWT validation (see Fixed above)

### Known Limitations

- `prisma generate` ERR_REQUIRE_ESM on Linux VPS (use pre-built dist + raw SQL migrations)
- `GATEWAY_API_KEY` must be set in production to protect `/v1/*`
- Terminal endpoint uses shell execution — restrict network exposure
- Memory/workspace IDOR guards incomplete on some routes (documented)
- Windows installer requires separate backend service setup (`install-services.ps1`)
- Code signing not configured for NSIS installer
- RBAC `evaluatePolicy` scaffold not wired to routes

### Breaking Changes

- `GET /api/audit` now requires `ADMIN` role (was any authenticated user)
- Product name changed from "Princy Code Beta" to "Princy Code"

## [1.0.0-rc.1] — 2026-06-06

RC1 release — phases 39–60. See `docs/RC1-RELEASE.md`.
