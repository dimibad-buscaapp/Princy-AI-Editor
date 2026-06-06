import { authenticate, asyncHandler, HttpError, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { prisma } from "@princy/database";
import { recordAgentMemory } from "@princy/memory";
import { AgentExecutionEngine } from "../orchestrator/agent-execution-engine.js";
import { swarmOrchestrator } from "../orchestrator/swarm-orchestrator.js";
import { buildTaskOutput } from "../swarm/swarm-artifacts.js";
import { DeveloperAgent, resolveSwarmChatAgent, SWARM_PIPELINE } from "../agents/swarm-agents.js";
import type { SwarmRole } from "../swarm/swarm-registry.js";
import { swarmRegistry } from "../swarm/swarm-registry.js";

const PIPELINE_ROLES = ["COORDINATOR", "ARCHITECT", "DEVELOPER", "TESTER", "REVIEWER", "DEVOPS"] as const;

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  objective: z.string().min(1),
  context: z.string().optional()
});

const runSchema = z.object({
  objective: z.string().min(1),
  context: z.string().optional(),
  title: z.string().optional(),
  projectId: z.string().optional()
});

const cancelFlags = new Map<string, boolean>();

function cuid() {
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function registerSwarmRoutes(app: Express) {
  const auth = authenticate();
  const engine = new AgentExecutionEngine();

  app.post("/swarm/run", auth, validateBody(runSchema), asyncHandler(async (request, response) => {
    const { objective, context, title, projectId } = request.body;
    const run = await swarmOrchestrator.startRun({ objective, context, title, projectId });
    setImmediate(() => {
      void swarmOrchestrator.executeRun(run.id).catch((err) => {
        console.error("[swarm] executeRun failed", err);
      });
    });
    response.status(201).json({ run });
  }));

  app.get("/swarm/runs", auth, asyncHandler(async (request, response) => {
    const status = request.query.status ? String(request.query.status) : undefined;
    const limit = request.query.limit ? Number(request.query.limit) : 50;
    const runs = await swarmOrchestrator.listRuns({ status, limit });
    response.json({ runs });
  }));

  app.get("/swarm/runs/:id", auth, asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    const detail = await swarmOrchestrator.getRunDetail(id);
    if (!detail) throw new HttpError(404, "not_found", "Run not found");
    response.json(detail);
  }));

  app.post("/swarm/runs/:id/cancel", auth, asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT * FROM "SwarmRun" WHERE id = ${id} LIMIT 1`;
    if (!rows[0]) throw new HttpError(404, "not_found", "Run not found");
    swarmOrchestrator.cancelRun(id);
    await prisma.$executeRaw`
      UPDATE "SwarmRun" SET status = 'CANCELLED'::"TaskStatus", "completedAt" = NOW(), "updatedAt" = NOW() WHERE id = ${id}
    `;
    const updated = await prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT * FROM "SwarmRun" WHERE id = ${id} LIMIT 1`;
    response.json({ run: updated[0] });
  }));

  app.post("/swarm/task", auth, validateBody(createSchema), asyncHandler(async (request, response) => {
    const { title, description, objective, context } = request.body;
    const pipelineId = `pipe_${Date.now()}`;
    const parentId = cuid();
    await prisma.$executeRaw`
      INSERT INTO "SwarmTask" (id, "pipelineId", title, description, "agentRole", status, "order", input, "createdAt", "updatedAt")
      VALUES (${parentId}, ${pipelineId}, ${title}, ${description ?? objective}, 'COORDINATOR'::"SwarmAgentRole", 'PENDING', 0, ${JSON.stringify({ objective, context })}::jsonb, NOW(), NOW())
    `;

    for (let i = 0; i < PIPELINE_ROLES.length - 1; i++) {
      const role = PIPELINE_ROLES[i + 1];
      const id = cuid();
      await prisma.$executeRaw`
        INSERT INTO "SwarmTask" (id, "pipelineId", "parentTaskId", title, description, "agentRole", status, "order", input, "createdAt", "updatedAt")
        VALUES (${id}, ${pipelineId}, ${parentId}, ${`${role}: ${title}`}, ${description ?? null}, ${role}::"SwarmAgentRole", 'PENDING', ${i + 1}, ${JSON.stringify({ objective, context })}::jsonb, NOW(), NOW())
      `;
    }

    const tasks = await prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT * FROM "SwarmTask" WHERE "pipelineId" = ${pipelineId} ORDER BY "order" ASC`;
    response.status(201).json({ pipelineId, tasks });
  }));

  app.get("/swarm/tasks", auth, asyncHandler(async (request, response) => {
    const status = request.query.status ? String(request.query.status) : null;
    const tasks = status
      ? await prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT * FROM "SwarmTask" WHERE status = ${status}::"TaskStatus" ORDER BY "updatedAt" DESC LIMIT 100`
      : await prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT * FROM "SwarmTask" ORDER BY "updatedAt" DESC LIMIT 100`;
    response.json({ tasks });
  }));

  app.get("/swarm/tasks/:id", auth, asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    const tasks = (await prisma.$queryRaw`
      SELECT * FROM "SwarmTask" WHERE id = ${id} OR "parentTaskId" = ${id} ORDER BY "order" ASC
    `) as Array<Record<string, unknown>>;
    if (!tasks.length) throw new HttpError(404, "not_found", "Task not found");
    response.json({ task: tasks[0], children: tasks.slice(1) });
  }));

  app.post("/swarm/tasks/:id/run", auth, asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT * FROM "SwarmTask" WHERE id = ${id} LIMIT 1`;
    const task = rows[0];
    if (!task) throw new HttpError(404, "not_found", "Task not found");
    if (cancelFlags.get(id)) throw new HttpError(400, "cancelled", "Task was cancelled");

    const input = (task.input ?? {}) as { objective?: string; context?: string };
    const objective = input.objective ?? String(task.title);
    const context = input.context;
    const role = String(task.agentRole) as SwarmRole;

    await prisma.$executeRaw`UPDATE "SwarmTask" SET status = 'RUNNING'::"TaskStatus", "updatedAt" = NOW() WHERE id = ${id}`;
    swarmRegistry.setStatus(role, "busy");
    const started = Date.now();

    try {
      const step = SWARM_PIPELINE.find((s) => s.role === role);
      const agent = step?.agent ?? resolveSwarmChatAgent(role) ?? new DeveloperAgent();
      const result = await engine.execute(agent, { objective, context }, { taskId: id });
      const durationMs = Date.now() - started;
      const output = buildTaskOutput(role as "COORDINATOR" | "ARCHITECT" | "DEVELOPER" | "TESTER" | "REVIEWER" | "DEVOPS", result.output);
      await prisma.$executeRaw`
        UPDATE "SwarmTask" SET status = 'COMPLETED'::"TaskStatus", output = ${JSON.stringify(output)}::jsonb, logs = ${JSON.stringify([{ at: new Date().toISOString(), message: "completed" }])}::jsonb, "updatedAt" = NOW()
        WHERE id = ${id}
      `;
      swarmRegistry.recordRun(role, `${role} concluiu`, 1, durationMs, true);
      void recordAgentMemory({ agentRole: role, taskId: id, success: true, durationMs, decision: result.output.slice(0, 500) });
      const updated = await prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT * FROM "SwarmTask" WHERE id = ${id} LIMIT 1`;
      response.json({ task: updated[0] });
    } catch (error) {
      const durationMs = Date.now() - started;
      const message = error instanceof Error ? error.message : "failed";
      await prisma.$executeRaw`
        UPDATE "SwarmTask" SET status = 'FAILED'::"TaskStatus", output = ${JSON.stringify({ text: message, artifacts: [] })}::jsonb, logs = ${JSON.stringify([{ at: new Date().toISOString(), message }])}::jsonb, "updatedAt" = NOW()
        WHERE id = ${id}
      `;
      swarmRegistry.recordRun(role, `${role} falhou`, 0, durationMs, false);
      void recordAgentMemory({ agentRole: role, taskId: id, success: false, durationMs, decision: message });
      const updated = await prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT * FROM "SwarmTask" WHERE id = ${id} LIMIT 1`;
      response.json({ task: updated[0], error: message });
    }
  }));

  app.post("/swarm/tasks/:id/cancel", auth, asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    cancelFlags.set(id, true);
    await prisma.$executeRaw`UPDATE "SwarmTask" SET status = 'CANCELLED'::"TaskStatus", "updatedAt" = NOW() WHERE id = ${id}`;
    const updated = await prisma.$queryRaw<Array<Record<string, unknown>>>`SELECT * FROM "SwarmTask" WHERE id = ${id} LIMIT 1`;
    response.json({ task: updated[0] });
  }));
}
