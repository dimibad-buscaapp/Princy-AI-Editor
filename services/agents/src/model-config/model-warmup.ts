import { routeModel } from "@princy/model-router";

const KEEP_ALIVE = process.env.OLLAMA_KEEP_ALIVE ?? "30m";
const KEEPALIVE_INTERVAL_MS = Number(process.env.OLLAMA_KEEPALIVE_INTERVAL_MS ?? 600_000);

async function pingModel(model: string) {
  const baseUrl = (process.env.OLLAMA_BASE_URL ?? process.env.OLLAMA_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
  const started = Date.now();
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "ok" }],
      stream: false,
      keep_alive: KEEP_ALIVE,
      options: {
        num_ctx: Number(process.env.OLLAMA_CHAT_NUM_CTX ?? 1024),
        num_predict: 4,
        temperature: 0.1
      }
    }),
    signal: AbortSignal.timeout(120_000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  console.info(`[model-warmup] ${model} ready in ${Date.now() - started}ms`);
}

export async function warmupChatModels() {
  const chatModel = process.env.CHAT_FAST_MODEL ?? routeModel("CHAT");
  try {
    await pingModel(chatModel);
  } catch (err) {
    console.warn({ err }, `[model-warmup] skipped ${chatModel}`);
  }
}

export function startModelKeepAlive() {
  const chatModel = process.env.CHAT_FAST_MODEL ?? routeModel("CHAT");
  setInterval(() => {
    void pingModel(chatModel).catch((err) => {
      console.warn({ err }, "[model-keepalive] ping failed");
    });
  }, KEEPALIVE_INTERVAL_MS);
}
