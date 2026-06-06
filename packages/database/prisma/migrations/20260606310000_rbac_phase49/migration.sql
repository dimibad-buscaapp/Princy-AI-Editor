CREATE TABLE IF NOT EXISTS "Policy" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  effect TEXT NOT NULL DEFAULT 'allow',
  actions JSONB NOT NULL,
  resources JSONB NOT NULL,
  conditions JSONB,
  "orgId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "CustomRole" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  policies JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  UNIQUE("orgId", slug)
);

CREATE TABLE IF NOT EXISTS "Group" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "roleIds" JSONB NOT NULL DEFAULT '[]',
  "memberIds" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  UNIQUE("orgId", slug)
);
