import { OllamaClient } from "@princy/ai-client";
import {
  DEFAULT_CODE_MODEL,
  DEFAULT_FAST_MODEL,
  DEFAULT_REASONING_MODEL,
  getModelRouter,
  modelForRequestType,
  routeAgent as neuralRouteAgent,
  routeAutocomplete as neuralRouteAutocomplete,
  routeChat as neuralRouteChat,
  routeTask as neuralRouteTask
} from "@princy/shared";

export type ModelIntent = "plan" | "code" | "review" | "debug" | "chat" | "embed";

export type ModelTask =
  | "CHAT"
  | "INLINE_CHAT"
  | "GHOST_TEXT"
  | "EDITOR_ASSISTANT"
  | "ARCHITECT"
  | "AUTONOMOUS"
  | "MEMORY";

export type ModelSlot = "CHAT" | "EDITOR" | "SWARM" | "AUTONOMOUS" | "EMBED";

export type ModelDefinition = {
  id: string;
  name: string;
  intents: ModelIntent[];
  priority: number;
};

export type ModelRunMetric = {
  modelId: string;
  task: ModelTask;
  ttftMs: number;
  totalMs: number;
  tokenCount: number;
  tokensPerSec: number;
  at: string;
};

export const TASK_DEFAULTS: Record<ModelTask, string> = {
  CHAT: DEFAULT_FAST_MODEL,
  INLINE_CHAT: DEFAULT_FAST_MODEL,
  GHOST_TEXT: DEFAULT_FAST_MODEL,
  EDITOR_ASSISTANT: DEFAULT_CODE_MODEL,
  ARCHITECT: DEFAULT_REASONING_MODEL,
  AUTONOMOUS: DEFAULT_REASONING_MODEL,
  MEMORY: "nomic-embed-text"
};

const TASK_TO_SLOT: Record<ModelTask, ModelSlot> = {
  CHAT: "CHAT",
  INLINE_CHAT: "CHAT",
  GHOST_TEXT: "EDITOR",
  EDITOR_ASSISTANT: "EDITOR",
  ARCHITECT: "SWARM",
  AUTONOMOUS: "AUTONOMOUS",
  MEMORY: "EMBED"
};

const INTENT_TO_TASK: Record<ModelIntent, ModelTask> = {
  chat: "CHAT",
  code: "EDITOR_ASSISTANT",
  plan: "ARCHITECT",
  review: "ARCHITECT",
  debug: "ARCHITECT",
  embed: "MEMORY"
};

function envModel(key: string, fallback: string) {
  return process.env[key] ?? fallback;
}

function envFallbackForTask(task: ModelTask): string {
  if (task === "MEMORY") {
    return envModel("OLLAMA_EMBED_MODEL", envModel("DEFAULT_EMBEDDING_MODEL", TASK_DEFAULTS.MEMORY));
  }
  if (task === "ARCHITECT" || task === "AUTONOMOUS") {
    return envModel("DEFAULT_REASONING_MODEL", TASK_DEFAULTS[task]);
  }
  return envModel("OLLAMA_CHAT_MODEL", envModel("DEFAULT_CHAT_MODEL", TASK_DEFAULTS.CHAT));
}

let slotOverrides: Partial<Record<ModelSlot, string>> = {};

export function reloadOverrides(overrides: Partial<Record<ModelSlot, string>>) {
  slotOverrides = { ...overrides };
}

export function getSlotOverrides() {
  return { ...slotOverrides };
}

const COMPLEX_KEYWORDS = [
  "architect", "design", "refactor", "analyze", "debug", "autonomous",
  "arquitetura", "analisar", "refatorar", "complexo", "planejar"
];

export function isComplexChatMessage(message: string): boolean {
  if (message.length > 400) return true;
  const lower = message.toLowerCase();
  return COMPLEX_KEYWORDS.some((k) => lower.includes(k));
}

export function routeChatModel(message: string, mode: "fast" | "deep" = "fast"): string {
  if (mode === "deep") {
    return getModelRouter().routeChatDecision(message, "deep").model;
  }
  if (isComplexChatMessage(message)) {
    return neuralRouteTask(message);
  }
  return neuralRouteChat(message);
}

export function routeModel(task: ModelTask, overrides?: Partial<Record<ModelSlot, string>>) {
  const slot = TASK_TO_SLOT[task];
  const merged = { ...slotOverrides, ...overrides };
  const override = merged[slot];
  if (override) return override;

  switch (task) {
    case "CHAT":
    case "INLINE_CHAT":
      return neuralRouteChat("");
    case "GHOST_TEXT":
      return neuralRouteAutocomplete();
    case "EDITOR_ASSISTANT":
      return modelForRequestType("refactor");
    case "ARCHITECT":
      return modelForRequestType("architect");
    case "AUTONOMOUS":
      return modelForRequestType("autonomous");
    case "MEMORY":
      return TASK_DEFAULTS.MEMORY;
    default:
      return TASK_DEFAULTS[task] ?? envFallbackForTask(task);
  }
}

export {
  getModelRouter,
  routeAgent,
  routeAutocomplete,
  routeChat,
  routeTask
} from "@princy/shared";

export function mapAgentTypeToTask(agentType: string): ModelTask {
  switch (agentType) {
    case "CODER":
      return "EDITOR_ASSISTANT";
    case "ARCHITECT":
    case "PLANNER":
    case "RESEARCHER":
    case "CONTEXT_GRAPH":
    case "REVIEWER":
    case "DEBUGGER":
      return "ARCHITECT";
    case "AUTO":
    case "TERMINAL":
    case "WRITER":
    case "MEMORY":
    default:
      return "CHAT";
  }
}

function parseExtraModels(): ModelDefinition[] {
  const raw = process.env.OLLAMA_EXTRA_MODELS ?? "";
  if (!raw.trim()) return [];
  return raw.split(",").map((id, i) => ({
    id: id.trim(),
    name: id.trim(),
    intents: ["chat", "code"] as ModelIntent[],
    priority: 10 + i
  }));
}

export class ModelRegistry {
  private readonly models: ModelDefinition[];

  constructor() {
    this.models = [
      {
        id: envModel("OLLAMA_CHAT_MODEL", envModel("DEFAULT_CHAT_MODEL", TASK_DEFAULTS.CHAT)),
        name: "Qwen Chat",
        intents: ["chat", "code"],
        priority: 1
      },
      {
        id: envModel("DEFAULT_REASONING_MODEL", TASK_DEFAULTS.ARCHITECT),
        name: "DeepSeek Reasoning",
        intents: ["plan", "review", "debug"],
        priority: 1
      },
      {
        id: envModel("OLLAMA_EMBED_MODEL", envModel("DEFAULT_EMBEDDING_MODEL", TASK_DEFAULTS.MEMORY)),
        name: "Nomic Embed",
        intents: ["embed"],
        priority: 1
      },
      ...parseExtraModels()
    ];
  }

  list() {
    return this.models;
  }

  forIntent(intent: ModelIntent) {
    return this.models.filter((m) => m.intents.includes(intent)).sort((a, b) => a.priority - b.priority);
  }

  resolveModelId(intent: ModelIntent): string {
    return routeModel(INTENT_TO_TASK[intent]);
  }
}

export class AiRouter {
  constructor(
    private readonly registry = new ModelRegistry(),
    private readonly ollama = new OllamaClient()
  ) {}

  private metrics = new Map<string, { latencyMs: number; failures: number }>();
  private streamMetrics: ModelRunMetric[] = [];

  route(intent: ModelIntent): ModelDefinition {
    const modelId = routeModel(INTENT_TO_TASK[intent]);
    const candidates = this.registry.forIntent(intent);
    for (const model of candidates) {
      if (model.id !== modelId) continue;
      const health = this.metrics.get(model.id);
      if (!health || health.failures < 3) return model;
    }
    const fallback = candidates.find((m) => m.id === modelId);
    return fallback ?? { id: modelId, name: modelId, intents: [intent], priority: 99 };
  }

  resolveModelId(intent: ModelIntent) {
    return routeModel(INTENT_TO_TASK[intent]);
  }

  routeTask(task: ModelTask) {
    return routeModel(task);
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

  recordStreamRun(metric: Omit<ModelRunMetric, "at"> & { at?: string }) {
    const entry: ModelRunMetric = {
      ...metric,
      at: metric.at ?? new Date().toISOString()
    };
    this.streamMetrics = [entry, ...this.streamMetrics].slice(0, 200);
    this.recordLatency(metric.modelId, metric.totalMs);
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  getStreamMetrics(limit = 50) {
    return this.streamMetrics.slice(0, limit);
  }

  getStreamAggregates() {
    const recent = this.streamMetrics.slice(0, 100);
    if (!recent.length) {
      return { ttftMs: 0, totalMs: 0, tokensPerSec: 0, runs: 0 };
    }
    const sum = recent.reduce(
      (acc, m) => ({
        ttftMs: acc.ttftMs + m.ttftMs,
        totalMs: acc.totalMs + m.totalMs,
        tokensPerSec: acc.tokensPerSec + m.tokensPerSec,
        runs: acc.runs + 1
      }),
      { ttftMs: 0, totalMs: 0, tokensPerSec: 0, runs: 0 }
    );
    return {
      ttftMs: Math.round(sum.ttftMs / sum.runs),
      totalMs: Math.round(sum.totalMs / sum.runs),
      tokensPerSec: Math.round((sum.tokensPerSec / sum.runs) * 10) / 10,
      runs: sum.runs
    };
  }
}

let sharedRouter: AiRouter | null = null;

export function getAiRouter() {
  if (!sharedRouter) sharedRouter = new AiRouter();
  return sharedRouter;
}
