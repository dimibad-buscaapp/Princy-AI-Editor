import { prisma } from "@princy/database";
import { rawRecordAgentMemory } from "./raw-db.js";

export async function recordAgentMemory(input: {
  agentRole: string;
  taskId?: string;
  success: boolean;
  durationMs?: number;
  decision?: string;
  metadata?: Record<string, unknown>;
}) {
  return rawRecordAgentMemory(input);
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

export async function listAgentMemory(agentRole?: string, limit = 50) {
  if (agentRole) {
    return prisma.$queryRaw`SELECT * FROM "AgentMemory" WHERE "agentRole" = ${agentRole} ORDER BY "createdAt" DESC LIMIT ${limit}`;
  }
  return prisma.$queryRaw`SELECT * FROM "AgentMemory" ORDER BY "createdAt" DESC LIMIT ${limit}`;
}
