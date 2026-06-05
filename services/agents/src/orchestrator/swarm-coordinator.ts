import { eventBus } from "@princy/event-bus";
import { prisma } from "@princy/database";
import { SWARM_PIPELINE } from "../agents/swarm-agents.js";
import { swarmRegistry, type SwarmRole } from "../swarm/swarm-registry.js";
import { AgentExecutionEngine } from "./agent-execution-engine.js";
import { TaskQueue } from "./task-queue.js";

export class SwarmCoordinator {
  private readonly engine = new AgentExecutionEngine();
  private readonly queue = new TaskQueue();

  async runSwarm(objective: string, context?: string) {
    const task = await prisma.task.create({
      data: { title: objective.slice(0, 120), status: "RUNNING", payload: { swarm: true, context } }
    });

    eventBus.publish({ type: "agent", name: "swarm.started", payload: { objective, taskId: task.id } });

    let previous = "";
    const outputs: Record<string, string> = {};

    for (const step of SWARM_PIPELINE) {
      const role = step.role as SwarmRole;
      swarmRegistry.setStatus(role, "busy");
      eventBus.publish({ type: "agent", name: "agent.run.started", payload: { role, taskId: task.id } });

      const started = Date.now();
      try {
        const result = await this.engine.execute(
          step.agent,
          { objective, context, previousOutput: previous },
          task.id
        );
        previous = result.output;
        outputs[role] = result.output;
        swarmRegistry.recordRun(role, `${role} concluiu etapa`, 1200, Date.now() - started, true);
        eventBus.publish({
          type: "agent",
          name: "agent.run.completed",
          payload: { role, taskId: task.id, durationMs: Date.now() - started }
        });
      } catch (error) {
        swarmRegistry.recordRun(role, `${role} falhou`, 0, Date.now() - started, false);
        eventBus.publish({
          type: "agent",
          name: "agent.run.failed",
          payload: { role, error: error instanceof Error ? error.message : "failed" }
        });
      }
    }

    const patchProposal = { summary: previous.slice(0, 500), diff: outputs.DEVELOPER ?? previous, plan: outputs.COORDINATOR ?? "" };

    await prisma.task.update({
      where: { id: task.id },
      data: { status: "COMPLETED", result: { outputs, patchProposal } as object }
    });

    eventBus.publish({ type: "agent", name: "swarm.completed", payload: { taskId: task.id, patchProposal } });

    return { taskId: task.id, outputs, patchProposal };
  }

  enqueue(objective: string, context?: string) {
    const id = `q-${Date.now()}`;
    this.queue.enqueue({ id, title: objective, payload: { context } });
    return id;
  }

  queueSize() {
    return this.queue.size();
  }
}
