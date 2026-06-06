import { prisma } from "@princy/database";

function cuid() {
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export async function rawGetProjectMemory(projectId: string) {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      projectId: string;
      name: string | null;
      stack: unknown;
      services: unknown;
      ports: unknown;
      routes: unknown;
      recentChanges: unknown;
      pending: unknown;
      technicalDecisions: unknown;
    }>
  >`SELECT * FROM "ProjectMemory" WHERE "projectId" = ${projectId} LIMIT 1`;
  return rows[0] ?? null;
}

export async function rawUpsertProjectMemory(projectId: string, data: Record<string, unknown>) {
  const existing = await rawGetProjectMemory(projectId);
  if (existing) {
    await prisma.$executeRaw`
      UPDATE "ProjectMemory" SET
        name = COALESCE(${data.name as string | null ?? null}, name),
        stack = COALESCE(${JSON.stringify(data.stack ?? null)}::jsonb, stack),
        services = COALESCE(${JSON.stringify(data.services ?? null)}::jsonb, services),
        ports = COALESCE(${JSON.stringify(data.ports ?? null)}::jsonb, ports),
        routes = COALESCE(${JSON.stringify(data.routes ?? null)}::jsonb, routes),
        "recentChanges" = COALESCE(${JSON.stringify(data.recentChanges ?? null)}::jsonb, "recentChanges"),
        pending = COALESCE(${JSON.stringify(data.pending ?? null)}::jsonb, pending),
        "technicalDecisions" = COALESCE(${JSON.stringify(data.technicalDecisions ?? null)}::jsonb, "technicalDecisions"),
        "updatedAt" = NOW()
      WHERE "projectId" = ${projectId}
    `;
  } else {
    const id = cuid();
    await prisma.$executeRaw`
      INSERT INTO "ProjectMemory" (id, "projectId", name, stack, services, ports, routes, "recentChanges", pending, "technicalDecisions", "createdAt", "updatedAt")
      VALUES (${id}, ${projectId}, ${data.name as string | null ?? null}, ${JSON.stringify(data.stack ?? null)}::jsonb, ${JSON.stringify(data.services ?? null)}::jsonb, ${JSON.stringify(data.ports ?? null)}::jsonb, ${JSON.stringify(data.routes ?? null)}::jsonb, ${JSON.stringify(data.recentChanges ?? null)}::jsonb, ${JSON.stringify(data.pending ?? null)}::jsonb, ${JSON.stringify(data.technicalDecisions ?? null)}::jsonb, NOW(), NOW())
    `;
  }
  return rawGetProjectMemory(projectId);
}

export async function rawGetConversationMemory(conversationId: string) {
  const rows = await prisma.$queryRaw<
    Array<{ conversationId: string; shortSummary: string | null; longSummary: string | null; userPreferences: unknown }>
  >`SELECT "conversationId", "shortSummary", "longSummary", "userPreferences" FROM "ConversationMemory" WHERE "conversationId" = ${conversationId} LIMIT 1`;
  return rows[0] ?? null;
}

export async function rawUpsertConversationSummary(conversationId: string, shortSummary: string, longSummary?: string) {
  const existing = await rawGetConversationMemory(conversationId);
  if (existing) {
    await prisma.$executeRaw`
      UPDATE "ConversationMemory" SET "shortSummary" = ${shortSummary}, "longSummary" = ${longSummary ?? shortSummary}, "lastSummarizedAt" = NOW(), "updatedAt" = NOW()
      WHERE "conversationId" = ${conversationId}
    `;
  } else {
    const id = cuid();
    await prisma.$executeRaw`
      INSERT INTO "ConversationMemory" (id, "conversationId", "shortSummary", "longSummary", "lastSummarizedAt", "createdAt", "updatedAt")
      VALUES (${id}, ${conversationId}, ${shortSummary}, ${longSummary ?? shortSummary}, NOW(), NOW(), NOW())
    `;
  }
  return rawGetConversationMemory(conversationId);
}

export async function rawGetCache(queryHash: string, projectId?: string) {
  const rows = await prisma.$queryRaw<
    Array<{ response: string; model: string; hitCount: number }>
  >`
    SELECT response, model, "hitCount" FROM "ChatCacheEntry"
    WHERE "queryHash" = ${queryHash}
      AND (("projectId" IS NULL AND ${projectId ?? null}::text IS NULL) OR "projectId" = ${projectId ?? null})
      AND "expiresAt" > NOW()
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  await prisma.$executeRaw`UPDATE "ChatCacheEntry" SET "hitCount" = "hitCount" + 1 WHERE "queryHash" = ${queryHash}`;
  return row;
}

export async function rawSetCache(input: {
  queryHash: string;
  query: string;
  response: string;
  model: string;
  projectId?: string;
  ttlSeconds: number;
}) {
  const id = cuid();
  await prisma.$executeRaw`
    INSERT INTO "ChatCacheEntry" (id, "projectId", "queryHash", query, response, model, "ttlSeconds", "hitCount", "expiresAt", "createdAt", "updatedAt")
    VALUES (${id}, ${input.projectId ?? null}, ${input.queryHash}, ${input.query}, ${input.response}, ${input.model}, ${input.ttlSeconds}, 0, NOW() + (${input.ttlSeconds} || ' seconds')::interval, NOW(), NOW())
    ON CONFLICT ("queryHash", "projectId") DO UPDATE SET
      response = EXCLUDED.response,
      model = EXCLUDED.model,
      "expiresAt" = NOW() + (${input.ttlSeconds} || ' seconds')::interval,
      "updatedAt" = NOW()
  `;
}

export async function rawCacheStats() {
  const rows = await prisma.$queryRaw<Array<{ entries: bigint; totalHits: bigint }>>`
    SELECT COUNT(*)::bigint AS entries, COALESCE(SUM("hitCount"), 0)::bigint AS "totalHits" FROM "ChatCacheEntry"
  `;
  return { entries: Number(rows[0]?.entries ?? 0), totalHits: Number(rows[0]?.totalHits ?? 0) };
}

export async function rawRecordAgentMemory(input: {
  agentRole: string;
  taskId?: string;
  success: boolean;
  durationMs?: number;
  decision?: string;
  content?: string;
  kind?: string;
  projectId?: string;
  recurrenceKey?: string;
  metadata?: Record<string, unknown>;
}) {
  const id = cuid();
  await prisma.$executeRaw`
    INSERT INTO "AgentMemory" (id, "agentRole", kind, "projectId", content, "recurrenceKey", "taskId", success, "durationMs", decision, metadata, "createdAt")
    VALUES (
      ${id}, ${input.agentRole}, ${(input.kind ?? "decision")}::"AgentMemoryKind",
      ${input.projectId ?? null}, ${input.content ?? null}, ${input.recurrenceKey ?? null},
      ${input.taskId ?? null}, ${input.success}, ${input.durationMs ?? null},
      ${input.decision ?? null}, ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb, NOW()
    )
  `;
  return id;
}

export type RawAgentMemoryRow = {
  id: string;
  agentRole: string;
  kind: string;
  projectId: string | null;
  content: string | null;
  recurrenceKey: string | null;
  taskId: string | null;
  success: boolean;
  durationMs: number | null;
  decision: string | null;
  metadata: unknown;
  createdAt: Date;
};

export async function rawGetAgentMemoryRow(id: string): Promise<RawAgentMemoryRow | null> {
  const rows = await prisma.$queryRaw<RawAgentMemoryRow[]>`SELECT * FROM "AgentMemory" WHERE id = ${id} LIMIT 1`;
  return rows[0] ?? null;
}

export async function rawListAgentMemory(
  agentRole?: string,
  options?: { kind?: string; projectId?: string; limit?: number }
): Promise<RawAgentMemoryRow[]> {
  const limit = options?.limit ?? 50;
  if (agentRole && options?.kind && options?.projectId) {
    return prisma.$queryRaw<RawAgentMemoryRow[]>`
      SELECT * FROM "AgentMemory" WHERE "agentRole" = ${agentRole} AND kind = ${options.kind}::"AgentMemoryKind" AND "projectId" = ${options.projectId}
      ORDER BY "createdAt" DESC LIMIT ${limit}
    `;
  }
  if (agentRole && options?.kind) {
    return prisma.$queryRaw<RawAgentMemoryRow[]>`
      SELECT * FROM "AgentMemory" WHERE "agentRole" = ${agentRole} AND kind = ${options.kind}::"AgentMemoryKind"
      ORDER BY "createdAt" DESC LIMIT ${limit}
    `;
  }
  if (agentRole && options?.projectId) {
    return prisma.$queryRaw<RawAgentMemoryRow[]>`
      SELECT * FROM "AgentMemory" WHERE "agentRole" = ${agentRole} AND "projectId" = ${options.projectId}
      ORDER BY "createdAt" DESC LIMIT ${limit}
    `;
  }
  if (agentRole) {
    return prisma.$queryRaw<RawAgentMemoryRow[]>`
      SELECT * FROM "AgentMemory" WHERE "agentRole" = ${agentRole} ORDER BY "createdAt" DESC LIMIT ${limit}
    `;
  }
  return prisma.$queryRaw<RawAgentMemoryRow[]>`
    SELECT * FROM "AgentMemory" ORDER BY "createdAt" DESC LIMIT ${limit}
  `;
}

export async function rawDeleteAgentMemory(id: string) {
  await prisma.$executeRaw`DELETE FROM "AgentMemory" WHERE id = ${id}`;
}

async function resolveMemoryChunkProjectId(projectId?: string) {
  if (!projectId) return null;
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Project" WHERE id = ${projectId} LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

export async function rawCreateAgentMemoryChunk(input: {
  agentMemoryId: string;
  agentRole: string;
  kind: string;
  content: string;
  projectId?: string;
  title?: string;
}) {
  const id = cuid();
  const chunkProjectId = await resolveMemoryChunkProjectId(input.projectId);
  const tags = JSON.stringify([input.agentRole, input.kind]);
  const metadata = JSON.stringify({
    agentMemoryId: input.agentMemoryId,
    agentRole: input.agentRole,
    kind: input.kind,
    projectId: input.projectId ?? null
  });
  await prisma.$executeRaw`
    INSERT INTO "MemoryChunk" (id, scope, "projectId", title, content, tags, metadata, "createdAt", "updatedAt")
    VALUES (${id}, 'AGENT'::"MemoryScope", ${chunkProjectId}, ${input.title ?? `${input.agentRole} memory`}, ${input.content}, ${tags}::jsonb, ${metadata}::jsonb, NOW(), NOW())
  `;
  return id;
}

export async function rawDeleteAgentMemoryChunk(agentMemoryId: string) {
  await prisma.$executeRaw`
    DELETE FROM "MemoryChunk" WHERE metadata->>'agentMemoryId' = ${agentMemoryId}
  `;
}
