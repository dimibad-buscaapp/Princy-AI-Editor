# FASE 63 — Windows Build Pipeline

Garantir geração do instalador NSIS `Princy-Code-Setup.exe`.

## Configuração

| Item | Path |
|------|------|
| electron-builder | `apps/desktop/electron-builder.yml` |
| Ícone Windows | `apps/desktop/assets/icon.ico` |
| Splash | `apps/desktop/assets/splash.html` |
| Auto-update | `apps/desktop/src/updater.ts` |

## Comandos

```bash
npm run desktop:build    # qualquer OS
npm run desktop:dist     # Windows only → Princy-Code-Setup.exe
```

## Script de validação

```powershell
powershell -ExecutionPolicy Bypass -File scripts/windows-build-check.ps1
```

## CI

`.github/workflows/build.yml` executa `desktop:build` + `desktop:dist` em `windows-latest` e publica artefato `Princy-Code-Setup.exe`.

## Artefato esperado

```
apps/desktop/dist/Princy-Code-Setup.exe
```
