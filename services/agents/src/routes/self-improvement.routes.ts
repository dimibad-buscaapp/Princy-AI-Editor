import { authenticate, asyncHandler } from "@princy/core";
import type { Express } from "express";
import { getSelfImprovementStats } from "../self-improvement/self-improvement.service.js";

export function registerSelfImprovementRoutes(app: Express) {
  const auth = authenticate();

  app.get("/agents/self-improvement/stats", auth, asyncHandler(async (_request, response) => {
    const stats = await getSelfImprovementStats();
    response.json(stats);
  }));
}
