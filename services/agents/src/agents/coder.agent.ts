import { BaseAgent, type AgentContext, type AgentResult } from "./base.agent.js";

export class CoderAgent extends BaseAgent {
  readonly type = "CODER" as const;

  protected defaultIntent() {
    return "code" as const;
  }

  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are a coding agent. Produce implementation code or patches.",
      `Plan/Objective: ${ctx.objective}\nPrevious: ${ctx.previousOutput ?? ""}\nContext: ${ctx.context ?? ""}`
    );
    return { output, metadata: { kind: "code" } };
  }
}
