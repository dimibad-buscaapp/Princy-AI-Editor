-- Fase 39: Cloud Sync
CREATE TABLE IF NOT EXISTS "SyncState" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  entity TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "localVersion" TIMESTAMP(3) NOT NULL,
  "remoteVersion" TIMESTAMP(3) NOT NULL,
  checksum TEXT,
  status TEXT NOT NULL DEFAULT 'synced',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "SyncQueue" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  entity TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload JSONB NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "SyncState_user_entity_idx" ON "SyncState"("userId", entity, "entityId");
CREATE INDEX IF NOT EXISTS "SyncQueue_userId_status_idx" ON "SyncQueue"("userId", status);
CREATE INDEX IF NOT EXISTS "SyncQueue_createdAt_idx" ON "SyncQueue"("createdAt");
