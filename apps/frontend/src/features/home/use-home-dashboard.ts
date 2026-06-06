"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api-client";
import { gatewayUrl } from "../../lib/api";

export type RouterStats = {
  totalRequests: number;
  qwen25Requests: number;
  qwen3Requests: number;
  deepseekRequests: number;
  avgResponseTime: number;
  mostUsedModel?: string;
  cacheHitRatio?: number;
};

export type HomeDashboardData = {
  models: { chat: string; editor: string; swarm: string; autonomous: string; embed: string };
  router: RouterStats | null;
  swarm: { activeAgents: string; successRate: number; avgTime: string } | null;
  memory: { entries: number; totalHits: number } | null;
  servicesHealthy: number;
  servicesTotal: number;
  loading: boolean;
  error: string | null;
};

const DEFAULT_MODELS = {
  chat: "qwen2.5:3b",
  editor: "qwen3:8b",
  swarm: "deepseek-r1:8b",
  autonomous: "deepseek-r1:8b",
  embed: "nomic-embed-text"
};

export function useHomeDashboard() {
  const [data, setData] = useState<HomeDashboardData>({
    models: DEFAULT_MODELS,
    router: null,
    swarm: null,
    memory: null,
    servicesHealthy: 0,
    servicesTotal: 0,
    loading: true,
    error: null
  });

  const refresh = useCallback(async () => {
    setData((d) => ({ ...d, loading: true, error: null }));
    const started = performance.now();

    const [healthRes, routerRes, swarmRes, memoryRes] = await Promise.allSettled([
      fetch(gatewayUrl("/api/system/health")).then((r) => r.json()) as Promise<{
        services?: { ok: boolean }[];
        summary?: { healthy: number; total: number };
        models?: Partial<HomeDashboardData["models"]>;
      }>,
      apiFetch<RouterStats>("/router/stats"),
      apiFetch<{ activeAgents: string; successRate: number; avgTime: string }>("/agents/metrics"),
      apiFetch<{ entries: number; totalHits: number }>("/memory/cache/stats")
    ]);

    const latencyMs = Math.round(performance.now() - started);

    let error: string | null = null;
    if (healthRes.status === "rejected") error = "Health indisponível";

    const health = healthRes.status === "fulfilled" ? healthRes.value : null;
    const router = routerRes.status === "fulfilled" ? routerRes.value : null;
    const swarm = swarmRes.status === "fulfilled" ? swarmRes.value : null;
    const memory = memoryRes.status === "fulfilled" ? memoryRes.value : null;

    setData({
      models: { ...DEFAULT_MODELS, ...health?.models },
      router,
      swarm: swarm
        ? { activeAgents: swarm.activeAgents, successRate: swarm.successRate, avgTime: swarm.avgTime }
        : null,
      memory,
      servicesHealthy: health?.summary?.healthy ?? health?.services?.filter((s) => s.ok).length ?? 0,
      servicesTotal: health?.summary?.total ?? health?.services?.length ?? 0,
      loading: false,
      error,
      ...(latencyMs > 0 ? {} : {})
    });
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 20000);
    return () => clearInterval(id);
  }, [refresh]);

  return { ...data, refresh };
}
