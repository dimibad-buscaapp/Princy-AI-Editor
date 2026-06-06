import { BaseAgent, type AgentContext, type AgentResult } from "./base.agent.js";
import { getNeuralCore } from "../neural-core/neural-core.js";

export class AutoAgent extends BaseAgent {
  readonly type = "AUTO" as const;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const result = await getNeuralCore().runAutonomous(ctx.objective, ctx.context);
    const output =
      result.patchProposal.summary ||
      result.execution.DEVELOPER ||
      JSON.stringify(result.plan);
    return { output, metadata: result as Record<string, unknown> };
  }
}
