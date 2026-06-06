import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { getCachedResponse, setCachedResponse, getCacheStats } from "@princy/memory";

const lookupSchema = z.object({
  query: z.string().min(1),
  projectId: z.string().optional()
});

const storeSchema = z.object({
  query: z.string().min(1),
  response: z.string().min(1),
  model: z.string().min(1),
  projectId: z.string().optional()
});

export function registerChatCacheRoutes(app: Express) {
  const auth = authenticate();

  app.post("/memory/cache/lookup", auth, validateBody(lookupSchema), asyncHandler(async (request, response) => {
    const hit = await getCachedResponse(request.body.query, request.body.projectId);
    response.json({ cacheHit: Boolean(hit), entry: hit });
  }));

  app.post("/memory/cache/store", auth, validateBody(storeSchema), asyncHandler(async (request, response) => {
    const entry = await setCachedResponse(
      request.body.query,
      request.body.response,
      request.body.model,
      request.body.projectId
    );
    response.json({ entry });
  }));

  app.get("/memory/cache/stats", auth, asyncHandler(async (_request, response) => {
    const stats = await getCacheStats();
    response.json(stats);
  }));
}
