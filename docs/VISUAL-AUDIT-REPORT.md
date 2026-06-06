# Relatório de Auditoria Visual — Princy AI Editor

Data: 2026-06-05

## Bloqueadores identificados

| Bloqueador | Arquivo | Ação |
|------------|---------|------|
| Sidebar 220px colapsável | `design-system/layout/Sidebar.tsx` | Substituir por `layout/PrincySidebar.tsx` 160px fixa |
| Padding shell global | `styles/shell.css` | ReferenceShell com padding 0 em rotas imersivas |
| TopBar/StatusBar genéricos | `TopBar.tsx`, `StatusBar.tsx` | Chrome por rota |
| glass-panel / luminous-border | `effects.css` + 18 arquivos | Remover das 5 telas oficiais |
| HolographicCard | `HomeView.tsx` | Substituir por cards reference |
| ParticleField forte | `PrincyShell.tsx` | Opacity reduzida em reference-locked |
| Tokens divergentes | `tokens.css` | Valores exatos da spec |
| RefOverlay 220px | `RefOverlay.tsx` | Calibrar para 160px |
| api/api parcial | `lib/api.ts` | normalizeApiBase robusto |

## Mapa por tela

| Tela | Componentes | CSS | Status |
|------|-------------|-----|--------|
| Global | PrincyShell → ReferenceShell | shell.css, sidebar.css | Refatorando |
| Index | HomeView | home.css | Refatorando |
| Chat | ChatView, ChatSidebar, ChatInput, ChatMessage | chat.css | Refatorando |
| Editor | EditorView, PrincyAssistantPanel | editor.css | Refatorando |
| Swarm | SwarmView, AgentHoloCard, NeuralConnections | swarm.css | Refatorando |

## Assets de referência

Copiados para `apps/frontend/public/princy/refs/`:
- 02-sidebar.png, 03-index.png, 04-chat.png, 05-editor.png, 06-swarm.png
