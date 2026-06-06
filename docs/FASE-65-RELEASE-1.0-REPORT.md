# FASE 65 — Relatório Release 1.0

- [x] `CHANGELOG.md` criado
- [x] `docs/RELEASE-1.0.md` criado
- [x] Versões bump `1.0.0` (root + desktop + lockfile)
- [x] Branding GA (frontend + desktop)
- [ ] Tag local `v1.0.0` — pendente commit aprovado
- [x] Smoke final executado
- [ ] GitHub Release publicada — aguardando aprovação humana

## Validação final

| Check | Resultado |
|-------|-----------|
| `npm run auth-smoke` | 20/20 OK |
| `npm run health:linux` | 16/16 OK |
| `bash scripts/rc1-smoke.sh` | OK (desktop 1.0.0) |

## Tag (após commit aprovado)

```bash
git tag -a v1.0.0 -m "Release 1.0.0"
```

**Não publicado** automaticamente. Tag não criada nesta sessão — working tree com alterações não commitadas.
