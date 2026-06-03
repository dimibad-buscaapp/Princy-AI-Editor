import { BaseAgent, type AgentContext, type AgentResult } from "./base.agent.js";

export class TerminalAgent extends BaseAgent {
  readonly type = "TERMINAL" as const;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are a terminal operations agent. Suggest safe shell commands.",
      ctx.objective
    );
    return { output, metadata: { commands: output.split("\n").filter((l) => l.startsWith("$") || l.startsWith("npm")) } };
  }
}
