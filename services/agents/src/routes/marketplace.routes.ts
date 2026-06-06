import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authenticate, asyncHandler, type AuthenticatedRequest } from "@princy/core";
import type { Express } from "express";
import { prisma } from "@princy/database";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../marketplace");
const manifestPath = path.join(rootDir, "manifest.json");

async function loadStore(store: string) {
  const storePath = path.join(rootDir, "stores", `${store}.json`);
  const raw = await fs.readFile(storePath, "utf8");
  return JSON.parse(raw) as { store: string; version: string; featured: string[]; items: MarketplaceItem[] };
}

export type MarketplaceItem = {
  id: string;
  type: string;
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  version: string;
  installed?: boolean;
};

async function loadManifest() {
  const raw = await fs.readFile(manifestPath, "utf8");
  const parsed = JSON.parse(raw) as { version: string; items: MarketplaceItem[] };
  return parsed;
}

function cuid(p: string) {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function registerMarketplaceRoutes(app: Express) {
  const auth = authenticate();

  app.get("/agents/marketplace", auth, asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const type = request.query.type ? String(request.query.type) : undefined;
    const [manifest, installed] = await Promise.all([
      loadManifest(),
      prisma.$queryRaw<Array<{ itemType: string; itemId: string }>>`
        SELECT "itemType", "itemId" FROM "InstalledItem" WHERE "userId" = ${user.id}
      `
    ]);
    const installedKeys = new Set(installed.map((i) => `${i.itemType}:${i.itemId}`));
    let items = manifest.items.map((item) => ({
      ...item,
      installed: installedKeys.has(`${item.type}:${item.id}`)
    }));
    if (type) items = items.filter((i) => i.type === type);
    response.json({ version: manifest.version, items });
  }));

  async function storeHandler(storeName: string, itemType: string, userId: string) {
    const [manifest, store, installed] = await Promise.all([
      loadManifest(),
      loadStore(storeName),
      prisma.$queryRaw<Array<{ itemId: string }>>`
        SELECT "itemId" FROM "InstalledItem" WHERE "userId" = ${userId} AND "itemType" = ${itemType}
      `
    ]);
    const installedIds = new Set(installed.map((i) => i.itemId));
    const base = manifest.items.filter((i) => i.type === itemType);
    const merged = [...base, ...store.items.filter((s) => !base.some((b) => b.id === s.id))];
    return {
      store: store.store,
      version: store.version,
      featured: store.featured,
      items: merged.map((i) => ({ ...i, installed: installedIds.has(i.id) }))
    };
  }

  app.get("/agents/store/agents", auth, asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    response.json(await storeHandler("agents", "agent", user.id));
  }));

  app.get("/agents/store/templates", auth, asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    response.json(await storeHandler("templates", "template", user.id));
  }));

  app.get("/agents/marketplace/:type", auth, asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const itemType = String(request.params.type);
    const [manifest, installed] = await Promise.all([
      loadManifest(),
      prisma.$queryRaw<Array<{ itemId: string }>>`
        SELECT "itemId" FROM "InstalledItem" WHERE "userId" = ${user.id} AND "itemType" = ${itemType}
      `
    ]);
    const installedIds = new Set(installed.map((i) => i.itemId));
    const items = manifest.items
      .filter((i) => i.type === itemType)
      .map((i) => ({ ...i, installed: installedIds.has(i.id) }));
    response.json({ items });
  }));

  app.post("/agents/marketplace/:type/:id/install", auth, asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const itemType = String(request.params.type);
    const itemId = String(request.params.id);
    const manifest = await loadManifest();
    const item = manifest.items.find((i) => i.type === itemType && i.id === itemId);
    if (!item) {
      response.status(404).json({ error: "not_found" });
      return;
    }
    const id = cuid("ii");
    await prisma.$executeRaw`
      INSERT INTO "InstalledItem" (id, "userId", "itemType", "itemId", version, "createdAt")
      VALUES (${id}, ${user.id}, ${itemType}, ${itemId}, ${item.version}, NOW())
      ON CONFLICT ("userId", "itemType", "itemId") DO UPDATE SET version = EXCLUDED.version
    `;
    response.json({ installed: true, itemType, itemId });
  }));

  app.post("/agents/marketplace/:type/:id/uninstall", auth, asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const itemType = String(request.params.type);
    const itemId = String(request.params.id);
    await prisma.$executeRaw`
      DELETE FROM "InstalledItem" WHERE "userId" = ${user.id} AND "itemType" = ${itemType} AND "itemId" = ${itemId}
    `;
    response.json({ installed: false, itemType, itemId });
  }));

  // Legacy alias (agent-only)
  app.post("/agents/marketplace/:id/install", auth, asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const itemId = String(request.params.id);
    const manifest = await loadManifest();
    const item = manifest.items.find((i) => i.type === "agent" && i.id === itemId);
    if (!item) {
      response.status(404).json({ error: "not_found" });
      return;
    }
    const id = cuid("ii");
    await prisma.$executeRaw`
      INSERT INTO "InstalledItem" (id, "userId", "itemType", "itemId", version, "createdAt")
      VALUES (${id}, ${user.id}, 'agent', ${itemId}, ${item.version}, NOW())
      ON CONFLICT ("userId", "itemType", "itemId") DO UPDATE SET version = EXCLUDED.version
    `;
    response.json({ installed: true, agentId: itemId });
  }));

  app.post("/agents/marketplace/:id/uninstall", auth, asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const itemId = String(request.params.id);
    await prisma.$executeRaw`
      DELETE FROM "InstalledItem" WHERE "userId" = ${user.id} AND "itemType" = 'agent' AND "itemId" = ${itemId}
    `;
    response.json({ installed: false, agentId: itemId });
  }));
}
