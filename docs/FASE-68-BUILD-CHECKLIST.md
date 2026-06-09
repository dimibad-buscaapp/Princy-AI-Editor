# FASE 68 — Build Checklist

Smoke checklist for Princy Code Ultimate Desktop (adapted from FASE 64).

## Pre-build

- [ ] `npm run build:vscode-extension` passes
- [ ] `npm run princy-code:sync` passes
- [ ] `packages/princy-ui/dist/*.js` bundles exist
- [ ] Zero `localhost` / `127.0.0.1` in extension settings defaults

## Extension smoke (VS Code / Princy Code with extension)

- [ ] Sign in to VPS gateway
- [ ] Chat V3: send message, streaming tokens, agent picker
- [ ] Swarm: agent cards load, SSE/poll activity
- [ ] Memory: list, search, create, delete
- [ ] Workspace: index, detect, patch preview/rollback wired
- [ ] Ghost text: status bar shows model + latency
- [ ] Inline: Ctrl+Shift+L widget, context menu actions
- [ ] Autonomous: run, timeline, cancel
- [ ] MCP: server list, test button
- [ ] Observability: health + router metrics
- [ ] Settings: import/export JSON
- [ ] Startup hub: recent projects, health cards

## Performance (VPS)

Run: `node scripts/princy-perf-benchmark.mjs`

| Metric | Target |
|--------|--------|
| Chat TTFT | < 2s |
| Ghost text | < 300ms |
| Memory load | < 1s |
| Workspace scan | < 5s |

## Code-OSS build (next stage)

- [ ] `npm run princy-code:init-submodule`
- [ ] `npm run princy-code:compile`
- [ ] `npm run princy-code:build:win` → `Princy-Code-Setup.exe`
- [ ] `node apps/princy-code/scripts/build-portable.mjs` → `Princy-Code-Portable.zip`
- [ ] Linux AppImage build

## CI

- [ ] `.github/workflows/princy-code-build.yml` — no `continue-on-error` on compile/build
- [ ] Extension job green on push
