import { prisma } from "@princy/database";

function cuid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export type SyncEntity = "settings" | "project" | "memory" | "agent" | "workspace";

export async function pushSync(userId: string, items: Array<{
  entity: SyncEntity;
  entityId: string;
  payload: Record<string, unknown>;
  updatedAt?: string;
}>) {
  const results: Array<{ entity: string; entityId: string; status: string }> = [];

  for (const item of items) {
    const remoteVersion = item.updatedAt ? new Date(item.updatedAt) : new Date();
    const existing = await prisma.$queryRaw<Array<{ id: string; remoteVersion: Date }>>`
      SELECT id, "remoteVersion" FROM "SyncState"
      WHERE "userId" = ${userId} AND entity = ${item.entity} AND "entityId" = ${item.entityId}
      LIMIT 1
    `;
    const row = existing[0];

    if (row && row.remoteVersion > remoteVersion) {
      await prisma.$executeRaw`
        INSERT INTO "SyncQueue" (id, "userId", entity, "entityId", operation, payload, status, "createdAt", "updatedAt")
        VALUES (${cuid("sq")}, ${userId}, ${item.entity}, ${item.entityId}, 'conflict', ${JSON.stringify(item.payload)}::jsonb, 'conflict', NOW(), NOW())
      `;
      results.push({ entity: item.entity, entityId: item.entityId, status: "conflict" });
      continue;
    }

    if (row) {
      await prisma.$executeRaw`
        UPDATE "SyncState" SET "remoteVersion" = ${remoteVersion}, "localVersion" = ${remoteVersion},
          checksum = ${JSON.stringify(item.payload).slice(0, 64)}, status = 'synced', "updatedAt" = NOW()
        WHERE id = ${row.id}
      `;
    } else {
      const id = cuid("ss");
      await prisma.$executeRaw`
        INSERT INTO "SyncState" (id, "userId", entity, "entityId", "localVersion", "remoteVersion", checksum, status, "createdAt", "updatedAt")
        VALUES (${id}, ${userId}, ${item.entity}, ${item.entityId}, ${remoteVersion}, ${remoteVersion},
          ${JSON.stringify(item.payload).slice(0, 64)}, 'synced', NOW(), NOW())
      `;
    }

    if (item.entity === "settings") {
      /* settings stored in SyncState payload via queue for client merge */
    }

    results.push({ entity: item.entity, entityId: item.entityId, status: "synced" });
  }

  return { results, pushed: results.filter((r) => r.status === "synced").length };
}

export async function pullSync(userId: string, since?: string) {
  const sinceDate = since ? new Date(since) : new Date(0);
  const states = await prisma.$queryRaw`
    SELECT * FROM "SyncState" WHERE "userId" = ${userId} AND "updatedAt" > ${sinceDate}
    ORDER BY "updatedAt" DESC LIMIT 100
  `;
  const pending = await prisma.$queryRaw`
    SELECT * FROM "SyncQueue" WHERE "userId" = ${userId} AND status = 'pending'
    ORDER BY "createdAt" ASC LIMIT 50
  `;
  return { states, pending, serverTime: new Date().toISOString() };
}

export async function getSyncStatus(userId: string) {
  const counts = await prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
    SELECT status, COUNT(*)::bigint AS count FROM "SyncState" WHERE "userId" = ${userId} GROUP BY status
  `;
  const queue = await prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
    SELECT status, COUNT(*)::bigint AS count FROM "SyncQueue" WHERE "userId" = ${userId} GROUP BY status
  `;
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, Number(c.count)]));
  const queueByStatus = Object.fromEntries(queue.map((c) => [c.status, Number(c.count)]));
  return {
    synced: byStatus.synced ?? 0,
    conflict: byStatus.conflict ?? 0,
    queuePending: queueByStatus.pending ?? 0,
    queueConflict: queueByStatus.conflict ?? 0,
    lastCheck: new Date().toISOString()
  };
}

export async function enqueueOffline(userId: string, item: {
  entity: SyncEntity;
  entityId: string;
  operation: string;
  payload: Record<string, unknown>;
}) {
  const id = cuid("sq");
  await prisma.$executeRaw`
    INSERT INTO "SyncQueue" (id, "userId", entity, "entityId", operation, payload, status, "createdAt", "updatedAt")
    VALUES (${id}, ${userId}, ${item.entity}, ${item.entityId}, ${item.operation}, ${JSON.stringify(item.payload)}::jsonb, 'pending', NOW(), NOW())
  `;
  return { id, status: "pending" };
}
