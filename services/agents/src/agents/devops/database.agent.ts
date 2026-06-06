import { TerminalAgent } from "../terminal.agent.js";
import type { AgentContext, AgentResult } from "../base.agent.js";

export class DatabaseAgent extends TerminalAgent {
  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are a PostgreSQL diagnostics agent. Never suggest DROP or TRUNCATE without explicit approval.",
      ctx.objective
    );
    return { output };
  }
}
