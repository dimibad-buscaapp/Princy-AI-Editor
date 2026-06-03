-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DEVELOPER', 'VIEWER');
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');
CREATE TYPE "AgentType" AS ENUM ('AUTO', 'PLANNER', 'CODER', 'REVIEWER', 'DEBUGGER', 'ARCHITECT', 'TERMINAL');
CREATE TYPE "AgentStatus" AS ENUM ('IDLE', 'RUNNING', 'FAILED', 'COMPLETED');
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'RUNNING', 'FAILED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "MemoryScope" AS ENUM ('USER', 'PROJECT', 'CONVERSATION', 'WORKSPACE');
CREATE TYPE "PatchStatus" AS ENUM ('PROPOSED', 'APPLIED', 'ROLLED_BACK', 'FAILED');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "AutonomousGoalStatus" AS ENUM ('PENDING', 'PLANNING', 'EXECUTING', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'DEVELOPER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Workspace_projectId_idx" ON "Workspace"("projectId");
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Conversation_projectId_idx" ON "Conversation"("projectId");
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");
CREATE INDEX "Message_role_idx" ON "Message"("role");
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AgentType" NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'IDLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Agent_type_idx" ON "Agent"("type");
CREATE INDEX "Agent_status_idx" ON "Agent"("status");

CREATE TABLE "AutonomousGoal" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "AutonomousGoalStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AutonomousGoal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AutonomousGoal_projectId_idx" ON "AutonomousGoal"("projectId");
CREATE INDEX "AutonomousGoal_status_idx" ON "AutonomousGoal"("status");
ALTER TABLE "AutonomousGoal" ADD CONSTRAINT "AutonomousGoal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "agentId" TEXT,
    "title" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB,
    "result" JSONB,
    "goalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Task_agentId_idx" ON "Task"("agentId");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_goalId_idx" ON "Task"("goalId");
ALTER TABLE "Task" ADD CONSTRAINT "Task_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "AutonomousGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AgentExecution" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "taskId" TEXT,
    "input" JSONB,
    "output" JSONB,
    "status" "TaskStatus" NOT NULL DEFAULT 'RUNNING',
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentExecution_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AgentExecution_agentId_idx" ON "AgentExecution"("agentId");
CREATE INDEX "AgentExecution_taskId_idx" ON "AgentExecution"("taskId");
CREATE INDEX "AgentExecution_status_idx" ON "AgentExecution"("status");
ALTER TABLE "AgentExecution" ADD CONSTRAINT "AgentExecution_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentExecution" ADD CONSTRAINT "AgentExecution_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "MemoryChunk" (
    "id" TEXT NOT NULL,
    "scope" "MemoryScope" NOT NULL DEFAULT 'PROJECT',
    "projectId" TEXT,
    "userId" TEXT,
    "conversationId" TEXT,
    "workspaceId" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "tags" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MemoryChunk_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MemoryChunk_projectId_scope_idx" ON "MemoryChunk"("projectId", "scope");
CREATE INDEX "MemoryChunk_conversationId_idx" ON "MemoryChunk"("conversationId");
CREATE INDEX "MemoryChunk_userId_idx" ON "MemoryChunk"("userId");
CREATE INDEX "MemoryChunk_workspaceId_idx" ON "MemoryChunk"("workspaceId");
ALTER TABLE "MemoryChunk" ADD CONSTRAINT "MemoryChunk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MemoryChunk" ADD CONSTRAINT "MemoryChunk_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MemoryChunk" ADD CONSTRAINT "MemoryChunk_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MemoryChunk" ADD CONSTRAINT "MemoryChunk_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "memoryChunkId" TEXT NOT NULL,
    "vectorUnsupported" TEXT,
    "model" TEXT NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Embedding_memoryChunkId_idx" ON "Embedding"("memoryChunkId");
CREATE INDEX "Embedding_model_idx" ON "Embedding"("model");
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_memoryChunkId_fkey" FOREIGN KEY ("memoryChunkId") REFERENCES "MemoryChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ContextNode" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ContextNode_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContextNode_projectId_idx" ON "ContextNode"("projectId");
CREATE INDEX "ContextNode_type_idx" ON "ContextNode"("type");
CREATE INDEX "ContextNode_path_idx" ON "ContextNode"("path");
ALTER TABLE "ContextNode" ADD CONSTRAINT "ContextNode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ContextEdge" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContextEdge_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContextEdge_sourceId_idx" ON "ContextEdge"("sourceId");
CREATE INDEX "ContextEdge_targetId_idx" ON "ContextEdge"("targetId");
CREATE INDEX "ContextEdge_relationship_idx" ON "ContextEdge"("relationship");
ALTER TABLE "ContextEdge" ADD CONSTRAINT "ContextEdge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContextNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContextEdge" ADD CONSTRAINT "ContextEdge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "ContextNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Patch" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "createdById" TEXT,
    "filePath" TEXT NOT NULL,
    "diff" TEXT NOT NULL,
    "status" "PatchStatus" NOT NULL DEFAULT 'PROPOSED',
    "backupPath" TEXT,
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Patch_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Patch_projectId_idx" ON "Patch"("projectId");
CREATE INDEX "Patch_status_idx" ON "Patch"("status");
ALTER TABLE "Patch" ADD CONSTRAINT "Patch_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Patch" ADD CONSTRAINT "Patch_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Patch" ADD CONSTRAINT "Patch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "PatchHistory" (
    "id" TEXT NOT NULL,
    "patchId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PatchHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PatchHistory_patchId_idx" ON "PatchHistory"("patchId");
ALTER TABLE "PatchHistory" ADD CONSTRAINT "PatchHistory_patchId_fkey" FOREIGN KEY ("patchId") REFERENCES "Patch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TerminalSession" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "cwd" TEXT,
    "history" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TerminalSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "goalId" TEXT,
    "patchId" TEXT,
    "type" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ApprovalRequest_goalId_idx" ON "ApprovalRequest"("goalId");
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "AutonomousGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
