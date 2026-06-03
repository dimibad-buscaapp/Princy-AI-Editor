import { validateVector } from "./vector.js";

export type OllamaClientOptions = {
  baseUrl?: string;
  embedModel?: string;
  chatModel?: string;
  timeoutMs?: number;
};

export class OllamaClient {
  private readonly baseUrl: string;
  private readonly embedModel: string;
  private readonly chatModel: string;
  private readonly timeoutMs: number;

  constructor(options: OllamaClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? process.env.OLLAMA_BASE_URL ?? process.env.OLLAMA_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
    this.embedModel = options.embedModel ?? process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";
    this.chatModel = options.chatModel ?? process.env.OLLAMA_CHAT_MODEL ?? "qwen3-coder";
    this.timeoutMs = options.timeoutMs ?? 60_000;
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
      throw new Error(`Ollama embed failed: ${response.status}`);
    }
    const data = (await response.json()) as { embedding?: number[] };
    if (!data.embedding?.length) {
      throw new Error("Ollama returned empty embedding.");
    }
    return validateVector(data.embedding);
  }

  async chat(messages: { role: string; content: string }[], options?: { stream?: boolean }) {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.chatModel,
        messages,
        stream: options?.stream ?? false
      }),
      signal: AbortSignal.timeout(this.timeoutMs)
    });
    if (!response.ok) {
      throw new Error(`Ollama chat failed: ${response.status}`);
    }
    return response;
  }
}
