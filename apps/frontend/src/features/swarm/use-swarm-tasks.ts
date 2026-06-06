"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "../../lib/api-client";

export type SwarmTask = {
  id: string;
  pipelineId: string;
  title: string;
  description?: string | null;
  agentRole: string;
  status: string;
  order: number;
  updatedAt: string;
};

export function useSwarmTasks() {
  const [tasks, setTasks] = useState<SwarmTask[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<{ tasks: SwarmTask[] }>("/swarm/tasks");
      setTasks(data.tasks ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (objective: string, title?: string) => {
    const data = await apiPost<{ pipelineId: string; tasks: SwarmTask[] }>("/swarm/task", {
      title: title ?? objective.slice(0, 80),
      objective
    });
    await refresh();
    return data;
  }, [refresh]);

  const runTask = useCallback(async (id: string) => {
    await apiPost(`/swarm/tasks/${id}/run`, {});
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 8000);
    return () => clearInterval(timer);
  }, [refresh]);

  return { tasks, loading, refresh, createTask, runTask };
}
