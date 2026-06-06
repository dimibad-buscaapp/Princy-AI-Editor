import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import {
  buildChatContext,
  getProjectMemory,
  upsertProjectMemory,
  getFullMessages,
  upsertConversationSummary,
  retrieveMemoryContext,
  getCachedResponse,
  setCachedResponse,
  invalidateCache,
  getCacheStats
} from "@princy/memory";
import { OllamaClient } from "@princy/ai-client";
import { routeModel } from "@princy/model-router";

const projectUpdateSchema = z.object({
  projectId: z.string(),
  name: z.string().optional(),
  stack: z.unknown().optional(),
  services: z.unknown().optional(),
  ports: z.unknown().optional(),
  routes: z.unknown().optional(),
  recentChanges: z.unknown().optional(),
  pending: z.unknown().optional(),
  technicalDecisions: z.unknown().optional()
});

const chatContextSchema = z.object({
  projectId: z.string().optional(),
  conversationId: z.string().optional(),
  query: z.string().optional()
});

const summarizeSchema = z.object({
  conversationId: z.string()
});

const retrieveSchema = z.object({
  projectId: z.string().optional(),
  conversationId: z.string().optional(),
  query: z.string().min(1)
});

const cacheSchema = z.object({
  action: z.enum(["get", "set", "invalidate", "stats"]),
  query: z.string().optional(),
  response: z.string().optional(),
  model: z.string().optional(),
  projectId: z.string().optional()
});

export function registerMemoryV2Routes(app: Express) {
  const auth = authenticate();
  const ollama = new OllamaClient();

  app.get("/memory/project", auth, asyncHandler(async (request, response) => {
    const projectId = String(request.query.projectId ?? "");
    if (!projectId) {
      response.status(400).json({ error: "projectId required" });
      return;
    }
    const memory = await getProjectMemory(projectId);
    response.json({ memory });
  }));

  app.post("/memory/project/update", auth, validateBody(projectUpdateSchema), asyncHandler(async (request, response) => {
    const { projectId, ...data } = request.body;
    const memory = await upsertProjectMemory(projectId, data);
    response.json({ memory });
  }));

  app.get("/memory/chat/context", auth, asyncHandler(async (request, response) => {
    const parsed = chatContextSchema.safeParse(request.query);
    if (!parsed.success) {
      response.status(400).json({ error: "invalid query" });
      return;
    }
    const context = await buildChatContext({
      projectId: parsed.data.projectId,
      conversationId: parsed.data.conversationId,
      query: parsed.data.query ?? ""
    });
    const messages = parsed.data.conversationId
      ? await getFullMessages(parsed.data.conversationId, 10)
      : [];
    response.json({ context, messages });
  }));

  app.post("/memory/chat/summarize", auth, validateBody(summarizeSchema), asyncHandler(async (request, response) => {
    const { conversationId } = request.body;
    const messages = await getFullMessages(conversationId, 20);
    const transcript = messages.map((m) => `${m.role}: ${m.content}`).join("\n").slice(0, 6000);
    const model = routeModel("CHAT");
    const res = await ollama.chat([
      { role: "system", content: "Summarize this conversation in 2-3 sentences. Portuguese." },
      { role: "user", content: transcript }
    ], { model });
    const data = (await res.json()) as { message?: { content?: string } };
    const summary = (data.message?.content ?? "").trim();
    const memory = await upsertConversationSummary(conversationId, summary);
    response.json({ memory, model });
  }));

  app.post("/memory/retrieve", auth, validateBody(retrieveSchema), asyncHandler(async (request, response) => {
    const result = await retrieveMemoryContext(request.body);
    response.json(result);
  }));

  app.post("/memory/cache", auth, validateBody(cacheSchema), asyncHandler(async (request, response) => {
    const { action, query, response: cachedResponse, model, projectId } = request.body;
    if (action === "get" && query) {
      const hit = await getCachedResponse(query, projectId);
      response.json({ hit: Boolean(hit), entry: hit });
      return;
    }
    if (action === "set" && query && cachedResponse && model) {
      const entry = await setCachedResponse(query, cachedResponse, model, projectId);
      response.json({ entry });
      return;
    }
    if (action === "invalidate") {
      const result = await invalidateCache(projectId);
      response.json({ deleted: result.count });
      return;
    }
    if (action === "stats") {
      const stats = await getCacheStats();
      response.json(stats);
      return;
    }
    response.status(400).json({ error: "invalid cache action" });
  }));
}
