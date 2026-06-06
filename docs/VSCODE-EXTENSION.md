# Princy AI Assistant — VS Code Extension

## Build VSIX

```bash
cd /opt/Princy-AI-Editor
npm install
npm run package:vscode-extension
```

Output: `apps/vscode-extension/princy-ai.princy-assistant-0.1.0.vsix`

## Install

1. VS Code → Extensions → `...` → **Install from VSIX**
2. Select the `.vsix` file
3. Reload window

Or CLI:

```bash
code --install-extension apps/vscode-extension/princy-ai.princy-assistant-0.1.0.vsix
```

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `princy.endpoint` | `http://13.140.129.77:3407/api` | Gateway API base |
| `princy.enableGhostText` | `true` | Inline completions |
| `princy.ghostTextDebounceMs` | `500` | Debounce before ghost API call |
| `princy.enableAutonomousMode` | `false` | Autonomous patch planning |

## Commands

| Command | Description |
|---------|-------------|
| `Princy: Sign In` | Login with email/password |
| `Princy: Open Chat` | Side chat with SSE streaming |
| `Princy: Explain Selection` | Explain selected code |
| `Princy: Refactor Selection` | Refactor selection |
| `Princy: Fix Selection` | Fix selection |
| `Princy: Generate Tests` | Generate tests |
| `Princy: Ask About Selection` | QuickPick for inline actions |
| `Princy: Preview Patch` | Diff preview by patch ID |
| `Princy: Apply Patch` | Apply with confirmation |
| `Princy: Rollback Patch` | Rollback applied patch |
| `Princy: Explain Terminal Error` | Explain captured terminal output |
| `Princy: Fix Terminal Error` | Suggest fix (no auto-exec) |
| `Princy: Open Swarm` | Agent status panel |
| `Princy: Start Autonomous Mode` | Plan + approval flow |
| `Princy: Index Workspace` | Scan + context index |
| `Princy: Open Context Graph` | View indexed nodes |

## Activity Bar

- **Chat** — streaming webview
- **Swarm** — agent status + metrics

## Theme

**Princy Dark Neural** — Command Palette → Preferences: Color Theme

## Security

Sensitive files (`.env`, `id_rsa`, `*.pem`, `credentials.json`) are blocked from automatic upload. `package-lock.json` and `docker-compose.yml` require confirmation.

Ver também [VSCODE-EXTENSION-USAGE.md](./VSCODE-EXTENSION-USAGE.md) e [PRINCY-CODE-ALPHA.md](./PRINCY-CODE-ALPHA.md).

## Manual test checklist

1. Sign In
2. Open Chat → send message, verify streaming
3. Select code → Explain / Refactor
4. Type in editor → ghost text after 500ms
5. Preview + Apply patch (with confirmation)
6. Terminal error explain
7. Open Swarm → agents listed
8. Index workspace → context graph
