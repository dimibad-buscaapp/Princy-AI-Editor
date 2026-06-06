import { authenticate, asyncHandler } from "@princy/core";
import { prisma } from "@princy/database";
import { getModelRouter, isCodeModel, isFastModel, isReasoningModel } from "@princy/shared";
import type { Express } from "express";

async function getDbRouterStats() {
  const rows = await prisma.$queryRaw<
    { modelId: string; runs: bigint; avgMs: number | null; cacheHits: bigint; cacheTotal: bigint }[]
  >`
    SELECT
      "modelId",
      COUNT(*)::bigint AS runs,
      AVG("totalMs")::float AS "avgMs",
      SUM(CASE WHEN "cacheHit" = true THEN 1 ELSE 0 END)::bigint AS "cacheHits",
      COUNT(*)::bigint AS "cacheTotal"
    FROM "ModelMetric"
    GROUP BY "modelId"
  `;

  let totalRequests = 0;
  let qwen25Requests = 0;
  let qwen3Requests = 0;
  let deepseekRequests = 0;
  let totalMs = 0;
  let totalRuns = 0;
  let cacheHits = 0;
  let cacheTotal = 0;
  const modelCounts = new Map<string, number>();

  for (const row of rows) {
    const runs = Number(row.runs);
    totalRequests += runs;
    modelCounts.set(row.modelId, runs);
    if (isFastModel(row.modelId)) qwen25Requests += runs;
    else if (isCodeModel(row.modelId)) qwen3Requests += runs;
    else if (isReasoningModel(row.modelId)) deepseekRequests += runs;
    if (row.avgMs) {
      totalMs += row.avgMs * runs;
      totalRuns += runs;
    }
    cacheHits += Number(row.cacheHits);
    cacheTotal += Number(row.cacheTotal);
  }

  let mostUsedModel: string | undefined;
  let maxCount = 0;
  for (const [model, count] of modelCounts) {
    if (count > maxCount) {
      maxCount = count;
      mostUsedModel = model;
    }
  }

  return {
    totalRequests,
    qwen25Requests,
    qwen3Requests,
    deepseekRequests,
    avgResponseTime: totalRuns > 0 ? Math.round(totalMs / totalRuns) : 0,
    mostUsedModel,
    cacheHitRatio: cacheTotal > 0 ? Math.round((cacheHits / cacheTotal) * 1000) / 10 : undefined
  };
}

export function registerRouterRoutes(app: Express) {
  const auth = authenticate();

  app.get("/router/stats", auth, asyncHandler(async (_request, response) => {
    const memory = getModelRouter().getStats();
    const db = await getDbRouterStats().catch(() => null);

    const merged = {
      totalRequests: Math.max(memory.totalRequests, db?.totalRequests ?? 0),
      qwen25Requests: Math.max(memory.qwen25Requests, db?.qwen25Requests ?? 0),
      qwen3Requests: Math.max(memory.qwen3Requests, db?.qwen3Requests ?? 0),
      deepseekRequests: Math.max(memory.deepseekRequests, db?.deepseekRequests ?? 0),
      avgResponseTime: db?.avgResponseTime || memory.avgResponseTime,
      mostUsedModel: db?.mostUsedModel ?? memory.mostUsedModel,
      cacheHitRatio: db?.cacheHitRatio ?? memory.cacheHitRatio
    };

    response.json(merged);
  }));
}
