import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { OllamaClient } from "@princy/ai-client";

const schema = z.object({
  prefix: z.string().min(1),
  language: z.string().optional()
});

export function registerCompleteRoutes(app: Express) {
  const auth = authenticate();
  const ollama = new OllamaClient();

  app.post("/chat/complete", auth, validateBody(schema), asyncHandler(async (request, response) => {
    const { prefix, language } = request.body;
    const chatRes = await ollama.chat([
      {
        role: "system",
        content: "Complete the code concisely. Return only the completion suffix, no explanation."
      },
      { role: "user", content: `Language: ${language ?? "typescript"}\n\n${prefix}` }
    ]);
    const data = (await chatRes.json()) as { message?: { content?: string } };
    const suggestion = (data.message?.content ?? "").trim();
    response.json({ suggestion: prefix + suggestion });
  }));
}
