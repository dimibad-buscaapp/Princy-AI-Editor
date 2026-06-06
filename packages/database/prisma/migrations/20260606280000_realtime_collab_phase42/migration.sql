CREATE TABLE IF NOT EXISTS "WorkspaceLock" (
  id TEXT PRIMARY KEY,
  "workspaceId" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userName" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  UNIQUE("workspaceId", "filePath")
);

CREATE INDEX IF NOT EXISTS "WorkspaceLock_workspaceId_idx" ON "WorkspaceLock"("workspaceId");
CREATE INDEX IF NOT EXISTS "WorkspaceLock_expiresAt_idx" ON "WorkspaceLock"("expiresAt");
