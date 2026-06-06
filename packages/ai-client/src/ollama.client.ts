import { validateVector } from "./vector.js";

export type OllamaClientOptions = {
  baseUrl?: string;
  embedModel?: string;
  chatModel?: string;
  timeoutMs?: number;
};

function resolveTimeoutMs(options?: OllamaClientOptions) {
  if (options?.timeoutMs !== undefined) {
    return options.timeoutMs;
  }
  return Number(process.env.AI_CLIENT_TIMEOUT_MS ?? process.env.OLLAMA_TIMEOUT_MS ?? 300_000);
}

export class OllamaClient {
  private readonly baseUrl: string;
  private readonly embedModel: string;
  private readonly chatModel: string;
  private readonly timeoutMs: number;

  constructor(options: OllamaClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? process.env.OLLAMA_BASE_URL ?? process.env.OLLAMA_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
    this.embedModel = options.embedModel ?? process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";
    this.chatModel =
      options.chatModel ??
      process.env.OLLAMA_CHAT_MODEL ??
      process.env.DEFAULT_CHAT_MODEL ??
      "qwen2.5:3b";
    this.timeoutMs = resolveTimeoutMs(options);
  }

  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      return response.ok;
    } catch {
      return false;
    }
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.embedModel, prompt: text }),
      signal: AbortSignal.timeout(this.timeoutMs)
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Ollama embed failed: ${response.status} (model=${this.embedModel})${detail ? ` — ${detail.slice(0, 200)}` : ""}`
      );
    }
    const data = (await response.json()) as { embedding?: number[] };
    if (!data.embedding?.length) {
      throw new Error("Ollama returned empty embedding.");
    }
    return validateVector(data.embedding);
  }

  async chat(
    messages: { role: string; content: string }[],
    options?: {
      stream?: boolean;
      model?: string;
      think?: boolean;
      keepAlive?: string;
      ollamaOptions?: Record<string, unknown>;
    }
  ) {
    const stream = options?.stream ?? false;
    const model = options?.model ?? this.chatModel;
    const body: Record<string, unknown> = {
      model,
      messages,
      stream,
      keep_alive: options?.keepAlive ?? process.env.OLLAMA_KEEP_ALIVE ?? "30m"
    };
    if (options?.ollamaOptions && Object.keys(options.ollamaOptions).length > 0) {
      body.options = options.ollamaOptions;
    }
    if (options?.think !== undefined) {
      body.think = options.think;
    }
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      ...(stream ? {} : { signal: AbortSignal.timeout(this.timeoutMs) })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Ollama chat failed: ${response.status} (model=${model}, url=${this.baseUrl}/api/chat)${detail ? ` — ${detail.slice(0, 200)}` : ""}`
      );
    }
    return response;
  }
}
