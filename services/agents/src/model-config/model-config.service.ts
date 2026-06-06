import { OllamaClient } from "@princy/ai-client";
import { prisma } from "@princy/database";
import {
  getAiRouter,
  reloadOverrides,
  routeModel,
  TASK_DEFAULTS,
  type ModelSlot,
  type ModelTask
} from "@princy/model-router";
import { getModelRouter, type RequestType } from "@princy/shared";

const SLOT_TASKS: Record<ModelSlot, ModelTask[]> = {
  CHAT: ["CHAT", "INLINE_CHAT"],
  EDITOR: ["GHOST_TEXT", "EDITOR_ASSISTANT"],
  SWARM: ["ARCHITECT"],
  AUTONOMOUS: ["AUTONOMOUS"],
  EMBED: ["MEMORY"]
};

const DEFAULT_ASSIGNMENTS: Record<ModelSlot, string> = {
  CHAT: TASK_DEFAULTS.CHAT,
  EDITOR: TASK_DEFAULTS.EDITOR_ASSISTANT,
  SWARM: TASK_DEFAULTS.ARCHITECT,
  AUTONOMOUS: TASK_DEFAULTS.AUTONOMOUS,
  EMBED: TASK_DEFAULTS.MEMORY
};

type AssignmentRow = { slot: ModelSlot; modelId: string; updatedAt: Date };

export class ModelConfigService {
  private readonly ollama = new OllamaClient();

  private async fetchAssignments(): Promise<AssignmentRow[]> {
    return prisma.$queryRaw<AssignmentRow[]>`
      SELECT slot::text AS slot, "modelId", "updatedAt"
      FROM "ModelAssignment"
      ORDER BY slot ASC
    `;
  }

  async load() {
    const rows = await this.fetchAssignments();
    const overrides: Partial<Record<ModelSlot, string>> = {};
    for (const row of rows) {
      overrides[row.slot] = row.modelId;
    }
    reloadOverrides(overrides);
  }

  async ensureDefaults() {
    for (const [slot, modelId] of Object.entries(DEFAULT_ASSIGNMENTS)) {
      await prisma.$executeRaw`
        INSERT INTO "ModelAssignment" (slot, "modelId", "updatedAt")
        VALUES (${slot}::"ModelSlot", ${modelId}, NOW())
        ON CONFLICT (slot) DO NOTHING
      `;
    }
    await this.load();
  }

  async getInstalledModels(): Promise<string[]> {
    try {
      const res = await fetch(`${process.env.OLLAMA_BASE_URL ?? process.env.OLLAMA_URL ?? "http://127.0.0.1:11434"}/api/tags`);
      if (!res.ok) return [];
      const data = (await res.json()) as { models?: { name: string }[] };
      return (data.models ?? []).map((m) => m.name);
    } catch {
      return [];
    }
  }

  async getConfig() {
    const [assignments, installed] = await Promise.all([
      this.fetchAssignments(),
      this.getInstalledModels()
    ]);

    return {
      assignments: assignments.map((a) => ({
        slot: a.slot,
        modelId: a.modelId,
        tasks: SLOT_TASKS[a.slot] ?? [],
        updatedAt: a.updatedAt.toISOString()
      })),
      installed,
      resolved: {
        CHAT: routeModel("CHAT"),
        EDITOR: routeModel("EDITOR_ASSISTANT"),
        SWARM: routeModel("ARCHITECT"),
        AUTONOMOUS: routeModel("AUTONOMOUS"),
        EMBED: routeModel("MEMORY")
      }
    };
  }

  async updateSlot(slot: ModelSlot, modelId: string, updatedBy?: string) {
    const installed = await this.getInstalledModels();
    if (installed.length > 0 && !installed.includes(modelId)) {
      throw new Error(`Modelo "${modelId}" não encontrado no Ollama`);
    }

    await prisma.$executeRaw`
      INSERT INTO "ModelAssignment" (slot, "modelId", "updatedAt", "updatedBy")
      VALUES (${slot}::"ModelSlot", ${modelId}, NOW(), ${updatedBy ?? null})
      ON CONFLICT (slot) DO UPDATE SET
        "modelId" = EXCLUDED."modelId",
        "updatedAt" = NOW(),
        "updatedBy" = EXCLUDED."updatedBy"
    `;
    await this.load();
    return this.getConfig();
  }

  async recordMetric(metric: {
    modelId: string;
    task: ModelTask;
    ttftMs: number;
    totalMs: number;
    tokenCount: number;
    tokensPerSec: number;
    cacheHit?: boolean;
    requestType?: RequestType;
  }) {
    const router = getAiRouter();
    router.recordStreamRun(metric);

    const requestType = metric.requestType ?? taskToRequestType(metric.task);
    getModelRouter().recordResponseTime(
      requestType,
      metric.modelId,
      metric.totalMs,
      metric.cacheHit
    );

    const id = `mm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await prisma.$executeRaw`
      INSERT INTO "ModelMetric" (id, "modelId", task, "ttftMs", "totalMs", "tokenCount", "tokensPerSec", "cacheHit", "createdAt")
      VALUES (${id}, ${metric.modelId}, ${metric.task}, ${metric.ttftMs}, ${metric.totalMs}, ${metric.tokenCount}, ${metric.tokensPerSec}, ${metric.cacheHit ?? false}, NOW())
    `.catch((err) => {
      console.warn({ err }, "model metric persistence failed");
    });
  }

  async getMetrics(limit = 50) {
    const router = getAiRouter();
    const [recent, aggregates] = await Promise.all([
      prisma.$queryRaw<
        {
          id: string;
          modelId: string;
          task: string;
          ttftMs: number;
          totalMs: number;
          tokenCount: number;
          tokensPerSec: number;
          createdAt: Date;
        }[]
      >`
        SELECT id, "modelId", task, "ttftMs", "totalMs", "tokenCount", "tokensPerSec", "createdAt"
        FROM "ModelMetric"
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `,
      prisma.$queryRaw<{ ttftMs: number | null; totalMs: number | null; tokensPerSec: number | null; runs: bigint }[]>`
        SELECT
          AVG("ttftMs")::float AS "ttftMs",
          AVG("totalMs")::float AS "totalMs",
          AVG("tokensPerSec")::float AS "tokensPerSec",
          COUNT(*)::bigint AS runs
        FROM "ModelMetric"
      `
    ]);

    const memoryAggregates = router.getStreamAggregates();
    const agg = aggregates[0];

    return {
      recent: recent.map((m) => ({
        id: m.id,
        modelId: m.modelId,
        task: m.task,
        ttftMs: m.ttftMs,
        totalMs: m.totalMs,
        tokenCount: m.tokenCount,
        tokensPerSec: m.tokensPerSec,
        at: m.createdAt.toISOString()
      })),
      aggregates: {
        ttftMs: Math.round(agg?.ttftMs ?? memoryAggregates.ttftMs),
        totalMs: Math.round(agg?.totalMs ?? memoryAggregates.totalMs),
        tokensPerSec: Math.round((agg?.tokensPerSec ?? memoryAggregates.tokensPerSec) * 10) / 10,
        runs: Number(agg?.runs ?? memoryAggregates.runs)
      },
      memory: router.getStreamMetrics(limit)
    };
  }
}

function taskToRequestType(task: ModelTask): RequestType {
  switch (task) {
    case "GHOST_TEXT":
      return "ghost_text";
    case "EDITOR_ASSISTANT":
      return "refactor";
    case "ARCHITECT":
      return "architect";
    case "AUTONOMOUS":
      return "autonomous";
    case "INLINE_CHAT":
    case "CHAT":
    case "MEMORY":
    default:
      return "chat_simple";
  }
}

let shared: ModelConfigService | null = null;

export function getModelConfigService() {
  if (!shared) shared = new ModelConfigService();
  return shared;
}
