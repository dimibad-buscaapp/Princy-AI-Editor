# FASE 64 — Installer QA

Checklist de validação da experiência de instalação Windows.

## Pré-requisito

Artefato: `apps/desktop/dist/Princy-Code-Setup.exe` (Windows ou CI).

## Checklist

| # | Item | Verificação |
|---|------|-------------|
| 1 | Instalação limpa | NSIS, diretório customizável |
| 2 | Primeira execução | Splash `assets/splash.html` |
| 3 | Abertura frontend | `http://127.0.0.1:3400` |
| 4 | Tratamento de erro | Página em `error-page.ts` |
| 5 | Logs | IPC `princy:open-logs` |
| 6 | Atalhos | Start Menu / Desktop |
| 7 | Uninstall | Painel de Controle |
| 8 | Auto-update | `updater.ts` + `latest.yml` (sem publicar) |

## Known Issues

- Sem assinatura de código (SmartScreen Windows)
- Backend não embutido no instalador
- Serviços requerem `scripts/windows/install-services.ps1` separado

## Resolved Issues

- Branding "Beta" removido (Fase 65)
- `publish.owner` corrigido para `dimibad-buscaapp`
- `productName` alinhado a `Princy Code`
