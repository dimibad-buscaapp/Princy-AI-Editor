import { eventBus } from "@princy/event-bus";
import { prisma } from "@princy/database";
import type { BaseAgent, AgentContext } from "../agents/base.agent.js";

export class AgentExecutionEngine {
  async execute(agent: BaseAgent, ctx: AgentContext, taskId?: string) {
    const started = Date.now();
    const dbAgent = await prisma.agent.findFirst({ where: { type: agent.type } });
    const agentId = dbAgent?.id;

    eventBus.publish({ type: "agent", name: "run.started", payload: { type: agent.type } });

    const result = await agent.run(ctx);
    const durationMs = Date.now() - started;

    if (agentId) {
      await prisma.agentExecution.create({
        data: {
          agentId,
          taskId,
          input: ctx as object,
          output: result as object,
          status: "COMPLETED",
          durationMs
        }
      });
      await prisma.agent.update({ where: { id: agentId }, data: { status: "COMPLETED" } });
    }

    eventBus.publish({ type: "agent", name: "run.completed", payload: { type: agent.type, durationMs } });
    return result;
  }
}
