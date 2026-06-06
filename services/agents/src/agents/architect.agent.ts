import { BaseAgent, type AgentContext, type AgentResult } from "./base.agent.js";

export class ArchitectAgent extends BaseAgent {
  readonly type = "ARCHITECT" as const;

  protected defaultIntent() {
    return "plan" as const;
  }

  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are a software architect. Describe components, boundaries, and data flow.",
      ctx.objective
    );
    return { output };
  }
}
