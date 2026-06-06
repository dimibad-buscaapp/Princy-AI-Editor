# Princy Code (Code-OSS Custom IDE)

Future custom IDE based on Code-OSS with Princy AI Assistant pre-installed.

## Status

Scaffold only — no `vscode` submodule checkout in this delivery. Use the VS Code extension (`apps/vscode-extension`) for Phase 1.

## Future build steps

1. Clone `microsoft/vscode` as a git submodule under `vendor/vscode`.
2. Copy `product.json.template` to `vendor/vscode/product.json` and apply branding.
3. Run `node scripts/patch-code-oss.mjs` to bundle the Princy extension.
4. Build with `yarn` per upstream VS Code docs.

See [docs/PRINCY-CODE.md](../../docs/PRINCY-CODE.md) for the full roadmap.
