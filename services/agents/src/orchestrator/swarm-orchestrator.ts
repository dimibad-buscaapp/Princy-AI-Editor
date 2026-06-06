import { eventBus } from "@princy/event-bus";
import { prisma } from "@princy/database";
import type { SwarmAgentRole } from "../swarm/swarm-artifacts.js";
import { getAgentMemoryContext } from "@princy/memory";
import { AUTONOMOUS_PIPELINE } from "../agents/swarm-agents.js";
import type { SwarmRole } from "../swarm/swarm-registry.js";
import { swarmRegistry } from "../swarm/swarm-registry.js";
import {
  buildTaskOutput,
  mergeRunArtifacts,
  PHASE34_PIPELINE_ROLES,
  type SwarmTaskOutput
} from "../swarm/swarm-artifacts.js";
import { AgentExecutionEngine } from "./agent-execution-engine.js";

export type SwarmRunRecord = {
  id: string;
  objective: string;
  context: string | null;
  status: string;
  currentAgent: string | null;
  progress: number;
  pipelineId: string;
  artifacts: unknown;
  startedAt: Date | null;
  completedAt: Date | null;
  durationMs: number | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StartRunInput = {
  objective: string;
  context?: string;
  title?: string;
  projectId?: string;
};

const cancelFlags = new Map<string, boolean>();

function cuid() {
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function runId() {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function pipelineId() {
  return `pipe_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export class SwarmOrchestrator {
  private readonly engine = new AgentExecutionEngine();

  private publish(name: string, payload: unknown) {
    eventBus.publish({ type: "agent", name, payload });
  }

  isCancelled(runId: string) {
    return cancelFlags.get(runId) === true;
  }

  cancelRun(runId: string) {
    cancelFlags.set(runId, true);
  }

  async startRun(input: StartRunInput) {
    const pid = pipelineId();
    const id = runId();
    const title = input.title ?? input.objective.slice(0, 120);
    const parentId = cuid();

    await prisma.$executeRaw`
      INSERT INTO "SwarmRun" (id, objective, context, status, progress, "pipelineId", "createdAt", "updatedAt")
      VALUES (${id}, ${input.objective}, ${input.context ?? null}, 'PENDING'::"TaskStatus", 0, ${pid}, NOW(), NOW())
    `;

    await prisma.$executeRaw`
      INSERT INTO "SwarmTask" (id, "pipelineId", title, description, "agentRole", status, "order", input, "createdAt", "updatedAt")
      VALUES (${parentId}, ${pid}, ${title}, ${input.context ?? input.objective}, 'COORDINATOR'::"SwarmAgentRole", 'PENDING', 0, ${JSON.stringify({ objective: input.objective, context: input.context, projectId: input.projectId })}::jsonb, NOW(), NOW())
    `;

    for (let i = 0; i < PHASE34_PIPELINE_ROLES.length - 1; i++) {
      const role = PHASE34_PIPELINE_ROLES[i + 1]!;
      const taskId = cuid();
      await prisma.$executeRaw`
        INSERT INTO "SwarmTask" (id, "pipelineId", "parentTaskId", title, description, "agentRole", status, "order", input, "createdAt", "updatedAt")
        VALUES (${taskId}, ${pid}, ${parentId}, ${`${role}: ${title}`}, ${input.context ?? null}, ${role}::"SwarmAgentRole", 'PENDING', ${i + 1}, ${JSON.stringify({ objective: input.objective, context: input.context, projectId: input.projectId })}::jsonb, NOW(), NOW())
      `;
    }

    const rows = await prisma.$queryRaw<SwarmRunRecord[]>`
      SELECT * FROM "SwarmRun" WHERE id = ${id} LIMIT 1
    `;
    return rows[0]!;
  }

  async executeRun(runId: string) {
    const rows = await prisma.$queryRaw<SwarmRunRecord[]>`
      SELECT * FROM "SwarmRun" WHERE id = ${runId} LIMIT 1
    `;
    const run = rows[0];
    if (!run) throw new Error("Run not found");

    const startedAt = Date.now();
    await prisma.$executeRaw`
      UPDATE "SwarmRun" SET status = 'RUNNING'::"TaskStatus", "startedAt" = NOW(), progress = 0, error = NULL, "updatedAt" = NOW()
      WHERE id = ${runId}
    `;

    this.publish("swarm.started", { runId, objective: run.objective, pipelineId: run.pipelineId });

    const tasks = (await prisma.$queryRaw`
      SELECT * FROM "SwarmTask" WHERE "pipelineId" = ${run.pipelineId} ORDER BY "order" ASC
    `) as Array<Record<string, unknown>>;

    const pipelineSteps = AUTONOMOUS_PIPELINE;
    const total = pipelineSteps.length;
    let previous = "";
    const stepOutputs: SwarmTaskOutput[] = [];

    for (let index = 0; index < pipelineSteps.length; index++) {
      if (this.isCancelled(runId)) {
        await prisma.$executeRaw`
          UPDATE "SwarmRun" SET status = 'CANCELLED'::"TaskStatus", "completedAt" = NOW(), "durationMs" = ${Date.now() - startedAt}, "updatedAt" = NOW()
          WHERE id = ${runId}
        `;
        return;
      }

      const step = pipelineSteps[index]!;
      const role = step.role as SwarmRole;
      const agentRole = role as SwarmAgentRole;
      const task = tasks.find((t) => String(t.agentRole) === role);
      const taskId = task ? String(task.id) : undefined;

      const progress = Math.round((index / total) * 100);
      await prisma.$executeRaw`
        UPDATE "SwarmRun" SET "currentAgent" = ${agentRole}::"SwarmAgentRole", progress = ${progress}, "updatedAt" = NOW()
        WHERE id = ${runId}
      `;

      if (taskId) {
        await prisma.$executeRaw`UPDATE "SwarmTask" SET status = 'RUNNING'::"TaskStatus", "updatedAt" = NOW() WHERE id = ${taskId}`;
      }

      swarmRegistry.setStatus(role, "busy");
      this.publish("neural.step.started", { role, runId, taskId, pipelineId: run.pipelineId });

      const stepStarted = Date.now();
      try {
        const input = (task?.input ?? {}) as { objective?: string; context?: string; projectId?: string };
        const projectId = input.projectId;
        const memoryContext = await getAgentMemoryContext(role, projectId);
        const baseContext = input.context ?? run.context ?? undefined;
        const enrichedContext = [baseContext, memoryContext].filter(Boolean).join("\n\n");

        const result = await this.engine.execute(
          step.agent,
          {
            objective: input.objective ?? run.objective,
            context: enrichedContext || undefined,
            previousOutput: previous
          },
          { taskId, agentRole: role, projectId }
        );

        previous = result.output;
        const output = buildTaskOutput(agentRole, result.output);
        stepOutputs.push(output);

        const durationMs = Date.now() - stepStarted;
        if (taskId) {
          await prisma.$executeRaw`
            UPDATE "SwarmTask" SET status = 'COMPLETED'::"TaskStatus", output = ${JSON.stringify(output)}::jsonb,
              logs = ${JSON.stringify([{ at: new Date().toISOString(), message: "completed", durationMs }])}::jsonb,
              "updatedAt" = NOW() WHERE id = ${taskId}
          `;
        }

        swarmRegistry.recordRun(role, `${role} concluiu`, 1, durationMs, true);
        this.publish("neural.step.completed", { role, runId, taskId, durationMs, pipelineId: run.pipelineId });
      } catch (error) {
        const durationMs = Date.now() - stepStarted;
        const message = error instanceof Error ? error.message : "failed";
        const output = { text: message, artifacts: [] as SwarmTaskOutput["artifacts"] };

        if (taskId) {
          await prisma.$executeRaw`
            UPDATE "SwarmTask" SET status = 'FAILED'::"TaskStatus", output = ${JSON.stringify(output)}::jsonb,
              logs = ${JSON.stringify([{ at: new Date().toISOString(), message, durationMs }])}::jsonb,
              "updatedAt" = NOW() WHERE id = ${taskId}
          `;
        }

        swarmRegistry.recordRun(role, `${role} falhou`, 0, durationMs, false);
        this.publish("neural.step.failed", { role, runId, taskId, error: message, pipelineId: run.pipelineId });

        await prisma.$executeRaw`
          UPDATE "SwarmRun" SET status = 'FAILED'::"TaskStatus", progress = ${Math.round(((index + 1) / total) * 100)},
            error = ${message}, "completedAt" = NOW(), "durationMs" = ${Date.now() - startedAt},
            artifacts = ${JSON.stringify(mergeRunArtifacts(stepOutputs))}::jsonb, "updatedAt" = NOW()
          WHERE id = ${runId}
        `;
        return;
      }
    }

    const allArtifacts = mergeRunArtifacts(stepOutputs);
    const durationMs = Date.now() - startedAt;

    await prisma.$executeRaw`
      UPDATE "SwarmRun" SET status = 'COMPLETED'::"TaskStatus", progress = 100, "currentAgent" = NULL,
        "completedAt" = NOW(), "durationMs" = ${durationMs},
        artifacts = ${JSON.stringify(allArtifacts)}::jsonb, "updatedAt" = NOW()
      WHERE id = ${runId}
    `;

    this.publish("swarm.completed", {
      runId,
      pipelineId: run.pipelineId,
      artifacts: allArtifacts,
      durationMs
    });
  }

  async getRunDetail(runId: string) {
    const rows = await prisma.$queryRaw<SwarmRunRecord[]>`
      SELECT * FROM "SwarmRun" WHERE id = ${runId} LIMIT 1
    `;
    const run = rows[0];
    if (!run) return null;

    const tasks = (await prisma.$queryRaw`
      SELECT * FROM "SwarmTask" WHERE "pipelineId" = ${run.pipelineId} ORDER BY "order" ASC
    `) as Array<Record<string, unknown>>;

    return { run, steps: tasks };
  }

  async listRuns(options?: { status?: string; limit?: number }) {
    const limit = options?.limit ?? 50;
    if (options?.status) {
      return prisma.$queryRaw<SwarmRunRecord[]>`
        SELECT * FROM "SwarmRun" WHERE status = ${options.status}::"TaskStatus"
        ORDER BY "createdAt" DESC LIMIT ${limit}
      `;
    }
    return prisma.$queryRaw<SwarmRunRecord[]>`
      SELECT * FROM "SwarmRun" ORDER BY "createdAt" DESC LIMIT ${limit}
    `;
  }
}

export const swarmOrchestrator = new SwarmOrchestrator();
