import { authenticate, asyncHandler } from "@princy/core";
import type { Express } from "express";
import { prisma } from "@princy/database";

function cuid(p: string) {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function registerWorkerRoutes(app: Express) {
  const auth = authenticate();

  app.get("/workers", auth, asyncHandler(async (_request, response) => {
    const nodes = await prisma.$queryRaw`SELECT * FROM "WorkerNode" ORDER BY "lastSeenAt" DESC LIMIT 50`;
    response.json({ nodes });
  }));

  app.post("/workers/register", auth, asyncHandler(async (request, response) => {
    const { hostname, region, remoteAgentUrl, gpuType, gpuCount, gpuMemoryMb } = request.body as {
      hostname: string;
      region?: string;
      remoteAgentUrl?: string;
      gpuType?: string;
      gpuCount?: number;
      gpuMemoryMb?: number;
    };
    const id = cuid("wn");
    await prisma.$executeRaw`
      INSERT INTO "WorkerNode" (id, hostname, status, region, "remoteAgentUrl", "gpuType", "gpuCount", "gpuMemoryMb", "lastSeenAt", "createdAt")
      VALUES (${id}, ${hostname}, 'idle', ${region ?? null}, ${remoteAgentUrl ?? null}, ${gpuType ?? null}, ${gpuCount ?? 0}, ${gpuMemoryMb ?? null}, NOW(), NOW())
    `;
    response.status(201).json({ node: { id, hostname } });
  }));

  app.post("/workers/:id/heartbeat", auth, asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    await prisma.$executeRaw`UPDATE "WorkerNode" SET "lastSeenAt" = NOW(), status = 'idle' WHERE id = ${id}`;
    response.json({ ok: true });
  }));
}
