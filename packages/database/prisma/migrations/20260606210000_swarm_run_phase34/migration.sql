-- Fase 34: SwarmRun for multi-agent orchestration
CREATE TABLE "SwarmRun" (
    "id" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "context" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "currentAgent" "SwarmAgentRole",
    "progress" INTEGER NOT NULL DEFAULT 0,
    "pipelineId" TEXT NOT NULL,
    "artifacts" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SwarmRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SwarmRun_pipelineId_key" ON "SwarmRun"("pipelineId");
CREATE INDEX "SwarmRun_status_idx" ON "SwarmRun"("status");
CREATE INDEX "SwarmRun_createdAt_idx" ON "SwarmRun"("createdAt");
