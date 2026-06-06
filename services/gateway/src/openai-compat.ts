import type { Express, Request, Response } from "express";

function ollamaBase() {
  return (process.env.OLLAMA_BASE_URL ?? process.env.OLLAMA_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
}

function checkApiKey(request: Request) {
  const key = process.env.GATEWAY_API_KEY;
  if (!key) return true;
  const auth = request.headers.authorization ?? "";
  return auth === `Bearer ${key}` || request.headers["x-api-key"] === key;
}

export function registerOpenAiCompatRoutes(app: Express) {
  app.get("/v1/models", async (request, response) => {
    if (!checkApiKey(request)) {
      response.status(401).json({ error: { message: "Unauthorized" } });
      return;
    }
    try {
      const res = await fetch(`${ollamaBase()}/api/tags`);
      const data = (await res.json()) as { models?: { name: string }[] };
      response.json({
        object: "list",
        data: (data.models ?? []).map((m) => ({
          id: m.name,
          object: "model",
          created: Math.floor(Date.now() / 1000),
          owned_by: "ollama"
        }))
      });
    } catch {
      response.status(503).json({ error: { message: "Ollama unavailable" } });
    }
  });

  app.post("/v1/chat/completions", async (request, response) => {
    if (!checkApiKey(request)) {
      response.status(401).json({ error: { message: "Unauthorized" } });
      return;
    }
    const body = (request.body ?? {}) as {
      model?: string;
      messages?: { role: string; content: string }[];
      stream?: boolean;
    };
    const model = body.model ?? process.env.OLLAMA_CHAT_MODEL ?? "qwen3:8b";
    const stream = body.stream ?? false;

    if (stream) {
      response.setHeader("Content-Type", "text/event-stream");
      response.setHeader("Cache-Control", "no-cache");
      const ollamaRes = await fetch(`${ollamaBase()}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: body.messages ?? [], stream: true })
      });
      if (!ollamaRes.body) {
        response.status(502).end();
        return;
      }
      const reader = ollamaRes.body.getReader();
      const decoder = new TextDecoder();
      let id = `chatcmpl-${Date.now()}`;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n").filter(Boolean)) {
          try {
            const parsed = JSON.parse(line) as { message?: { content?: string } };
            const token = parsed.message?.content ?? "";
            if (token) {
              response.write(
                `data: ${JSON.stringify({
                  id,
                  object: "chat.completion.chunk",
                  choices: [{ index: 0, delta: { content: token }, finish_reason: null }]
                })}\n\n`
              );
            }
          } catch {
            /* skip */
          }
        }
      }
      response.write("data: [DONE]\n\n");
      response.end();
      return;
    }

    try {
      const ollamaRes = await fetch(`${ollamaBase()}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: body.messages ?? [], stream: false }),
        signal: AbortSignal.timeout(Number(process.env.OLLAMA_TIMEOUT_MS ?? 300_000))
      });
      if (!ollamaRes.ok) {
        const detail = await ollamaRes.text().catch(() => "");
        response.status(502).json({ error: { message: `Ollama error: ${detail.slice(0, 200)}` } });
        return;
      }
      const data = (await ollamaRes.json()) as { message?: { content?: string } };
      response.json({
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: data.message?.content ?? "" },
          finish_reason: "stop"
        }
      ]
    });
    } catch (error) {
      response.status(503).json({
        error: { message: error instanceof Error ? error.message : "Ollama unavailable" }
      });
    }
  });

  app.post("/v1/embeddings", async (request, response) => {
    if (!checkApiKey(request)) {
      response.status(401).json({ error: { message: "Unauthorized" } });
      return;
    }
    const body = (request.body ?? {}) as { model?: string; input?: string | string[] };
    const model = body.model ?? process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";
    const input = Array.isArray(body.input) ? body.input[0] ?? "" : body.input ?? "";
    const ollamaRes = await fetch(`${ollamaBase()}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: input })
    });
    const data = (await ollamaRes.json()) as { embedding?: number[] };
    response.json({
      object: "list",
      data: [
        {
          object: "embedding",
          index: 0,
          embedding: data.embedding ?? []
        }
      ],
      model,
      usage: { prompt_tokens: input.length, total_tokens: input.length }
    });
  });
}
