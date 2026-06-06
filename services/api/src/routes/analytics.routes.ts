import { authenticate, asyncHandler } from "@princy/core";
import type { Express } from "express";
import { prisma } from "@princy/database";

export function registerAnalyticsRoutes(app: Express) {
  const auth = authenticate();

  app.get("/analytics/usage", auth, asyncHandler(async (_request, response) => {
    const [messages, chunks, runs, metrics] = await Promise.all([
      prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "Message"`,
      prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "MemoryChunk"`,
      prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "SwarmRun"`,
      prisma.$queryRaw<Array<{ modelId: string; runs: bigint; avgMs: number }>>`
        SELECT "modelId", COUNT(*)::bigint AS runs, AVG("totalMs")::float AS "avgMs"
        FROM "ModelMetric" GROUP BY "modelId" ORDER BY runs DESC LIMIT 10
      `
    ]);
    response.json({
      usage: {
        messages: Number(messages[0]?.count ?? 0),
        memoryChunks: Number(chunks[0]?.count ?? 0),
        swarmRuns: Number(runs[0]?.count ?? 0)
      },
      models: metrics.map((m) => ({
        modelId: m.modelId,
        runs: Number(m.runs),
        avgMs: Math.round(m.avgMs ?? 0)
      }))
    });
  }));
}
