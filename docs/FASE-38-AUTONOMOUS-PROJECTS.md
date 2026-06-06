# FASE 38 — Autonomous Projects

## Objetivo

Projetos autônomos de longa duração com objetivos, milestones, execuções, bloqueios e aprovações humanas.

## Modelos

- `AutonomousProject` — title, objective, milestones, blockers, status
- `AutonomousProjectRun` — execuções vinculadas ao projeto

## Endpoints (gateway :3407)

| Método | Path |
|--------|------|
| `POST` | `/api/autonomous/projects` |
| `GET` | `/api/autonomous/projects` |
| `GET` | `/api/autonomous/projects/:id` |
| `POST` | `/api/autonomous/projects/:id/run` |
| `POST` | `/api/autonomous/projects/:id/pause` |
| `POST` | `/api/autonomous/projects/:id/approve` |

## Frontend

`AutonomousView` — lista de projetos + botão "Criar Projeto".
