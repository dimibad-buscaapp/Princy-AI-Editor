# Princy AI Assistant — Guia de Uso

## Instalação

```bash
code --install-extension apps/vscode-extension/princy-assistant-0.1.0.vsix
```

## Primeiro uso

1. Command Palette → **Princy: Sign In**
2. **Princy: Open Chat** — envie uma mensagem; observe badge de modelo e TTFT
3. Abra pasta de projeto — workspace é linkado automaticamente

## Comandos principais

| Comando | Uso |
|---------|-----|
| Princy: Open Chat | Chat lateral com streaming |
| Princy: Explain Selection | Selecione código → explicação |
| Princy: Ask About Selection | QuickPick de ações |
| Princy: Index Workspace | Indexa perfil + memory |
| Princy: Open Swarm | Status + tarefas |
| Princy: Start Autonomous Mode | Requer `princy.enableAutonomousMode` |

## Settings

| Setting | Descrição |
|---------|-----------|
| `princy.endpoint` | URL do gateway (`.../api`) |
| `princy.enableGhostText` | Ghost text on/off |
| `princy.ghostTextDebounceMs` | Debounce (default 500) |
| `princy.enableAutonomousMode` | Modo autônomo |

## Troubleshooting

**Chat lento:** verifique `CHAT_FAST_MODEL=qwen2.5:3b` no servidor e execute `node scripts/warm-ollama.mjs`.

**401 Unauthorized:** execute **Princy: Sign Out** e sign in novamente.

**Ghost text não aparece:** confirme `princy.enableGhostText` e mínimo 8 caracteres digitados.

## Performance esperada

- SSE `connected` em < 500ms
- TTFT típico 0.9–2s (modelo warm)
- Cache hit em perguntas repetidas
