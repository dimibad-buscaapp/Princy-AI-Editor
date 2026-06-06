import { BaseAgent, type AgentContext, type AgentResult } from "./base.agent.js";

export class PlannerAgent extends BaseAgent {
  readonly type = "PLANNER" as const;

  protected defaultIntent() {
    return "plan" as const;
  }

  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are a software planning agent. Produce a concise step-by-step plan.",
      `Objective: ${ctx.objective}\nContext: ${ctx.context ?? ""}`
    );
    return { output, metadata: { steps: output.split("\n").filter(Boolean) } };
  }
}
