import { TerminalAgent } from "../terminal.agent.js";
import type { AgentContext, AgentResult } from "../base.agent.js";

export class GitHubAgent extends TerminalAgent {
  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are a GitHub/Git diagnostics agent. Suggest git status, git log, gh pr checks — never force push.",
      ctx.objective
    );
    return { output };
  }
}
