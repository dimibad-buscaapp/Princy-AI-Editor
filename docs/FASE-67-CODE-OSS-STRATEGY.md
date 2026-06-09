# FASE 67 — Estratégia Code-OSS

Estratégia técnica para fork, build, CI e conformidade legal do **Princy Code** baseado em Code-OSS.

---

## 1. Abordagem recomendada

**Submodule + Patches** — não fork permanente no GitHub.

| Abordagem | Prós | Contras |
|-----------|------|---------|
| Fork GitHub permanente | Controle total | Divergência, merge hell |
| **Submodule + patches** | Upstream sync controlado | Disciplina de pin/tag |
| Download tarball manual | Simples | Sem histórico, difícil CI |

**Decisão:** git submodule `microsoft/vscode` em `apps/princy-code/vendor/vscode`, pinado em tag de release estável.

---

## 2. Submodule setup (67.1)

### 2.1 Comandos iniciais (após aprovação)

```bash
cd apps/princy-code
git submodule add -b release/1.96 https://github.com/microsoft/vscode vendor/vscode
cd vendor/vscode
git checkout 1.96.2   # exemplo — pin versão estável
cd ../../..
```

Alternativa branch: `main` com tag específica — preferir **release branch** para builds reproduzíveis.

### 2.2 Pin de versão

| Campo | Valor recomendado |
|-------|-------------------|
| VS Code base | `1.96.x` (ajustar na 67.1 conforme compat extensão) |
| Electron (upstream) | Gerenciado pelo VS Code build |
| Extensão engines | `"vscode": "^1.85.0"` → validar compat |

Documentar pin em `apps/princy-code/VSCODE_PIN.md`.

### 2.3 Requisitos de build (Windows)

| Requisito | Mínimo |
|-----------|--------|
| RAM | 8 GB (16 GB recomendado) |
| Disco | 20 GB livres |
| Node | 22.x (monorepo) + versão exigida pelo VS Code upstream |
| Yarn | Classic 1.x (upstream VS Code) |
| Python | 3.x (node-gyp, native modules) |
| Visual Studio Build Tools | C++ workload |
| Windows SDK | Conforme upstream docs |

Referência upstream: https://github.com/microsoft/vscode/wiki/How-to-Contribute

---

## 3. product.json — Branding

Template existente: `apps/princy-code/product.json.template`

### 3.1 Campos críticos

```json
{
  "nameShort": "Princy Code",
  "nameLong": "Princy Code",
  "applicationName": "princy-code",
  "dataFolderName": ".princy-code",
  "win32DirName": "Princy Code",
  "urlProtocol": "princy-code",
  "darwinBundleIdentifier": "ai.princy.code",
  "extensionAllowedProposedApi": ["princy-ai.princy-assistant"]
}
```

### 3.2 Substituições obrigatórias (67.2)

| Upstream | Princy Code |
|----------|-------------|
| Visual Studio Code | Princy Code |
| Code - OSS | Princy Code |
| com.microsoft.* | ai.princy.code |
| .vscode | .princy-code |
| vscode: | princy-code: |

### 3.3 Telemetry e updates

No `product.json` patched:

- `enableTelemetry`: false (ou equivalente upstream)
- `updateUrl`: URL Princy GitHub Releases (67.15)
- Remover marketplace Microsoft default se necessário

---

## 4. patch-code-oss.mjs — Fluxo de implementação

Script: `apps/princy-code/scripts/patch-code-oss.mjs`

### 4.1 Pipeline

```
┌─────────────────────────────────────────────────────────┐
│ 1. Validar vendor/vscode existe                         │
│ 2. Merge product.json.template → vendor/vscode/product  │
│ 3. npm run build:vscode-extension (monorepo root)       │
│ 4. Copiar apps/princy-code/extensions/* →               │
│    vendor/vscode/extensions/                            │
│ 5. Aplicar patches/*.patch (git apply)                  │
│ 6. Copiar assets/ → vendor/vscode/resources/            │
│ 7. Log checksum / versão aplicada                       │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Built-in extensions

Code-OSS inclui extensões em `extensions/` do upstream. Princy extensions são adicionadas como:

```
vendor/vscode/extensions/princy-assistant/
vendor/vscode/extensions/princy-swarm/
...
```

Cada extensão deve ter `package.json` válido com `"extensionKind": ["ui", "workspace"]` conforme necessário.

**Alternativa MVP 67.1:** copiar VSIX descompactado ou symlink durante dev.

### 4.3 Ícones

| Asset | Destino upstream |
|-------|------------------|
| `assets/icon.ico` | `resources/win32/code.ico` (renomear) |
| `assets/icon.png` | Linux/AppImage |
| `assets/splash.html` | Welcome page custom (67.2) |

Origem parcial: `apps/desktop/assets/`.

---

## 5. Patches mínimos (`patches/`)

Preferir configuração via `product.json` antes de patch de código.

Patches candidatos (somente se necessário):

| Patch | Motivo |
|-------|--------|
| `welcome-page.patch` | Remover getting started Microsoft |
| `default-theme.patch` | Princy Neural Dark default |
| `telemetry.patch` | Garantir telemetry off |
| `builtin-extensions.patch` | Desabilitar extensões MS proprietárias |

Regra: **máximo 5 patches** na 67.1; cada patch documentado com rationale.

---

## 6. Build commands

### 6.1 Scripts npm propostos (raiz)

```json
{
  "princy-code:patch": "node apps/princy-code/scripts/patch-code-oss.mjs",
  "princy-code:compile": "node apps/princy-code/scripts/vscode-compile.mjs",
  "princy-code:minify": "cd apps/princy-code/vendor/vscode && npx gulp minify-vscode",
  "princy-code:build:win": "node apps/princy-code/scripts/build-win.mjs",
  "princy-code:build:linux": "node apps/princy-code/scripts/build-linux.mjs"
}
```

### 6.2 Fluxo Windows (67.15)

```bash
npm run princy-code:patch
cd apps/princy-code/vendor/vscode
npm ci
npm run compile
npx gulp minify-vscode
# NSIS via gulp vscode-win32-x64-min-ci (upstream)
```

Output esperado:

```
apps/princy-code/.build/win32-x64/Princy Code Setup.exe
→ renomear/copiar para dist/Princy-Code-Setup.exe
```

### 6.3 Fluxo Linux

```bash
npx gulp vscode-linux-x64-min-ci
# AppImage via upstream ou electron-builder wrapper
```

Output: `Princy-Code-x.x.x.AppImage`

---

## 7. CI/CD (67.15)

### 7.1 GitHub Actions proposto

Arquivo: `.github/workflows/princy-code-build.yml`

```yaml
jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - checkout with submodules
      - setup node 22
      - npm ci
      - npm run build:vscode-extension
      - npm run princy-code:patch
      - npm run princy-code:compile (vendor/vscode)
      - npx gulp minify-vscode
      - upload Princy-Code-Setup.exe artifact

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - similar → AppImage artifact
```

### 7.2 Cache

- npm cache em `vendor/vscode`
- electron download cache
- Tempo estimado CI: 45–90 min (primeiro build)

### 7.3 Releases

- Artefatos: `Princy-Code-Setup.exe`, `Princy-Code.AppImage`, `latest.yml`
- Repositório: `dimibad-buscaapp/Princy-AI-Editor` (mesmo do Electron atual)
- Auto-update: electron-updater compatible metadata (67.15)

---

## 8. Conformidade legal e branding

### 8.1 Licença

- Code-OSS: **MIT License**
- Princy extensions: MIT (monorepo LICENSE)
- Manter `ThirdPartyNotices.txt` do upstream + adições Princy

### 8.2 Proibido / remover

| Item | Ação |
|------|------|
| Binários Microsoft VS Code | Não distribuir |
| GitHub Copilot extension | Não incluir built-in |
| Telemetria Microsoft | Desabilitar |
| Logos VS Code / Microsoft | Substituir por Princy |
| Marketplace MS exclusivo | Usar Open VSX ou Princy Marketplace |

### 8.3 Permitido

| Item | Nota |
|------|------|
| Nome "Princy Code" | Distinto de "Visual Studio Code" |
| Protocol `princy-code://` | Distinto de `vscode://` |
| Extensões VS Code compatíveis | Open VSX |
| Créditos open source | About page |

### 8.4 About page (67.2)

Conteúdo:

- Princy Code vX.Y.Z
- Based on Code-OSS (MIT)
- Powered by Princy AI
- Link documentação + gateway

---

## 9. Migração do instalador Electron

| Fase | Instalador | Produto |
|------|------------|---------|
| Atual | `apps/desktop/dist/Princy-Code-Setup.exe` | Electron URL shell |
| 67.15 | `apps/princy-code/dist/Princy-Code-Setup.exe` | Code-OSS IDE |

Passos 67.15:

1. CI passa a buildar Code-OSS
2. `apps/desktop` marcado deprecated no README
3. Mesmo nome artefato para continuidade usuário
4. Smoke test checklist FASE 64 adaptado para IDE

---

## 10. Upgrade upstream

Processo mensal (documentar em `VSCODE_PIN.md`):

1. Identificar nova tag release VS Code
2. Branch submodule → nova tag
3. Re-aplicar patches
4. `npm run compile` local (vendor/vscode)
5. Test smoke extensões Princy
6. Atualizar pin doc + PR

---

## 11. Riscos

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Build falha Windows | Alta (primeira vez) | Dev machine dedicada, docs upstream |
| RAM insuficiente | Média | CI runner 16GB |
| Patch conflict upstream | Média | Minimizar patches |
| Extensão API break | Baixa | Pin VS Code + test ext |
| Tempo CI longo | Alta | Cache agressivo, build noturno |

---

## 12. Checklist 67.1 (primeiro milestone)

- [ ] Submodule adicionado e pinado
- [ ] `npm ci` install upstream OK
- [ ] `npm run compile` OK (Windows)
- [ ] `patch-code-oss.mjs` MVP funcional
- [ ] product.json mostra "Princy Code" no title bar
- [ ] Extensão princy-assistant carrega como built-in
- [ ] App abre sem crash

---

## Referências

- [FASE-67-ARQUITETURA.md](./FASE-67-ARQUITETURA.md)
- [FASE-67-ROADMAP-67.1-67.15.md](./FASE-67-ROADMAP-67.1-67.15.md)
- Upstream: https://github.com/microsoft/vscode/wiki/How-to-Contribute
- Open VSX: https://open-vsx.org/
