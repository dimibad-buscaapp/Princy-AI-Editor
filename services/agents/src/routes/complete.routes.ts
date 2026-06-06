import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { OllamaClient } from "@princy/ai-client";
import { routeModel } from "@princy/model-router";
import { getModelConfigService } from "../model-config/model-config.service.js";

const schema = z.object({
  prefix: z.string().min(1),
  language: z.string().optional()
});

export function registerCompleteRoutes(app: Express) {
  const auth = authenticate();
  const ollama = new OllamaClient();
  app.post("/chat/complete", auth, validateBody(schema), asyncHandler(async (request, response) => {
    const { prefix, language } = request.body;
    const model = routeModel("GHOST_TEXT");
    const started = Date.now();
    const chatRes = await ollama.chat([
      {
        role: "system",
        content: "Complete the code concisely. Return only the completion suffix, no explanation."
      },
      { role: "user", content: `Language: ${language ?? "typescript"}\n\n${prefix}` }
    ], { model });
    const data = (await chatRes.json()) as { message?: { content?: string } };
    const suggestion = (data.message?.content ?? "").trim();
    const totalMs = Date.now() - started;
    void getModelConfigService().recordMetric({
      modelId: model,
      task: "GHOST_TEXT",
      ttftMs: totalMs,
      totalMs,
      tokenCount: suggestion.length,
      tokensPerSec: totalMs > 0 ? Math.round((suggestion.length / (totalMs / 1000)) * 10) / 10 : 0
    });
    response.json({ suggestion: prefix + suggestion, model });
  }));
}
