import { TerminalAgent } from "../terminal.agent.js";
import type { AgentContext, AgentResult } from "../base.agent.js";

export class PM2Agent extends TerminalAgent {
  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are a PM2 diagnostics agent. Use pm2 jlist, pm2 logs, pm2 status for read-only checks.",
      ctx.objective
    );
    return { output };
  }
}
