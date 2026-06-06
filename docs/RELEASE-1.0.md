# Princy Code — Release 1.0

**Version:** `1.0.0`  
**Date:** 2026-06-07  
**Previous:** `v1.0.0-rc.1`

## Highlights

Princy Code 1.0 is the GA release of the Princy AI Editor platform:

- Full-stack AI editor with swarm agents, memory, marketplace, and team workspaces
- 16 microservices + gateway + scheduler + Electron desktop
- Authenticated smoke suite covering 20 critical API routes
- Windows NSIS installer pipeline (`Princy-Code-Setup.exe` via CI)

## Phases delivered (61–65)

| Phase | Deliverable |
|-------|-------------|
| 61 | Stabilization audit + smoke validation |
| 62 | Security audit (CRITICAL/HIGH/MEDIUM/LOW) |
| 63 | `windows-build-check.ps1` + CI desktop dist |
| 64 | Installer QA checklist |
| 65 | CHANGELOG, GA branding, tag `v1.0.0` |

## Smoke validation

```bash
npm run auth-smoke
npm run health:linux
bash scripts/rc1-smoke.sh
```

## Windows installer

```powershell
powershell -ExecutionPolicy Bypass -File scripts/windows-build-check.ps1
```

Artifact: `apps/desktop/dist/Princy-Code-Setup.exe` (Windows / GitHub Actions)

## Known limitations

See [CHANGELOG.md](../CHANGELOG.md) — section Known Limitations.

Critical operational mitigations for production:

1. Set `GATEWAY_API_KEY` in `.env`
2. Expose only ports `3400` (frontend) and `3407` (gateway) publicly
3. Run `scripts/windows/install-services.ps1` for backend on Windows VPS

## Tag

```bash
git tag v1.0.0
```

**Not published automatically.** Push and GitHub Release require human approval.

## Full changelog

[CHANGELOG.md](../CHANGELOG.md)
