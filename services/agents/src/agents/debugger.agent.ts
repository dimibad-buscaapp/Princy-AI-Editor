import { BaseAgent, type AgentContext, type AgentResult } from "./base.agent.js";

export class DebuggerAgent extends BaseAgent {
  readonly type = "DEBUGGER" as const;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are a debugging agent. Diagnose errors and propose fixes.",
      ctx.objective
    );
    return { output };
  }
}
