-- Memory V2 + Swarm + Workspace Profile (Phases 25-30)

ALTER TYPE "MemoryScope" ADD VALUE IF NOT EXISTS 'AGENT';

CREATE TYPE "CodeMemoryKind" AS ENUM ('SYMBOL', 'ROUTE', 'ENDPOINT', 'PRISMA_MODEL', 'PACKAGE', 'FILE');
CREATE TYPE "SwarmAgentRole" AS ENUM ('COORDINATOR', 'ARCHITECT', 'DEVELOPER', 'TESTER', 'REVIEWER', 'DEVOPS');

CREATE TABLE "ProjectMemory" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT,
    "stack" JSONB,
    "services" JSONB,
    "ports" JSONB,
    "routes" JSONB,
    "recentChanges" JSONB,
    "pending" JSONB,
    "technicalDecisions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectMemory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectMemory_projectId_key" ON "ProjectMemory"("projectId");

CREATE TABLE "ConversationMemory" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "shortSummary" TEXT,
    "longSummary" TEXT,
    "userPreferences" JSONB,
    "lastSummarizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConversationMemory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConversationMemory_conversationId_key" ON "ConversationMemory"("conversationId");

CREATE TABLE "CodeMemory" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "filePath" TEXT NOT NULL,
    "kind" "CodeMemoryKind" NOT NULL,
    "symbol" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CodeMemory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CodeMemory_projectId_kind_idx" ON "CodeMemory"("projectId", "kind");
CREATE INDEX "CodeMemory_workspaceId_idx" ON "CodeMemory"("workspaceId");
CREATE INDEX "CodeMemory_filePath_idx" ON "CodeMemory"("filePath");

CREATE TABLE "AgentMemory" (
    "id" TEXT NOT NULL,
    "agentRole" TEXT NOT NULL,
    "taskId" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "durationMs" INTEGER,
    "decision" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentMemory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgentMemory_agentRole_idx" ON "AgentMemory"("agentRole");
CREATE INDEX "AgentMemory_taskId_idx" ON "AgentMemory"("taskId");

CREATE TABLE "ChatCacheEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "queryHash" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "ttlSeconds" INTEGER NOT NULL DEFAULT 86400,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ChatCacheEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChatCacheEntry_queryHash_projectId_key" ON "ChatCacheEntry"("queryHash", "projectId");
CREATE INDEX "ChatCacheEntry_expiresAt_idx" ON "ChatCacheEntry"("expiresAt");

CREATE TABLE "SwarmTask" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "parentTaskId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "agentRole" "SwarmAgentRole" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "input" JSONB,
    "output" JSONB,
    "logs" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SwarmTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SwarmTask_pipelineId_idx" ON "SwarmTask"("pipelineId");
CREATE INDEX "SwarmTask_parentTaskId_idx" ON "SwarmTask"("parentTaskId");
CREATE INDEX "SwarmTask_status_idx" ON "SwarmTask"("status");
CREATE INDEX "SwarmTask_agentRole_idx" ON "SwarmTask"("agentRole");

CREATE TABLE "WorkspaceProfile" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "framework" TEXT,
    "language" TEXT,
    "packageManager" TEXT,
    "services" JSONB,
    "ports" JSONB,
    "scripts" JSONB,
    "database" JSONB,
    "deployment" JSONB,
    "risks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkspaceProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceProfile_workspaceId_key" ON "WorkspaceProfile"("workspaceId");

CREATE TABLE "InstalledAgent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "version" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstalledAgent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstalledAgent_userId_agentId_key" ON "InstalledAgent"("userId", "agentId");
CREATE INDEX "InstalledAgent_userId_idx" ON "InstalledAgent"("userId");

ALTER TABLE "ModelMetric" ADD COLUMN IF NOT EXISTS "cacheHit" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ProjectMemory" ADD CONSTRAINT "ProjectMemory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationMemory" ADD CONSTRAINT "ConversationMemory_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CodeMemory" ADD CONSTRAINT "CodeMemory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CodeMemory" ADD CONSTRAINT "CodeMemory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChatCacheEntry" ADD CONSTRAINT "ChatCacheEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SwarmTask" ADD CONSTRAINT "SwarmTask_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "SwarmTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkspaceProfile" ADD CONSTRAINT "WorkspaceProfile_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
