# FASE 62 — Security Audit

Revisão de segurança documentada para Release 1.0. **Sem mudanças arquiteturais.**

## Metodologia

1. Revisão estática de código (auth, guards, Electron, env)
2. Validação manual de endpoints (`curl` com/sem JWT)
3. Baseline autenticada: `npm run auth-smoke`
4. Classificação: **CRITICAL / HIGH / MEDIUM / LOW**

## Checklist

| Área | Itens |
|------|-------|
| JWT | secret strength, placeholder, refresh revocation, localStorage |
| RBAC | `evaluatePolicy`, `ProjectPermission` |
| Team / Memory | IDOR, membership, scope TEAM |
| Audit | leitura/escrita, cobertura |
| Electron | preload, IPC, spawn, updater |
| Secrets | `.env`, `GATEWAY_API_KEY`, ports |
| Rotas públicas | OpenAI-compat, SSE, MCP, health |
| Injection | terminal `shell:true`, path traversal |

## Hardening mínimo permitido

- Restringir `GET /audit` a role `ADMIN`
- Alinhar validação `JwtService` com `JwtVerifier` (min 32 chars, placeholder)
