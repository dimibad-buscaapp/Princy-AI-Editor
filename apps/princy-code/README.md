# Princy Code (Code-OSS Custom IDE)

IDE desktop oficial baseada em **Code-OSS** com Princy AI built-in.

## Quick start

```bash
# 1. Init Code-OSS submodule (~2GB download)
npm run princy-code:init-submodule

# 2. Build extensions + patch vendor
npm run build:vscode-extension
npm run princy-code:patch

# 3. Compile Code-OSS (Windows, 16GB RAM recommended)
npm run princy-code:compile

# 4. Build installer
npm run princy-code:build:win    # → apps/princy-code/dist/Princy-Code-Setup.exe
npm run princy-code:build:linux  # → apps/princy-code/dist/Princy-Code.AppImage
```

## Structure

```
apps/princy-code/
  vendor/vscode/       # Code-OSS submodule
  extensions/          # synced built-in extensions
  config/              # princy-services.json, product.overrides.json
  scripts/             # patch, sync, build
  assets/              # welcome, icons
  dist/                # installers
```

## Built-in extensions

| Extension | Package |
|-----------|---------|
| princy-assistant | `apps/vscode-extension` |
| princy-swarm | `apps/princy-swarm` |
| princy-memory | `apps/princy-memory` |
| princy-workspace | `apps/princy-workspace` |

## Docs

- [FASE-67-PRINCY-CODE-DESKTOP.md](../../docs/FASE-67-PRINCY-CODE-DESKTOP.md)
- [FASE-67-CODE-OSS-STRATEGY.md](../../docs/FASE-67-CODE-OSS-STRATEGY.md)
- [VSCODE_PIN.md](./VSCODE_PIN.md)

## Legacy

`apps/desktop` (Electron URL shell) is deprecated — use Princy Code IDE builds from this package.
