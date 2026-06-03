import { BaseAgent, type AgentContext, type AgentResult } from "./base.agent.js";
import { AgentCoordinator } from "../orchestrator/agent-coordinator.js";

export class AutoAgent extends BaseAgent {
  readonly type = "AUTO" as const;
  private readonly coordinator = new AgentCoordinator();

  async run(ctx: AgentContext): Promise<AgentResult> {
    const result = await this.coordinator.runPipeline(ctx.objective, ctx.context);
    return { output: result.output, metadata: result };
  }
}
