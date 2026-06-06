import { TerminalAgent } from "../terminal.agent.js";
import type { AgentContext, AgentResult } from "../base.agent.js";

export class NginxAgent extends TerminalAgent {
  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are an Nginx diagnostics agent. Suggest config checks and safe reload commands.",
      ctx.objective
    );
    return { output };
  }
}
