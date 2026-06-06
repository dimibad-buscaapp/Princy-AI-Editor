import { createHash } from "node:crypto";
import { prisma } from "@princy/database";
import { rawCacheStats, rawGetCache, rawSetCache } from "./raw-db.js";

const CACHE_ENABLED = process.env.CHAT_CACHE_ENABLED !== "false";
const DEFAULT_TTL = Number(process.env.CHAT_CACHE_TTL_SECONDS ?? 86400);

export function hashQuery(query: string, projectId?: string): string {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");
  return createHash("sha256").update(`${projectId ?? ""}:${normalized}`).digest("hex");
}

export async function getCachedResponse(query: string, projectId?: string) {
  if (!CACHE_ENABLED) return null;
  const queryHash = hashQuery(query, projectId);
  const entry = await rawGetCache(queryHash, projectId);
  if (!entry) return null;
  return { response: entry.response, model: entry.model, hitCount: entry.hitCount + 1 };
}

export async function setCachedResponse(
  query: string,
  response: string,
  model: string,
  projectId?: string,
  ttlSeconds = DEFAULT_TTL
) {
  if (!CACHE_ENABLED) return null;
  const queryHash = hashQuery(query, projectId);
  await rawSetCache({ queryHash, query, response, model, projectId, ttlSeconds });
  return { queryHash };
}

export async function invalidateCache(projectId?: string) {
  if (projectId) {
    const count = await prisma.$executeRaw`DELETE FROM "ChatCacheEntry" WHERE "projectId" = ${projectId}`;
    return { count };
  }
  const count = await prisma.$executeRaw`DELETE FROM "ChatCacheEntry" WHERE "expiresAt" < NOW()`;
  return { count };
}

export async function getCacheStats() {
  return rawCacheStats();
}
