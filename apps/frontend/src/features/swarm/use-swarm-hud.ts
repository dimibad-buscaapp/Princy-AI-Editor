"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api-client";
import { gatewayUrl } from "../../lib/api";

export type SwarmHudStep = {
  role: string;
  status: "idle" | "busy" | "done" | "error";
  model: string;
  lastAction: string;
  durationMs?: number;
  artifact?: string;
};

const PIPELINE = ["COORDINATOR", "ARCHITECT", "DEVELOPER", "TESTER", "REVIEWER", "DEVOPS"] as const;

const FALLBACK_ACTIONS: Record<string, string> = {
  COORDINATOR: "Aguardando objetivo",
  ARCHITECT: "Planejamento de arquitetura",
  DEVELOPER: "Implementação de código",
  TESTER: "Geração de testes",
  REVIEWER: "Revisão de qualidade",
  DEVOPS: "Deploy e diagnóstico"
};

export function useSwarmHud() {
  const [steps, setSteps] = useState<SwarmHudStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [swarmModel, setSwarmModel] = useState("deepseek-r1:8b");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, statusRes, tasksRes] = await Promise.allSettled([
        fetch(gatewayUrl("/api/system/health")).then((r) => r.json()) as Promise<{
          models?: { swarm?: string };
        }>,
        apiFetch<{ agents: { role: string; status: string; lastAction?: string }[] }>("/agents/status"),
        apiFetch<{ tasks: { agentRole: string; status: string; output?: string; updatedAt?: string; createdAt?: string }[] }>(
          "/swarm/tasks"
        )
      ]);

      const swarmModelId =
        healthRes.status === "fulfilled" ? (healthRes.value.models?.swarm ?? "deepseek-r1:8b") : "deepseek-r1:8b";
      setSwarmModel(swarmModelId);

      const agents = statusRes.status === "fulfilled" ? statusRes.value.agents : [];
      const tasks = tasksRes.status === "fulfilled" ? tasksRes.value.tasks : [];

      const mapped: SwarmHudStep[] = PIPELINE.map((role) => {
        const agent = agents.find((a) => a.role.toUpperCase() === role);
        const task = tasks
          .filter((t) => t.agentRole?.toUpperCase() === role)
          .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime())[0];

        let status: SwarmHudStep["status"] = "idle";
        if (agent?.status === "busy" || task?.status === "RUNNING") status = "busy";
        else if (task?.status === "COMPLETED" || task?.status === "DONE") status = "done";
        else if (task?.status === "FAILED" || task?.status === "CANCELLED") status = "error";

        const created = task?.createdAt ? new Date(task.createdAt).getTime() : 0;
        const updated = task?.updatedAt ? new Date(task.updatedAt).getTime() : 0;
        const durationMs = created && updated ? updated - created : undefined;

        return {
          role,
          status,
          model: swarmModelId,
          lastAction: agent?.lastAction ?? task?.status ?? FALLBACK_ACTIONS[role],
          durationMs,
          artifact: task?.output ? String(task.output).slice(0, 120) : undefined
        };
      });

      setSteps(mapped);
    } catch {
      setSteps(
        PIPELINE.map((role) => ({
          role,
          status: "idle" as const,
          model: "deepseek-r1:8b",
          lastAction: FALLBACK_ACTIONS[role]
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 12000);
    return () => clearInterval(id);
  }, [refresh]);

  return { steps, swarmModel, loading, refresh };
}
