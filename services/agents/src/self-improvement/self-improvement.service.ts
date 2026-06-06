import { prisma } from "@princy/database";
import { getModelRouter } from "@princy/shared";

export type ModelScore = {
  modelId: string;
  taskType: string;
  runs: number;
  successRate: number;
  avgLatencyMs: number;
  score: number;
};

export type PatchStats = {
  proposed: number;
  applied: number;
  rejected: number;
  rolledBack: number;
  failed: number;
  acceptRate: number;
};

export type TaskStats = {
  total: number;
  completed: number;
  failed: number;
  successRate: number;
  avgDurationMs: number;
};

export type AgentEfficiency = {
  agentRole: string;
  total: number;
  success: number;
  failure: number;
  successRate: number;
  avgDurationMs: number;
};

export type SelfImprovementStats = {
  modelScores: ModelScore[];
  patchStats: PatchStats;
  taskStats: TaskStats;
  swarmStats: TaskStats;
  agentEfficiency: AgentEfficiency[];
  recommendations: string[];
  routerHints: Array<{ taskType: string; suggestedModel: string; reason: string }>;
};

function computeScore(successRate: number, avgLatencyMs: number, runs: number) {
  const latencyNorm = avgLatencyMs > 0 ? Math.min(1, 3000 / avgLatencyMs) : 0.5;
  const volumeBoost = Math.min(1, runs / 20);
  return Math.round((successRate * 0.6 + latencyNorm * 0.3 + volumeBoost * 0.1) * 100);
}

export async function getSelfImprovementStats(): Promise<SelfImprovementStats> {
  const [modelRows, patchRows, historyRows, executionRows, swarmRows, memoryRows] = await Promise.all([
    prisma.$queryRaw<
      Array<{ modelId: string; task: string; runs: bigint; avgMs: number | null; cacheHits: bigint }>
    >`
      SELECT "modelId", task, COUNT(*)::bigint AS runs,
        ROUND(AVG("totalMs"))::float AS "avgMs",
        SUM(CASE WHEN "cacheHit" THEN 1 ELSE 0 END)::bigint AS "cacheHits"
      FROM "ModelMetric"
      GROUP BY "modelId", task
      ORDER BY runs DESC
      LIMIT 30
    `,
    prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
      SELECT status::text, COUNT(*)::bigint AS count FROM "Patch" GROUP BY status
    `,
    prisma.$queryRaw<Array<{ action: string; count: bigint }>>`
      SELECT action, COUNT(*)::bigint AS count FROM "PatchHistory" GROUP BY action
    `,
    prisma.$queryRaw<Array<{ status: string; count: bigint; avgMs: number | null }>>`
      SELECT status::text, COUNT(*)::bigint AS count, ROUND(AVG("durationMs"))::float AS "avgMs"
      FROM "AgentExecution" GROUP BY status
    `,
    prisma.$queryRaw<Array<{ status: string; count: bigint; avgMs: number | null }>>`
      SELECT status::text, COUNT(*)::bigint AS count, ROUND(AVG("durationMs"))::float AS "avgMs"
      FROM "SwarmRun" GROUP BY status
    `,
    prisma.$queryRaw<
      Array<{ agentRole: string; total: bigint; success: bigint; avgMs: number | null }>
    >`
      SELECT "agentRole", COUNT(*)::bigint AS total,
        SUM(CASE WHEN success THEN 1 ELSE 0 END)::bigint AS success,
        ROUND(AVG("durationMs"))::float AS "avgMs"
      FROM "AgentMemory"
      GROUP BY "agentRole"
      ORDER BY total DESC
      LIMIT 12
    `
  ]);

  const memorySuccessByModel = await prisma.$queryRaw<
    Array<{ modelId: string; success: bigint; total: bigint }>
  >`
    SELECT COALESCE(metadata->>'modelId', 'unknown') AS "modelId",
      SUM(CASE WHEN success THEN 1 ELSE 0 END)::bigint AS success,
      COUNT(*)::bigint AS total
    FROM "AgentMemory"
    WHERE metadata->>'modelId' IS NOT NULL
    GROUP BY metadata->>'modelId'
  `.catch(() => [] as Array<{ modelId: string; success: bigint; total: bigint }>);

  const successMap = new Map(
    memorySuccessByModel.map((r) => [r.modelId, Number(r.success) / Math.max(1, Number(r.total))])
  );

  const modelScores: ModelScore[] = modelRows.map((r) => {
    const runs = Number(r.runs);
    const successRate = successMap.get(r.modelId) ?? 0.85;
    const avgLatencyMs = Math.round(r.avgMs ?? 0);
    return {
      modelId: r.modelId,
      taskType: r.task,
      runs,
      successRate: Math.round(successRate * 1000) / 10,
      avgLatencyMs,
      score: computeScore(successRate, avgLatencyMs, runs)
    };
  });

  const patchByStatus = Object.fromEntries(patchRows.map((r) => [r.status, Number(r.count)]));
  const historyByAction = Object.fromEntries(historyRows.map((r) => [r.action, Number(r.count)]));
  const rejected = (historyByAction.rejected ?? 0) + (patchByStatus.ROLLED_BACK ?? 0);
  const applied = patchByStatus.APPLIED ?? historyByAction.applied ?? 0;
  const decided = applied + rejected;
  const patchStats: PatchStats = {
    proposed: patchByStatus.PROPOSED ?? 0,
    applied,
    rejected,
    rolledBack: patchByStatus.ROLLED_BACK ?? 0,
    failed: patchByStatus.FAILED ?? 0,
    acceptRate: decided > 0 ? Math.round((applied / decided) * 1000) / 10 : 0
  };

  const execByStatus = Object.fromEntries(executionRows.map((r) => [r.status, Number(r.count)]));
  const execCompleted = execByStatus.COMPLETED ?? 0;
  const execFailed = execByStatus.FAILED ?? 0;
  const execTotal = execCompleted + execFailed + (execByStatus.RUNNING ?? 0) + (execByStatus.PENDING ?? 0);
  const execAvg = executionRows.find((r) => r.status === "COMPLETED")?.avgMs ?? 0;

  const taskStats: TaskStats = {
    total: execTotal,
    completed: execCompleted,
    failed: execFailed,
    successRate: execTotal > 0 ? Math.round((execCompleted / execTotal) * 1000) / 10 : 0,
    avgDurationMs: Math.round(execAvg ?? 0)
  };

  const swarmByStatus = Object.fromEntries(swarmRows.map((r) => [r.status, Number(r.count)]));
  const swarmCompleted = swarmByStatus.COMPLETED ?? 0;
  const swarmFailed = swarmByStatus.FAILED ?? 0;
  const swarmTotal =
    swarmCompleted + swarmFailed + (swarmByStatus.RUNNING ?? 0) + (swarmByStatus.PENDING ?? 0) + (swarmByStatus.CANCELLED ?? 0);
  const swarmAvg = swarmRows.find((r) => r.status === "COMPLETED")?.avgMs ?? 0;

  const swarmStats: TaskStats = {
    total: swarmTotal,
    completed: swarmCompleted,
    failed: swarmFailed,
    successRate: swarmTotal > 0 ? Math.round((swarmCompleted / swarmTotal) * 1000) / 10 : 0,
    avgDurationMs: Math.round(swarmAvg ?? 0)
  };

  const agentEfficiency: AgentEfficiency[] = memoryRows.map((r) => {
    const total = Number(r.total);
    const success = Number(r.success);
    return {
      agentRole: r.agentRole,
      total,
      success,
      failure: total - success,
      successRate: total > 0 ? Math.round((success / total) * 1000) / 10 : 0,
      avgDurationMs: Math.round(r.avgMs ?? 0)
    };
  });

  const routerOutcomes = getModelRouter().getOutcomeScores();
  const recommendations: string[] = [];
  const routerHints: SelfImprovementStats["routerHints"] = [];

  if (patchStats.acceptRate > 0 && patchStats.acceptRate < 60) {
    recommendations.push("Taxa de aceitação de patches baixa — revisar prompts do DeveloperAgent.");
  }
  if (taskStats.successRate > 0 && taskStats.successRate < 70) {
    recommendations.push("Taxa de sucesso de tarefas abaixo de 70% — considerar modelo reasoning para steps críticos.");
  }
  if (swarmStats.failed > 0 && swarmStats.successRate < 80) {
    recommendations.push("Swarm com falhas recentes — verificar erros recorrentes em Agent Memory.");
  }

  const bestByTask = new Map<string, ModelScore>();
  for (const m of modelScores) {
    const prev = bestByTask.get(m.taskType);
    if (!prev || m.score > prev.score) bestByTask.set(m.taskType, m);
  }

  for (const [taskType, best] of bestByTask) {
    if (best.runs >= 3) {
      routerHints.push({
        taskType,
        suggestedModel: best.modelId,
        reason: `score ${best.score} (${best.successRate}% sucesso, ${best.avgLatencyMs}ms)`
      });
      recommendations.push(`Para ${taskType}, modelo sugerido: ${best.modelId} (score ${best.score}).`);
    }
  }

  for (const [taskType, outcome] of Object.entries(routerOutcomes)) {
    if (outcome.runs >= 5 && outcome.successRate < 0.5) {
      recommendations.push(`Router: ${taskType} com baixa taxa de sucesso (${Math.round(outcome.successRate * 100)}%) — trocar slot.`);
    }
  }

  return {
    modelScores,
    patchStats,
    taskStats,
    swarmStats,
    agentEfficiency,
    recommendations: recommendations.slice(0, 8),
    routerHints
  };
}
