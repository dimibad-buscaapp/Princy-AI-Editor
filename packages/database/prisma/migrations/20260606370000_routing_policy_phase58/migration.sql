CREATE TABLE IF NOT EXISTS "RoutingPolicy" (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "preferLocal" BOOLEAN NOT NULL DEFAULT true,
  "cloudFallback" BOOLEAN NOT NULL DEFAULT false,
  "primaryProvider" TEXT NOT NULL DEFAULT 'ollama',
  rules JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  UNIQUE("projectId")
);
