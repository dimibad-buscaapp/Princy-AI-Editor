import { authenticate, asyncHandler, validateBody, type AuthenticatedRequest } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { enqueueOffline, getSyncStatus, pullSync, pushSync } from "../sync/sync.service.js";

const pushSchema = z.object({
  items: z.array(z.object({
    entity: z.enum(["settings", "project", "memory", "agent", "workspace"]),
    entityId: z.string(),
    payload: z.record(z.string(), z.unknown()),
    updatedAt: z.string().optional()
  }))
});

const enqueueSchema = z.object({
  entity: z.enum(["settings", "project", "memory", "agent", "workspace"]),
  entityId: z.string(),
  operation: z.string(),
  payload: z.record(z.string(), z.unknown())
});

export function registerSyncRoutes(app: Express) {
  const auth = authenticate();

  app.post("/sync/push", auth, validateBody(pushSchema), asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).user!.id;
    const result = await pushSync(userId, request.body.items);
    response.json(result);
  }));

  app.get("/sync/pull", auth, asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).user!.id;
    const since = request.query.since ? String(request.query.since) : undefined;
    const result = await pullSync(userId, since);
    response.json(result);
  }));

  app.get("/sync/status", auth, asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).user!.id;
    const status = await getSyncStatus(userId);
    response.json(status);
  }));

  app.post("/sync/queue", auth, validateBody(enqueueSchema), asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).user!.id;
    const result = await enqueueOffline(userId, request.body);
    response.status(201).json(result);
  }));
}
