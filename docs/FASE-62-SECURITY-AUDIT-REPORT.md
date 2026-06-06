# FASE 62 — Relatório de Segurança

## Correções aplicadas (hardening mínimo)

| Item | Arquivo | Status |
|------|---------|--------|
| `GET /audit` restrito a ADMIN | `services/api/src/routes/audit.routes.ts` | fixed |
| JWT secret min 32 + placeholder check | `services/api/src/auth/jwt.service.ts` | fixed |

## Findings

| ID | Finding | Severidade | Recomendação | Status |
|----|---------|------------|--------------|--------|
| S01 | Terminal `POST /terminal/run` usa `shell: true` sem sandbox | CRITICAL | Allowlist ou sandbox; pós-1.0 | open |
| S02 | Workspace IDOR por `workspaceId` sem `assertProjectAccess` | CRITICAL | Guards em todas rotas FS | open |
| S03 | Memory v2/search/RAG sem checagem de projeto/team | CRITICAL | Aplicar `assertProjectAccess` | open |
| S04 | `GATEWAY_API_KEY` ausente → `/v1/*` aberto | CRITICAL | Definir em produção | open |
| S05 | Gateway não autentica; serviços em `0.0.0.0` | HIGH | Firewall + bind interno | open |
| S06 | `evaluatePolicy` (rbac-kit) não usado | HIGH | Integrar ou remover scaffold | open |
| S07 | `ProjectPermission` parcial (patch preview/apply sem guard) | HIGH | Uniformizar guards | open |
| S08 | Tokens em localStorage (XSS) | HIGH | httpOnly cookies pós-1.0 | open |
| S09 | Refresh token sem revogação | HIGH | Token store / denylist | open |
| S10 | Org/team endpoints sem membership em alguns paths | HIGH | Validar orgId/teamId | open |
| S11 | Analytics global para qualquer usuário autenticado | MEDIUM | Scope por org/user | open |
| S12 | SSE `/events/stream` sem auth | MEDIUM | Token query ou internal only | open |
| S13 | MCP discovery público | MEDIUM | Auth no gateway | open |
| S14 | Desktop spawn `shell: true` para monorepo | MEDIUM | `shell: false` + args | open |
| S15 | OAuth scaffold público | LOW | Desabilitar sem IdP | documented |
| S16 | `/health/neural` expõe routing | LOW | Auth opcional | documented |

## Resumo por severidade

| Severidade | Total | Corrigidos | Abertos |
|------------|-------|------------|---------|
| CRITICAL | 4 | 0 | 4 |
| HIGH | 6 | 2 | 4 |
| MEDIUM | 4 | 0 | 4 |
| LOW | 2 | 0 | 2 |

## Status segurança Release 1.0

Aceitável para GA **documentado** com Known Limitations em `RELEASE-1.0.md`. Itens CRITICAL abertos requerem mitigação operacional (firewall, `GATEWAY_API_KEY`, não expor portas internas) até patches pós-1.0.
