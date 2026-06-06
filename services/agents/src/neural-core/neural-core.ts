import { eventBus } from "@princy/event-bus";
import type { AgentType } from "@princy/database";
import { getAiRouter, routeModel, type ModelIntent } from "@princy/model-router";
import { prisma } from "@princy/database";
import type { BaseAgent } from "../agents/base.agent.js";
import { AUTONOMOUS_PIPELINE, resolveSwarmChatAgent, SWARM_PIPELINE } from "../agents/swarm-agents.js";
import { AgentCoordinator } from "../orchestrator/agent-coordinator.js";
import { AgentExecutionEngine } from "../orchestrator/agent-execution-engine.js";
import { AgentRouter } from "../orchestrator/agent-router.js";
import { swarmRegistry, type SwarmRole } from "../swarm/swarm-registry.js";

export class NeuralCore {
  private readonly engine = new AgentExecutionEngine();
  private _router: AgentRouter | null = null;
  private _autoCoordinator: AgentCoordinator | null = null;
  private readonly aiRouter = getAiRouter();

  private get router() {
    if (!this._router) this._router = new AgentRouter();
    return this._router;
  }

  private get autoCoordinator() {
    if (!this._autoCoordinator) this._autoCoordinator = new AgentCoordinator();
    return this._autoCoordinator;
  }

  pickModel(intent: ModelIntent) {
    if (intent === "plan" || intent === "review" || intent === "debug") {
      return routeModel("ARCHITECT");
    }
    if (intent === "code") return routeModel("EDITOR_ASSISTANT");
    if (intent === "embed") return routeModel("MEMORY");
    return routeModel("CHAT");
  }

  pickAutonomousModel() {
    return routeModel("AUTONOMOUS");
  }

  private publish(name: string, payload: unknown) {
    eventBus.publish({ type: "agent", name, payload });
  }

  async runPipeline(
    objective: string,
    context?: string,
    steps = SWARM_PIPELINE,
    taskId?: string
  ) {
    this.publish("neural.plan", { objective, steps: steps.length });

    let previous = "";
    const outputs: Record<string, string> = {};

    for (const step of steps) {
      const role = step.role as SwarmRole;
      swarmRegistry.setStatus(role, "busy");
      this.publish("neural.step.started", { role, taskId });

      const started = Date.now();
      try {
        const result = await this.engine.execute(
          step.agent,
          { objective, context, previousOutput: previous },
          taskId
        );
        previous = result.output;
        outputs[role] = result.output;
        swarmRegistry.recordRun(role, `${role} concluiu`, 1200, Date.now() - started, true);
        this.publish("neural.step.completed", { role, taskId, durationMs: Date.now() - started });
      } catch (error) {
        swarmRegistry.recordRun(role, `${role} falhou`, 0, Date.now() - started, false);
        this.publish("neural.step.failed", {
          role,
          error: error instanceof Error ? error.message : "failed"
        });
      }
    }

    this.publish("neural.route", { objective, outputs: Object.keys(outputs) });
    return { outputs, summary: previous };
  }

  async runSwarm(objective: string, context?: string) {
    const task = await prisma.task.create({
      data: { title: objective.slice(0, 120), status: "RUNNING", payload: { swarm: true, context } }
    });

    this.publish("swarm.started", { objective, taskId: task.id });
    const { outputs, summary } = await this.runPipeline(objective, context, SWARM_PIPELINE, task.id);

    const patchProposal = {
      summary: summary.slice(0, 500),
      diff: outputs.DEVELOPER ?? summary,
      plan: outputs.COORDINATOR ?? "",
      review: outputs.REVIEWER ?? ""
    };

    await prisma.task.update({
      where: { id: task.id },
      data: { status: "COMPLETED", result: { outputs, patchProposal } as object }
    });

    this.publish("swarm.completed", { taskId: task.id, patchProposal });
    return { taskId: task.id, outputs, patchProposal, steps: Object.keys(outputs) };
  }

  async runAutonomous(objective: string, context?: string) {
    this.publish("autonomous.planning", { objective });
    const planning = await this.runPipeline(objective, context, [
      AUTONOMOUS_PIPELINE[0]!,
      AUTONOMOUS_PIPELINE[1]!
    ]);

    this.publish("autonomous.executing", { objective });
    const executing = await this.runPipeline(objective, context, AUTONOMOUS_PIPELINE.slice(2));

    return {
      plan: planning.outputs,
      execution: executing.outputs,
      patchProposal: {
        summary: executing.summary.slice(0, 500),
        diff: executing.outputs.DEVELOPER ?? executing.summary,
        review: executing.outputs.REVIEWER ?? ""
      }
    };
  }

  async routeChat(agentType: string | undefined, message: string, context?: string) {
    const type = agentType ?? "AUTO";
    this.publish("neural.route", { agentType: type });

    if (type === "AUTO") {
      const result = await this.autoCoordinator.runPipeline(message, context);
      return (
        result.patchProposal.summary ||
        result.patchProposal.review ||
        result.execution.DEVELOPER ||
        JSON.stringify(result.plan)
      );
    }

    const swarmAgent = resolveSwarmChatAgent(type);
    if (swarmAgent) {
      const result = await this.engine.execute(swarmAgent, { objective: message, context });
      return result.output;
    }

    const agent = this.router.resolve(type as AgentType);
    const result = await this.engine.execute(agent, { objective: message, context });
    return result.output;
  }

  resolveAgent(type: AgentType): BaseAgent {
    return this.router.resolve(type);
  }
}

let core: NeuralCore | null = null;

export function getNeuralCore() {
  if (!core) core = new NeuralCore();
  return core;
}
