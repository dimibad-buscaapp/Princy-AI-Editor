import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authenticate, asyncHandler, type AuthenticatedRequest } from "@princy/core";
import type { Express } from "express";
import { prisma } from "@princy/database";

const catalogPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../agents/catalog.json");

async function loadCatalog() {
  const raw = await fs.readFile(catalogPath, "utf8");
  return JSON.parse(raw) as Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    capabilities: string[];
    version: string;
  }>;
}

export function registerMarketplaceRoutes(app: Express) {
  const auth = authenticate();

  app.get("/agents/marketplace", auth, asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const [catalog, installed] = await Promise.all([
      loadCatalog(),
      prisma.$queryRaw<Array<{ agentId: string }>>`SELECT "agentId" FROM "InstalledAgent" WHERE "userId" = ${user.id}`
    ]);
    const installedIds = new Set(installed.map((i) => i.agentId));
    response.json({
      agents: catalog.map((a) => ({ ...a, installed: installedIds.has(a.id) }))
    });
  }));

  app.post("/agents/marketplace/:id/install", auth, asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const agentId = String(request.params.id);
    const catalog = await loadCatalog();
    const agent = catalog.find((a) => a.id === agentId);
    if (!agent) {
      response.status(404).json({ error: "not_found" });
      return;
    }
    const id = `ia_${Date.now()}`;
    await prisma.$executeRaw`
      INSERT INTO "InstalledAgent" (id, "userId", "agentId", version, "createdAt")
      VALUES (${id}, ${user.id}, ${agentId}, ${agent.version}, NOW())
      ON CONFLICT ("userId", "agentId") DO UPDATE SET version = EXCLUDED.version
    `;
    response.json({ installed: true, agentId });
  }));

  app.post("/agents/marketplace/:id/uninstall", auth, asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const agentId = String(request.params.id);
    await prisma.$executeRaw`DELETE FROM "InstalledAgent" WHERE "userId" = ${user.id} AND "agentId" = ${agentId}`;
    response.json({ installed: false, agentId });
  }));
}
