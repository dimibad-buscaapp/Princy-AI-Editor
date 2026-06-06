import { authenticate, asyncHandler, validateBody, type AuthenticatedRequest } from "@princy/core";
import type { Express, Response } from "express";
import { z } from "zod";
import type { ModelSlot } from "@princy/model-router";
import { getModelConfigService } from "../model-config/model-config.service.js";
import { warmupChatModels } from "../model-config/model-warmup.js";

const patchSchema = z.object({
  slot: z.enum(["CHAT", "EDITOR", "SWARM", "AUTONOMOUS", "EMBED"]),
  modelId: z.string().min(1)
});

function requireAdmin(request: AuthenticatedRequest, response: Response) {
  if (request.user?.role !== "ADMIN") {
    response.status(403).json({ error: "Apenas administradores podem alterar modelos" });
    return false;
  }
  return true;
}

export function registerModelsRoutes(app: Express) {
  const auth = authenticate();
  const configService = getModelConfigService();

  app.get("/agents/models/config", auth, asyncHandler(async (_request, response) => {
    response.json(await configService.getConfig());
  }));

  app.patch("/agents/models/config", auth, validateBody(patchSchema), asyncHandler(async (request, response) => {
    const req = request as AuthenticatedRequest;
    if (!requireAdmin(req, response)) return;
    const { slot, modelId } = request.body;
    try {
      const config = await configService.updateSlot(slot as ModelSlot, modelId, req.user?.id);
      response.json(config);
    } catch (error) {
      response.status(400).json({
        error: error instanceof Error ? error.message : "Falha ao atualizar modelo"
      });
    }
  }));

  app.get("/agents/models/metrics", auth, asyncHandler(async (request, response) => {
    const limit = Number(request.query.limit ?? 50);
    response.json(await configService.getMetrics(limit));
  }));

  app.post("/models/warm", auth, asyncHandler(async (_request, response) => {
    await warmupChatModels();
    const installed = await configService.getInstalledModels();
    const fast = process.env.CHAT_FAST_MODEL ?? "qwen2.5:3b";
    response.json({
      warmed: true,
      model: fast,
      installed: installed.includes(fast)
    });
  }));

  app.get("/models/warm", auth, asyncHandler(async (_request, response) => {
    const installed = await configService.getInstalledModels();
    const fast = process.env.CHAT_FAST_MODEL ?? "qwen2.5:3b";
    response.json({ model: fast, installed: installed.includes(fast), warning: !installed.includes(fast) ? `${fast} not installed` : null });
  }));
}
