"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, apiPost } from "../../lib/api-client";

export type SwarmArtifact = {
  type: string;
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
};

export type SwarmRun = {
  id: string;
  objective: string;
  context?: string | null;
  status: string;
  currentAgent?: string | null;
  progress: number;
  pipelineId: string;
  artifacts?: SwarmArtifact[] | null;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SwarmRunStep = {
  id: string;
  pipelineId: string;
  agentRole: string;
  status: string;
  order: number;
  output?: { text?: string; artifacts?: SwarmArtifact[] } | string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type SwarmRunDetail = {
  run: SwarmRun;
  steps: SwarmRunStep[];
};

export function useSwarmRun(activeRunId?: string | null) {
  const [runs, setRuns] = useState<SwarmRun[]>([]);
  const [activeRun, setActiveRun] = useState<SwarmRunDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const listRuns = useCallback(async () => {
    const data = await apiFetch<{ runs: SwarmRun[] }>("/swarm/runs", { query: { limit: 20 } });
    setRuns(data.runs ?? []);
    return data.runs ?? [];
  }, []);

  const getRun = useCallback(async (id: string) => {
    const data = await apiFetch<SwarmRunDetail>(`/swarm/runs/${id}`);
    setActiveRun(data);
    return data;
  }, []);

  const startRun = useCallback(async (objective: string, context?: string) => {
    setLoading(true);
    try {
      const data = await apiPost<{ run: SwarmRun }>("/swarm/run", { objective, context });
      await listRuns();
      if (data.run?.id) await getRun(data.run.id);
      return data.run;
    } finally {
      setLoading(false);
    }
  }, [getRun, listRuns]);

  const cancelRun = useCallback(
    async (id: string) => {
      await apiPost(`/swarm/runs/${id}/cancel`, {});
      await listRuns();
      if (activeRunId === id) await getRun(id);
    },
    [activeRunId, getRun, listRuns]
  );

  useEffect(() => {
    void listRuns();
  }, [listRuns]);

  useEffect(() => {
    if (!activeRunId) {
      setActiveRun(null);
      return;
    }
    void getRun(activeRunId);
  }, [activeRunId, getRun]);

  useEffect(() => {
    if (!activeRunId) return;
    const status = activeRun?.run.status;
    const isActive = status === "RUNNING" || status === "PENDING";
    const interval = setInterval(() => void getRun(activeRunId), isActive ? 3000 : 15000);
    return () => clearInterval(interval);
  }, [activeRunId, activeRun?.run.status, getRun]);

  const queue = runs.filter((r) => r.status === "PENDING" || r.status === "RUNNING");

  return {
    runs,
    queue,
    activeRun,
    loading,
    listRuns,
    getRun,
    startRun,
    cancelRun,
    setActiveRunId: (id: string | null) => {
      if (id) void getRun(id);
      else setActiveRun(null);
    }
  };
}
