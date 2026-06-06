"use client";

import { useCallback, useEffect, useState } from "react";
import { eventsStreamUrl } from "../../lib/api";
import { apiFetch } from "../../lib/api-client";
import { gatewayUrl } from "../../lib/api";
import type { SwarmArtifact, SwarmRunDetail } from "./use-swarm-run";

export type SwarmHudStep = {
  role: string;
  status: "idle" | "busy" | "done" | "error";
  model: string;
  lastAction: string;
  durationMs?: number;
  current?: boolean;
  artifacts?: SwarmArtifact[];
  artifactSummary?: string;
  startedAt?: number;
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

function parseOutput(output: unknown): { text?: string; artifacts?: SwarmArtifact[] } {
  if (!output) return {};
  if (typeof output === "string") {
    try {
      return JSON.parse(output) as { text?: string; artifacts?: SwarmArtifact[] };
    } catch {
      return { text: output };
    }
  }
  if (typeof output === "object") return output as { text?: string; artifacts?: SwarmArtifact[] };
  return { text: String(output) };
}

function mapTaskStatus(status?: string): SwarmHudStep["status"] {
  if (status === "RUNNING") return "busy";
  if (status === "COMPLETED" || status === "DONE") return "done";
  if (status === "FAILED" || status === "CANCELLED") return "error";
  return "idle";
}

export function useSwarmHud(activeRunDetail?: SwarmRunDetail | null) {
  const [steps, setSteps] = useState<SwarmHudStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [swarmModel, setSwarmModel] = useState("deepseek-r1:8b");
  const [progress, setProgress] = useState(0);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [liveRole, setLiveRole] = useState<string | null>(null);

  const buildFromRun = useCallback(
    (detail: SwarmRunDetail, model: string) => {
      setProgress(detail.run.progress ?? 0);
      setCurrentAgent(detail.run.currentAgent ?? null);

      const mapped: SwarmHudStep[] = PIPELINE.map((role) => {
        const step = detail.steps.find((s) => s.agentRole?.toUpperCase() === role);
        const parsed = parseOutput(step?.output);
        const artifacts = parsed.artifacts ?? [];
        const isCurrent =
          detail.run.currentAgent?.toUpperCase() === role ||
          liveRole?.toUpperCase() === role ||
          step?.status === "RUNNING";

        const created = step?.createdAt ? new Date(step.createdAt).getTime() : undefined;
        const updated = step?.updatedAt ? new Date(step.updatedAt).getTime() : undefined;

        return {
          role,
          status: isCurrent && step?.status === "RUNNING" ? "busy" : mapTaskStatus(step?.status),
          model,
          lastAction: parsed.text?.slice(0, 80) ?? step?.status ?? FALLBACK_ACTIONS[role],
          durationMs: created && updated ? updated - created : detail.run.durationMs ?? undefined,
          current: isCurrent,
          artifacts,
          artifactSummary: artifacts[0]?.content?.slice(0, 120) ?? parsed.text?.slice(0, 120),
          startedAt: step?.status === "RUNNING" ? Date.now() : undefined
        };
      });

      setSteps(mapped);
    },
    [liveRole]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const healthRes = await fetch(gatewayUrl("/api/system/health")).then((r) => r.json()) as {
        models?: { swarm?: string };
      };
      const model = healthRes.models?.swarm ?? "deepseek-r1:8b";
      setSwarmModel(model);

      if (activeRunDetail) {
        buildFromRun(activeRunDetail, model);
        return;
      }

      const [statusRes, tasksRes] = await Promise.allSettled([
        apiFetch<{ agents: { role: string; status: string; logs?: string[] }[] }>("/agents/status"),
        apiFetch<{ tasks: { agentRole: string; status: string; output?: unknown; updatedAt?: string; createdAt?: string }[] }>(
          "/swarm/tasks"
        )
      ]);

      const agents = statusRes.status === "fulfilled" ? statusRes.value.agents : [];
      const tasks = tasksRes.status === "fulfilled" ? tasksRes.value.tasks : [];

      const mapped: SwarmHudStep[] = PIPELINE.map((role) => {
        const agent = agents.find((a) => a.role.toUpperCase() === role);
        const task = tasks
          .filter((t) => t.agentRole?.toUpperCase() === role)
          .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime())[0];

        const parsed = parseOutput(task?.output);
        const artifacts = parsed.artifacts ?? [];
        let status: SwarmHudStep["status"] = "idle";
        if (agent?.status === "busy" || task?.status === "RUNNING") status = "busy";
        else status = mapTaskStatus(task?.status);

        const created = task?.createdAt ? new Date(task.createdAt).getTime() : 0;
        const updated = task?.updatedAt ? new Date(task.updatedAt).getTime() : 0;

        return {
          role,
          status,
          model,
          lastAction: agent?.logs?.[0] ?? parsed.text?.slice(0, 60) ?? task?.status ?? FALLBACK_ACTIONS[role],
          durationMs: created && updated ? updated - created : undefined,
          artifacts,
          artifactSummary: artifacts[0]?.content?.slice(0, 120) ?? parsed.text?.slice(0, 120),
          current: status === "busy"
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
  }, [activeRunDetail, buildFromRun]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), activeRunDetail?.run.status === "RUNNING" ? 3000 : 12000);
    return () => clearInterval(id);
  }, [refresh, activeRunDetail?.run.status]);

  useEffect(() => {
    const source = new EventSource(eventsStreamUrl());
    source.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as { name?: string; payload?: { role?: string } };
        const name = event.name ?? "";
        if (name === "neural.step.started" && event.payload?.role) {
          setLiveRole(event.payload.role);
        }
        if (name === "neural.step.completed" || name === "neural.step.failed" || name === "swarm.completed") {
          setLiveRole(null);
          void refresh();
        }
      } catch {
        /* ignore */
      }
    };
    return () => source.close();
  }, [refresh]);

  return { steps, swarmModel, loading, progress, currentAgent, refresh };
}
