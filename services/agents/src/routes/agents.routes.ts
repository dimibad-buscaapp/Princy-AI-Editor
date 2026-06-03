import { authenticate, asyncHandler, validateBody, type AuthenticatedRequest } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import type { AgentType } from "@princy/database";
import { prisma } from "@princy/database";
import { AgentRouter } from "../orchestrator/agent-router.js";
import { AgentExecutionEngine } from "../orchestrator/agent-execution-engine.js";
import { AgentCoordinator } from "../orchestrator/agent-coordinator.js";

const runSchema = z.object({
  type: z.enum(["AUTO", "PLANNER", "CODER", "REVIEWER", "DEBUGGER", "ARCHITECT", "TERMINAL"]),
  objective: z.string().min(1),
  context: z.string().optional()
});

export function registerAgentsRoutes(app: Express) {
  const router = new AgentRouter();
  const engine = new AgentExecutionEngine();
  const coordinator = new AgentCoordinator();
  const auth = authenticate();

  app.post("/agents/run", auth, validateBody(runSchema), asyncHandler(async (request, response) => {
    const { type, objective, context } = request.body;
    const task = await prisma.task.create({
      data: { title: objective.slice(0, 120), status: "RUNNING", payload: { type, context } }
    });
    const agent = router.resolve(type as AgentType);
    const result = type === "AUTO"
      ? await coordinator.runPipeline(objective, context)
      : await engine.execute(agent, { objective, context }, task.id);
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "COMPLETED", result: result as object }
    });
    response.json({ taskId: task.id, result });
  }));

  app.get("/agents/tasks/:id", auth, asyncHandler(async (request, response) => {
    const task = await prisma.task.findUnique({
      where: { id: String(request.params.id) },
      include: { executions: true, agent: true }
    });
    if (!task) {
      response.status(404).json({ error: "not_found" });
      return;
    }
    response.json({ task });
  }));

  app.get("/agents/history", auth, asyncHandler(async (request, response) => {
    const limit = Number(request.query.limit ?? 50);
    const history = await prisma.agentExecution.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { agent: true, task: true }
    });
    response.json({ history });
  }));
}
