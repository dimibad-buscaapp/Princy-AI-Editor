import { OllamaClient } from "@princy/ai-client";
import type { ModelIntent, ModelTask } from "@princy/model-router";
import { getAiRouter, routeModel } from "@princy/model-router";
import { getModelConfigService } from "../model-config/model-config.service.js";
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
  protected readonly router = getAiRouter();

  abstract run(ctx: AgentContext): Promise<AgentResult>;

  protected defaultIntent(): ModelIntent {
    return "chat";
  }

  protected taskForIntent(intent: ModelIntent): ModelTask {
    switch (intent) {
      case "plan":
      case "review":
      case "debug":
        return "ARCHITECT";
      case "code":
        return "EDITOR_ASSISTANT";
      case "embed":
        return "MEMORY";
      default:
        return "CHAT";
    }
  }

  protected async prompt(system: string, user: string, intent?: ModelIntent) {
    const modelIntent = intent ?? this.defaultIntent();
    const task = this.taskForIntent(modelIntent);
    const model = routeModel(task);
    const started = Date.now();
    try {
      const response = await this.ollama.chat(
        [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        { model }
      );
      const data = (await response.json()) as { message?: { content?: string } };
      const content = data.message?.content ?? "";
      const totalMs = Date.now() - started;
      this.router.recordLatency(model, totalMs);
      void getModelConfigService().recordMetric({
        modelId: model,
        task,
        ttftMs: totalMs,
        totalMs,
        tokenCount: content.length,
        tokensPerSec: totalMs > 0 ? Math.round((content.length / (totalMs / 1000)) * 10) / 10 : 0
      });
      return content;
    } catch (error) {
      this.router.recordFailure(model);
      throw error;
    }
  }
}
