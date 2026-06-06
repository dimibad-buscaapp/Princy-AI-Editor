import { prisma } from "@princy/database";
import {
  rawCreateAgentMemoryChunk,
  rawDeleteAgentMemory,
  rawDeleteAgentMemoryChunk,
  rawGetAgentMemoryRow,
  rawListAgentMemory,
  rawRecordAgentMemory,
  type RawAgentMemoryRow
} from "./raw-db.js";

export type AgentMemoryKind = "decision" | "error" | "preference" | "context";

export type AgentMemoryRow = RawAgentMemoryRow & { kind: AgentMemoryKind };

export type CreateAgentMemoryInput = {
  agentRole: string;
  kind: AgentMemoryKind;
  content: string;
  projectId?: string;
  taskId?: string;
  success?: boolean;
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

export function normalizeRecurrenceKey(message: string): string {
  return message
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export async function recordAgentMemory(input: {
  agentRole: string;
  taskId?: string;
  success: boolean;
  durationMs?: number;
  decision?: string;
  content?: string;
  kind?: AgentMemoryKind;
  projectId?: string;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
}) {
  const kind: AgentMemoryKind = input.kind ?? (input.success ? "decision" : "error");
  const content = input.content ?? input.decision ?? input.errorMessage ?? "";
  const recurrenceKey =
    kind === "error" && (input.errorMessage || content)
      ? normalizeRecurrenceKey(input.errorMessage ?? content)
      : undefined;

  const id = await rawRecordAgentMemory({
    agentRole: input.agentRole,
    taskId: input.taskId,
    success: input.success,
    durationMs: input.durationMs,
    decision: input.decision ?? content.slice(0, 500),
    content,
    kind,
    projectId: input.projectId,
    recurrenceKey,
    metadata: input.metadata
  });

  if (content.trim()) {
    await rawCreateAgentMemoryChunk({
      agentMemoryId: id,
      agentRole: input.agentRole,
      kind,
      content,
      projectId: input.projectId,
      title: `${input.agentRole} ${kind}`
    });
  }

  return id;
}

export async function createAgentMemory(input: CreateAgentMemoryInput) {
  const recurrenceKey =
    input.kind === "error" ? normalizeRecurrenceKey(input.content) : undefined;

  const id = await rawRecordAgentMemory({
    agentRole: input.agentRole,
    taskId: input.taskId,
    success: input.success ?? true,
    durationMs: input.durationMs,
    decision: input.content.slice(0, 500),
    content: input.content,
    kind: input.kind,
    projectId: input.projectId,
    recurrenceKey,
    metadata: input.metadata
  });

  try {
    await rawCreateAgentMemoryChunk({
      agentMemoryId: id,
      agentRole: input.agentRole,
      kind: input.kind,
      content: input.content,
      projectId: input.projectId,
      title: `${input.agentRole} ${input.kind}`
    });
  } catch (error) {
    await rawDeleteAgentMemory(id);
    throw error;
  }

  return rawGetAgentMemoryRow(id);
}

export async function deleteAgentMemory(memoryId: string) {
  const row = await rawGetAgentMemoryRow(memoryId);
  if (!row) return false;
  await rawDeleteAgentMemoryChunk(memoryId);
  await rawDeleteAgentMemory(memoryId);
  return true;
}

export async function getAgentMemoryStats(agentRole: string) {
  const rows = await prisma.$queryRaw<Array<{ success: boolean; durationMs: number | null }>>`
    SELECT success, "durationMs" FROM "AgentMemory" WHERE "agentRole" = ${agentRole} ORDER BY "createdAt" DESC LIMIT 100
  `;
  const success = rows.filter((r) => r.success).length;
  const avgDuration =
    rows.length > 0
      ? Math.round(rows.reduce((s, r) => s + (r.durationMs ?? 0), 0) / rows.length)
      : 0;
  return { total: rows.length, success, failure: rows.length - success, avgDurationMs: avgDuration };
}

export async function aggregateRecurringErrors(agentRole: string, limit = 10) {
  const rows = await prisma.$queryRaw<
    Array<{ recurrenceKey: string; count: bigint; lastSeen: Date; sample: string | null }>
  >`
    SELECT "recurrenceKey", COUNT(*)::bigint AS count, MAX("createdAt") AS "lastSeen",
      (ARRAY_AGG(COALESCE(content, decision) ORDER BY "createdAt" DESC))[1] AS sample
    FROM "AgentMemory"
    WHERE "agentRole" = ${agentRole} AND kind = 'error'::"AgentMemoryKind" AND "recurrenceKey" IS NOT NULL
    GROUP BY "recurrenceKey"
    ORDER BY count DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    key: r.recurrenceKey,
    count: Number(r.count),
    lastSeen: r.lastSeen,
    sample: r.sample ?? ""
  }));
}

export async function listAgentMemory(
  agentRole?: string,
  options?: { kind?: AgentMemoryKind; projectId?: string; limit?: number }
): Promise<AgentMemoryRow[]> {
  return rawListAgentMemory(agentRole, options) as Promise<AgentMemoryRow[]>;
}

export async function getAgentMemory(agentRole: string, options?: {
  kind?: AgentMemoryKind;
  projectId?: string;
  limit?: number;
}) {
  const [stats, memories, recurringErrors] = await Promise.all([
    getAgentMemoryStats(agentRole),
    listAgentMemory(agentRole, options),
    aggregateRecurringErrors(agentRole)
  ]);

  const allPrefs = await rawListAgentMemory(agentRole, { kind: "preference", limit: 20 });
  const projectPreferences = options?.projectId
    ? allPrefs.filter((m) => m.projectId === options.projectId)
    : allPrefs;

  return {
    agentId: agentRole,
    stats,
    memories,
    recurringErrors,
    projectPreferences: projectPreferences.map((m) => ({
      projectId: m.projectId,
      content: m.content ?? m.decision ?? "",
      id: m.id,
      createdAt: m.createdAt
    }))
  };
}

export async function getAgentMemoryContext(agentRole: string, projectId?: string) {
  const parts: string[] = [];

  const recent = await rawListAgentMemory(agentRole, {
    projectId,
    limit: 8
  });

  const decisions = recent.filter((m) => m.kind === "decision" || m.kind === "context");
  if (decisions.length > 0) {
    parts.push(
      "Previous agent decisions:",
      ...decisions.slice(0, 4).map((m) => `- ${(m.content ?? m.decision ?? "").slice(0, 300)}`)
    );
  }

  const errors = await aggregateRecurringErrors(agentRole, 3);
  if (errors.length > 0) {
    parts.push(
      "Recurring errors to avoid:",
      ...errors.map((e) => `- (${e.count}x) ${e.sample.slice(0, 200)}`)
    );
  }

  const prefs = await rawListAgentMemory(agentRole, {
    kind: "preference",
    projectId,
    limit: 3
  });
  if (prefs.length > 0) {
    parts.push(
      "Project preferences:",
      ...prefs.map((p) => `- ${(p.content ?? "").slice(0, 200)}`)
    );
  }

  const chunks = await prisma.$queryRaw<Array<{ title: string | null; content: string }>>`
    SELECT title, content FROM "MemoryChunk"
    WHERE scope = 'AGENT'::"MemoryScope"
      AND (${projectId ?? null}::text IS NULL OR "projectId" = ${projectId ?? null})
      AND (tags::text ILIKE ${`%${agentRole}%`} OR metadata::text ILIKE ${`%${agentRole}%`})
    ORDER BY "createdAt" DESC
    LIMIT 5
  `;

  if (chunks.length > 0) {
    parts.push(
      "Memory V2 agent context:",
      ...chunks.map((c) => `- ${c.title ?? "note"}: ${c.content.slice(0, 200)}`)
    );
  }

  return parts.join("\n");
}
