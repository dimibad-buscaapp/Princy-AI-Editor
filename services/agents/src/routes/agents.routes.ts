import { authenticate, asyncHandler, validateBody, type AuthenticatedRequest } from "@princy/core";
import type { Express, Response } from "express";
import { z } from "zod";
import type { AgentType } from "@princy/database";
import { prisma } from "@princy/database";
import { eventBus } from "@princy/event-bus";
import { AgentRouter } from "../orchestrator/agent-router.js";
import { AgentExecutionEngine } from "../orchestrator/agent-execution-engine.js";
import { AgentCoordinator } from "../orchestrator/agent-coordinator.js";
import { SwarmCoordinator } from "../orchestrator/swarm-coordinator.js";
import { resolveSwarmChatAgent } from "../agents/swarm-agents.js";
import { getNeuralCore } from "../neural-core/neural-core.js";
import { swarmRegistry } from "../swarm/swarm-registry.js";
import { routeModel } from "@princy/model-router";

const runSchema = z.object({
  type: z.enum([
    "AUTO",
    "PLANNER",
    "CODER",
    "REVIEWER",
    "DEBUGGER",
    "ARCHITECT",
    "TERMINAL",
    "RESEARCHER",
    "WRITER",
    "MEMORY",
    "CONTEXT_GRAPH"
  ]),
  objective: z.string().min(1),
  context: z.string().optional()
});

const swarmSchema = z.object({
  objective: z.string().min(1),
  context: z.string().optional()
});

function writeSse(response: Response, event: string, data: unknown) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function registerAgentsRoutes(app: Express) {
  const router = new AgentRouter();
  const engine = new AgentExecutionEngine();
  const coordinator = new AgentCoordinator();
  const swarmCoordinator = new SwarmCoordinator();
  const auth = authenticate();

  app.get("/health/neural", asyncHandler(async (_request, response) => {
    response.json({
      status: "online",
      agents: swarmRegistry.getMetrics().activeAgents,
      roles: swarmRegistry.getAgents().length,
      models: {
        chat: routeModel("CHAT"),
        editor: routeModel("EDITOR_ASSISTANT"),
        swarm: routeModel("ARCHITECT"),
        autonomous: routeModel("AUTONOMOUS"),
        embed: routeModel("MEMORY")
      }
    });
  }));

  app.get("/agents/status", auth, asyncHandler(async (_request, response) => {
    response.json({ agents: swarmRegistry.getAgents() });
  }));

  app.get("/agents/metrics", auth, asyncHandler(async (_request, response) => {
    response.json(swarmRegistry.getMetrics());
  }));

  app.post("/agents/autonomous/run", auth, validateBody(swarmSchema), asyncHandler(async (request, response) => {
    const { objective, context } = request.body;
    const neural = getNeuralCore();
    const result = await neural.runAutonomous(objective, context);
    response.json(result);
  }));

  app.post("/agents/run", auth, validateBody(runSchema), asyncHandler(async (request, response) => {
    const { type, objective, context } = request.body;
    const task = await prisma.task.create({
      data: { title: objective.slice(0, 120), status: "RUNNING", payload: { type, context } }
    });
    let result: unknown;
    if (type === "AUTO") {
      result = await coordinator.runPipeline(objective, context);
    } else {
      const swarmAgent = resolveSwarmChatAgent(type);
      const agent = swarmAgent ?? router.resolve(type as AgentType);
      result = await engine.execute(agent, { objective, context }, task.id);
    }
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "COMPLETED", result: result as object }
    });
    response.json({ taskId: task.id, result });
  }));

  app.post("/agents/swarm/run", auth, validateBody(swarmSchema), asyncHandler(async (request, response) => {
    const { objective, context } = request.body;
    const result = await swarmCoordinator.runSwarm(objective, context);
    response.json(result);
  }));

  app.post("/agents/swarm/stream", auth, validateBody(swarmSchema), asyncHandler(async (request, response) => {
    const { objective, context } = request.body;
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Accel-Buffering", "no");
    if (typeof response.flushHeaders === "function") response.flushHeaders();

    writeSse(response, "status", { message: "connected" });

    const listener = (event: { type: string; name: string; payload: unknown }) => {
      if (
        event.type === "agent" &&
        (event.name.startsWith("swarm.") ||
          event.name.startsWith("neural.") ||
          event.name.startsWith("autonomous.") ||
          event.name.startsWith("agent.run"))
      ) {
        writeSse(response, "agent", event);
      }
    };
    eventBus.on("event", listener);

    try {
      const result = await swarmCoordinator.runSwarm(objective, context);
      writeSse(response, "done", { ok: true, result });
    } catch (error) {
      writeSse(response, "error", { message: error instanceof Error ? error.message : "swarm failed" });
      writeSse(response, "done", { ok: false });
    } finally {
      eventBus.off("event", listener);
      response.end();
    }
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
