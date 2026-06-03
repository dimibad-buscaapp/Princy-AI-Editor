import { OllamaClient } from "@princy/ai-client";
import type { AgentType } from "@princy/database";

export type AgentContext = {
  objective: string;
  context?: string;
  previousOutput?: string;
};

export type AgentResult = {
  output: string;
  metadata?: Record<string, unknown>;
};

export abstract class BaseAgent {
  abstract readonly type: AgentType;
  protected readonly ollama = new OllamaClient();

  abstract run(ctx: AgentContext): Promise<AgentResult>;

  protected async prompt(system: string, user: string) {
    const response = await this.ollama.chat([
      { role: "system", content: system },
      { role: "user", content: user }
    ]);
    const data = (await response.json()) as { message?: { content?: string } };
    return data.message?.content ?? "";
  }
}
