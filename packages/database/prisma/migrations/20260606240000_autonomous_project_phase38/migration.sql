-- Fase 38: Autonomous Projects
CREATE TABLE IF NOT EXISTS "AutonomousProject" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  description TEXT,
  "projectId" TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  milestones JSONB,
  blockers JSONB,
  "currentMilestone" INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "AutonomousProjectRun" (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES "AutonomousProject"(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  result JSONB,
  error TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AutonomousProject_status_idx" ON "AutonomousProject"(status);
CREATE INDEX IF NOT EXISTS "AutonomousProject_projectId_idx" ON "AutonomousProject"("projectId");
CREATE INDEX IF NOT EXISTS "AutonomousProjectRun_projectId_idx" ON "AutonomousProjectRun"("projectId");
