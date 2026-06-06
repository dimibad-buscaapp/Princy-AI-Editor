import { HttpError } from "@princy/core";
import { prisma } from "@princy/database";
import { AutonomousWorkflow } from "./autonomous-workflow.js";

function cuid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_MILESTONES = [
  { title: "Planejamento", status: "PENDING" },
  { title: "Implementação", status: "PENDING" },
  { title: "Testes", status: "PENDING" },
  { title: "Revisão", status: "PENDING" },
  { title: "Entrega", status: "PENDING" }
];

export class AutonomousProjectService {
  private readonly workflow = new AutonomousWorkflow();

  async create(input: { title: string; objective: string; description?: string; projectId?: string }) {
    const id = cuid("ap");
    await prisma.$executeRaw`
      INSERT INTO "AutonomousProject" (id, title, objective, description, "projectId", status, milestones, blockers, "currentMilestone", "createdAt", "updatedAt")
      VALUES (${id}, ${input.title}, ${input.objective}, ${input.description ?? null}, ${input.projectId ?? null},
        'PENDING', ${JSON.stringify(DEFAULT_MILESTONES)}::jsonb, '[]'::jsonb, 0, NOW(), NOW())
    `;
    return this.getById(id);
  }

  async list(limit = 50) {
    return prisma.$queryRaw`
      SELECT * FROM "AutonomousProject" ORDER BY "createdAt" DESC LIMIT ${limit}
    `;
  }

  async getById(id: string) {
    const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT * FROM "AutonomousProject" WHERE id = ${id} LIMIT 1
    `;
    const project = rows[0];
    if (!project) throw new HttpError(404, "not_found", "Project not found");

    const runs = await prisma.$queryRaw`
      SELECT * FROM "AutonomousProjectRun" WHERE "projectId" = ${id} ORDER BY "createdAt" DESC LIMIT 20
    `;
    return { project, runs };
  }

  async run(id: string, authToken?: string) {
    const detail = await this.getById(id);
    const project = detail.project;
    if (String(project.status) === "RUNNING") {
      throw new HttpError(409, "conflict", "Project already running");
    }

    const runId = cuid("apr");
    await prisma.$executeRaw`
      INSERT INTO "AutonomousProjectRun" (id, "projectId", status, "startedAt", "createdAt")
      VALUES (${runId}, ${id}, 'RUNNING', NOW(), NOW())
    `;
    await prisma.$executeRaw`
      UPDATE "AutonomousProject" SET status = 'RUNNING', "updatedAt" = NOW() WHERE id = ${id}
    `;

    try {
      const result = await this.workflow.start(String(project.objective), project.projectId as string | undefined, authToken);
      await prisma.$executeRaw`
        UPDATE "AutonomousProjectRun" SET status = 'COMPLETED', result = ${JSON.stringify(result)}::jsonb, "completedAt" = NOW()
        WHERE id = ${runId}
      `;
      await prisma.$executeRaw`
        UPDATE "AutonomousProject" SET status = 'COMPLETED', "currentMilestone" = 5, "updatedAt" = NOW() WHERE id = ${id}
      `;
      return { runId, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : "run failed";
      await prisma.$executeRaw`
        UPDATE "AutonomousProjectRun" SET status = 'FAILED', error = ${message}, "completedAt" = NOW() WHERE id = ${runId}
      `;
      await prisma.$executeRaw`
        UPDATE "AutonomousProject" SET status = 'FAILED', blockers = ${JSON.stringify([{ message, at: new Date().toISOString() }])}::jsonb, "updatedAt" = NOW()
        WHERE id = ${id}
      `;
      throw error;
    }
  }

  async pause(id: string) {
    await prisma.$executeRaw`
      UPDATE "AutonomousProject" SET status = 'CANCELLED', "updatedAt" = NOW() WHERE id = ${id}
    `;
    return this.getById(id);
  }

  async approve(id: string, approvalId: string, authToken?: string) {
    const detail = await this.getById(id);
    const goalRows = await prisma.$queryRaw<Array<{ goalId: string }>>`
      SELECT "goalId" FROM "ApprovalRequest" WHERE id = ${approvalId} LIMIT 1
    `;
    const goalId = goalRows[0]?.goalId;
    if (!goalId) throw new HttpError(404, "not_found", "Approval not found");

    const result = await this.workflow.complete(goalId, approvalId, authToken);
    await prisma.$executeRaw`
      UPDATE "AutonomousProject" SET status = 'COMPLETED', "updatedAt" = NOW() WHERE id = ${id}
    `;
    return { project: detail.project, result };
  }
}
