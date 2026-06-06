# FASE 32 — Electron Desktop (Princy Code)

Shell desktop nativo para o frontend Princy existente (`:3400`), sem duplicar UI.

## Pré-requisitos

| Ambiente | Requisito |
|----------|-----------|
| Dev / build TS | Node.js 22+, npm 10+ |
| Instalador `.exe` | **Windows 10/11** (NSIS) |
| Serviços locais | Monorepo com frontend, API, gateway (portas 3400–3408) |

## Estrutura

```
apps/desktop/
  package.json
  tsconfig.json
  electron-builder.yml
  assets/
    icon.ico
    icon.png
    splash.html
  src/
    main.ts
    preload.ts
    splash.ts
    health.ts
    services.ts
    error-page.ts
    updater.ts
  out/          # TypeScript compilado (main process)
  dist/         # Artefatos electron-builder (instalador / unpacked)
```

## Desenvolvimento

O app inicia automaticamente `npm run start` no monorepo e exibe splash até o frontend responder em `:3400`.

```bash
# Na raiz do monorepo
npm run desktop:dev
```

Equivalente:

```bash
npm run dev -w @princy/desktop
```

Variáveis úteis:

| Variável | Descrição |
|----------|-----------|
| `PRINCY_DEV=1` | Usa `localhost:3400` (setado automaticamente em `dev`) |
| `PRINCY_FRONTEND_PORT` | Porta do frontend (padrão `3400`) |
| `PRINCY_MONOREPO_ROOT` | Raiz do monorepo para auto-start (instalador Windows) |

## Build

```bash
npm run desktop:build
```

Gera `apps/desktop/out/main.js`, `preload.js`, etc.

## Instalador Windows

**Execute em máquina Windows:**

```bash
npm run desktop:dist
```

Saída esperada:

```
apps/desktop/dist/Princy-Code-Setup.exe
```

Empacotamento Linux (unpacked, sem `.exe`):

```bash
npm run desktop:pack
```

## Comportamento ao abrir

1. Splash **Princy Code** — *AI Development Environment*
2. Auto-start `npm run start` no monorepo
3. Poll `http://127.0.0.1:3400` (ou `localhost` em dev)
4. Janela principal carrega o frontend
5. Se timeout (~90s): tela amigável com botão **Tentar novamente**

## Segurança

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- Preload expõe apenas `princyDesktop.onCommandPalette` e `platform`

## Problemas comuns

| Problema | Solução |
|----------|---------|
| `Cannot find module electron` | Use `npm run desktop:dev` (não `tsx src/main.ts`) |
| Porta 3400 ocupada | Pare PM2/serviços duplicados antes de abrir o desktop |
| `.exe` não gera na VPS Linux | Rode `desktop:dist` no Windows; Linux só gera `linux-unpacked` |
| Instalador sem serviços | Defina `PRINCY_MONOREPO_ROOT` apontando para pasta com `package.json` |

## Scripts raiz

| Script | Ação |
|--------|------|
| `desktop:dev` | Electron em modo dev |
| `desktop:build` | Compila TypeScript |
| `desktop:dist` | Instalador NSIS Windows |
| `desktop:pack` | Pacote unpacked (dir) |

## Próximos passos

- Auto-update channel configurável (`PRINCY_UPDATE_CHANNEL`)
- Integração com `scripts/windows/install-services.ps1` (NSSM)
- macOS `.dmg` e assinatura de código
