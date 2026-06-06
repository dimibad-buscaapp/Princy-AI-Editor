-- Fase 35: Agent Memory extensions
CREATE TYPE "AgentMemoryKind" AS ENUM ('decision', 'error', 'preference', 'context');

ALTER TABLE "AgentMemory" ADD COLUMN IF NOT EXISTS "kind" "AgentMemoryKind" NOT NULL DEFAULT 'decision';
ALTER TABLE "AgentMemory" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE "AgentMemory" ADD COLUMN IF NOT EXISTS "content" TEXT;
ALTER TABLE "AgentMemory" ADD COLUMN IF NOT EXISTS "recurrenceKey" TEXT;

CREATE INDEX IF NOT EXISTS "AgentMemory_projectId_idx" ON "AgentMemory"("projectId");
CREATE INDEX IF NOT EXISTS "AgentMemory_kind_idx" ON "AgentMemory"("kind");
CREATE INDEX IF NOT EXISTS "AgentMemory_recurrenceKey_idx" ON "AgentMemory"("recurrenceKey");
