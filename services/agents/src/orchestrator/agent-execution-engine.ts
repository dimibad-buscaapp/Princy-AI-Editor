import { eventBus } from "@princy/event-bus";
import { prisma } from "@princy/database";
import { recordAgentMemory } from "@princy/memory";
import type { BaseAgent, AgentContext } from "../agents/base.agent.js";

export type ExecuteOptions = {
  taskId?: string;
  agentRole?: string;
  projectId?: string;
};

function resolveAgentRole(agent: BaseAgent, override?: string) {
  if (override) return override;
  const withRole = agent as BaseAgent & { swarmRole?: string };
  return withRole.swarmRole ?? agent.type;
}

export class AgentExecutionEngine {
  async execute(agent: BaseAgent, ctx: AgentContext, options?: ExecuteOptions) {
    const started = Date.now();
    const dbAgent = await prisma.agent.findFirst({ where: { type: agent.type } });
    const agentId = dbAgent?.id;
    const agentRole = resolveAgentRole(agent, options?.agentRole);

    eventBus.publish({ type: "agent", name: "run.started", payload: { type: agent.type } });

    try {
      const result = await agent.run(ctx);
      const durationMs = Date.now() - started;

      if (agentId) {
        await prisma.agentExecution.create({
          data: {
            agentId,
            taskId: options?.taskId,
            input: ctx as object,
            output: result as object,
            status: "COMPLETED",
            durationMs
          }
        });
        await prisma.agent.update({ where: { id: agentId }, data: { status: "COMPLETED" } });
      }

      void recordAgentMemory({
        agentRole,
        taskId: options?.taskId,
        success: true,
        durationMs,
        kind: "decision",
        content: result.output.slice(0, 500),
        decision: result.output.slice(0, 500),
        projectId: options?.projectId
      });

      eventBus.publish({ type: "agent", name: "run.completed", payload: { type: agent.type, durationMs } });
      return result;
    } catch (error) {
      const durationMs = Date.now() - started;
      const message = error instanceof Error ? error.message : "Agent execution failed";

      void recordAgentMemory({
        agentRole,
        taskId: options?.taskId,
        success: false,
        durationMs,
        kind: "error",
        errorMessage: message,
        content: message,
        decision: message,
        projectId: options?.projectId
      });

      eventBus.publish({ type: "agent", name: "run.failed", payload: { type: agent.type, error: message } });
      throw error;
    }
  }
}
