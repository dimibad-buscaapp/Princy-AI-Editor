# FASE 65 — Release 1.0

Versão GA `v1.0.0` — transformação RC1 → Release 1.0.

## Entregáveis

| Artefato | Path |
|----------|------|
| CHANGELOG | `CHANGELOG.md` |
| Release Notes | `docs/RELEASE-1.0.md` |
| Tag | `v1.0.0` (local, não publicada) |

## Version bumps

- `package.json` → `1.0.0`
- `apps/desktop/package.json` → `1.0.0`
- UI `princyVersion` → `v1.0.0`

## Smoke final

```bash
npm run auth-smoke
npm run health:linux
bash scripts/rc1-smoke.sh
```
