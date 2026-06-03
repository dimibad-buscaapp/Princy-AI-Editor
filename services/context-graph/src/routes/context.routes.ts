import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { ContextGraphService } from "../services/context-indexer.js";

const indexSchema = z.object({
  projectId: z.string(),
  workspacePath: z.string()
});

const searchSchema = z.object({
  projectId: z.string().optional(),
  query: z.string().min(1)
});

export function registerContextRoutes(app: Express) {
  const service = new ContextGraphService();
  const auth = authenticate();

  app.post("/context/index", auth, validateBody(indexSchema), asyncHandler(async (request, response) => {
    const result = await service.index(request.body.projectId, request.body.workspacePath);
    response.json(result);
  }));

  app.post("/context/search", auth, validateBody(searchSchema), asyncHandler(async (request, response) => {
    const nodes = await service.search(request.body.projectId, request.body.query);
    response.json({ nodes });
  }));

  app.get("/context/file", auth, asyncHandler(async (request, response) => {
    const projectId = String(request.query.projectId ?? "");
    const filePath = String(request.query.path ?? "");
    const nodes = await service.file(projectId || undefined, filePath);
    response.json({ nodes });
  }));

  app.get("/context/graph", auth, asyncHandler(async (request, response) => {
    const projectId = String(request.query.projectId ?? "");
    const graph = await service.graph(projectId || undefined);
    response.json(graph);
  }));
}
