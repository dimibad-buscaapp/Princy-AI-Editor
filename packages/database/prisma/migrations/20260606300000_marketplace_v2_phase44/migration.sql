CREATE TABLE IF NOT EXISTS "InstalledItem" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "itemType" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  version TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  UNIQUE("userId", "itemType", "itemId")
);

CREATE INDEX IF NOT EXISTS "InstalledItem_userId_itemType_idx" ON "InstalledItem"("userId", "itemType");

INSERT INTO "InstalledItem" (id, "userId", "itemType", "itemId", version, "createdAt")
SELECT 'ii_' || id, "userId", 'agent', "agentId", version, "createdAt"
FROM "InstalledAgent"
ON CONFLICT ("userId", "itemType", "itemId") DO NOTHING;
