-- Fase 37: Task Learning patterns
CREATE TABLE IF NOT EXISTS "TaskPattern" (
  id TEXT PRIMARY KEY,
  "patternKey" TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
  template JSONB,
  "lastPlan" JSONB,
  "projectId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "TaskPattern_category_idx" ON "TaskPattern"(category);
CREATE INDEX IF NOT EXISTS "TaskPattern_projectId_idx" ON "TaskPattern"("projectId");
CREATE INDEX IF NOT EXISTS "TaskPattern_occurrenceCount_idx" ON "TaskPattern"("occurrenceCount");
