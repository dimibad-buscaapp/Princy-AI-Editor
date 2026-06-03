import { OllamaClient } from "@princy/ai-client";

export type ModelIntent = "plan" | "code" | "review" | "debug" | "chat" | "embed";

export type ModelDefinition = {
  id: string;
  name: string;
  intents: ModelIntent[];
  priority: number;
};

export class ModelRegistry {
  private readonly models: ModelDefinition[] = [
    { id: "deepseek-coder", name: "DeepSeek Coder", intents: ["code", "debug"], priority: 1 },
    { id: "qwen-coder", name: "Qwen Coder", intents: ["code", "plan"], priority: 2 },
    { id: "codestral", name: "Codestral", intents: ["code", "review"], priority: 3 },
    { id: "llama", name: "Llama", intents: ["chat", "plan"], priority: 4 }
  ];

  list() {
    return this.models;
  }

  forIntent(intent: ModelIntent) {
    return this.models.filter((m) => m.intents.includes(intent)).sort((a, b) => a.priority - b.priority);
  }
}

export class AiRouter {
  constructor(
    private readonly registry = new ModelRegistry(),
    private readonly ollama = new OllamaClient()
  ) {}

  private metrics = new Map<string, { latencyMs: number; failures: number }>();

  route(intent: ModelIntent) {
    const candidates = this.registry.forIntent(intent);
    for (const model of candidates) {
      const health = this.metrics.get(model.id);
      if (!health || health.failures < 3) {
        return model;
      }
    }
    return candidates[0] ?? { id: process.env.OLLAMA_CHAT_MODEL ?? "qwen3-coder", name: "default", intents: [intent], priority: 99 };
  }

  async healthCheck() {
    return this.ollama.health();
  }

  recordLatency(modelId: string, latencyMs: number) {
    const current = this.metrics.get(modelId) ?? { latencyMs: 0, failures: 0 };
    this.metrics.set(modelId, { latencyMs: (current.latencyMs + latencyMs) / 2, failures: current.failures });
  }

  recordFailure(modelId: string) {
    const current = this.metrics.get(modelId) ?? { latencyMs: 0, failures: 0 };
    this.metrics.set(modelId, { ...current, failures: current.failures + 1 });
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}
