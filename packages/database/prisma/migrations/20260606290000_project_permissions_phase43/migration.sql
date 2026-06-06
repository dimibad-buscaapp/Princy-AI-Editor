CREATE TABLE IF NOT EXISTS "ProjectPermission" (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  capability TEXT NOT NULL,
  "grantedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  UNIQUE("projectId", "userId", capability)
);

CREATE INDEX IF NOT EXISTS "ProjectPermission_projectId_idx" ON "ProjectPermission"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectPermission_userId_idx" ON "ProjectPermission"("userId");
