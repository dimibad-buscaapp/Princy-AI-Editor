CREATE TABLE IF NOT EXISTS "WorkerNode" (
  id TEXT PRIMARY KEY,
  hostname TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  region TEXT,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  metadata JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "WorkerNode_status_idx" ON "WorkerNode"(status);
