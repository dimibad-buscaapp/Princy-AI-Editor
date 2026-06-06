import { prisma } from "@princy/database";

export type AuditRecord = {
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

function cuid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function recordAudit(record: AuditRecord) {
  const id = cuid("audit");
  await prisma.$executeRaw`
    INSERT INTO "AuditLog" (id, "actorId", action, entity, "entityId", metadata, "createdAt")
    VALUES (
      ${id},
      ${record.actorId ?? null},
      ${record.action},
      ${record.entity},
      ${record.entityId ?? null},
      ${record.metadata ? JSON.stringify(record.metadata) : null}::jsonb,
      NOW()
    )
  `;
  return { id, ...record, createdAt: new Date().toISOString() };
}
