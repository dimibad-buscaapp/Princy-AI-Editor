-- CreateEnum
CREATE TYPE "ModelSlot" AS ENUM ('CHAT', 'EDITOR', 'SWARM', 'AUTONOMOUS', 'EMBED');

-- CreateTable
CREATE TABLE "ModelAssignment" (
    "slot" "ModelSlot" NOT NULL,
    "modelId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ModelAssignment_pkey" PRIMARY KEY ("slot")
);

-- CreateTable
CREATE TABLE "ModelMetric" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "ttftMs" INTEGER NOT NULL,
    "totalMs" INTEGER NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "tokensPerSec" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModelMetric_modelId_createdAt_idx" ON "ModelMetric"("modelId", "createdAt");

-- CreateIndex
CREATE INDEX "ModelMetric_task_createdAt_idx" ON "ModelMetric"("task", "createdAt");

-- Seed default model assignments
INSERT INTO "ModelAssignment" ("slot", "modelId", "updatedAt") VALUES
  ('CHAT', 'qwen2.5:3b', CURRENT_TIMESTAMP),
  ('EDITOR', 'qwen2.5:3b', CURRENT_TIMESTAMP),
  ('SWARM', 'deepseek-r1:8b', CURRENT_TIMESTAMP),
  ('AUTONOMOUS', 'deepseek-r1:8b', CURRENT_TIMESTAMP),
  ('EMBED', 'nomic-embed-text', CURRENT_TIMESTAMP);
