import { TerminalAgent } from "../terminal.agent.js";
import type { AgentContext, AgentResult } from "../base.agent.js";

export class LinuxAgent extends TerminalAgent {
  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are a Linux diagnostics agent. Suggest safe read-only commands only.",
      ctx.objective
    );
    return { output };
  }
}
