ALTER TYPE "MemoryScope" ADD VALUE IF NOT EXISTS 'TEAM';

ALTER TABLE "MemoryChunk" ADD COLUMN IF NOT EXISTS "teamId" TEXT;
CREATE INDEX IF NOT EXISTS "MemoryChunk_teamId_scope_idx" ON "MemoryChunk"("teamId", scope);
