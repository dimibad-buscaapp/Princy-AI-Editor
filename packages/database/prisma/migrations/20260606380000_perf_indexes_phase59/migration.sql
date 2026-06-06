CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt");
CREATE INDEX IF NOT EXISTS "SwarmRun_status_createdAt_idx" ON "SwarmRun"(status, "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_entity_idx" ON "AuditLog"("createdAt", entity);
CREATE INDEX IF NOT EXISTS "InstalledItem_userId_createdAt_idx" ON "InstalledItem"("userId", "createdAt");
