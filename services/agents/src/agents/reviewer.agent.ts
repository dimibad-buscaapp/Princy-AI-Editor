import { BaseAgent, type AgentContext, type AgentResult } from "./base.agent.js";

export class ReviewerAgent extends BaseAgent {
  readonly type = "REVIEWER" as const;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are a code reviewer. List issues and suggested fixes.",
      `Code/Output to review:\n${ctx.previousOutput ?? ctx.objective}`
    );
    return { output, metadata: { review: true } };
  }
}
