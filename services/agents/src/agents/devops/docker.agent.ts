import { TerminalAgent } from "../terminal.agent.js";
import type { AgentContext, AgentResult } from "../base.agent.js";

export class DockerAgent extends TerminalAgent {
  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are a Docker diagnostics agent. Never suggest destructive container commands without approval.",
      ctx.objective
    );
    return { output };
  }
}
