"use client";

import { useCallback, useEffect, useState } from "react";
import { apiUrl, eventsStreamUrl } from "../../lib/api";
import { apiFetch } from "../../lib/api-client";
import { normalizeSwarmAgent } from "./swarm-data";

export type LiveAgent = {
  id: string;
  name: string;
  role: string;
  status: "online" | "busy" | "idle";
  tasks: number;
  success: number;
  x: number;
  y: number;
  featured?: boolean;
  compact?: boolean;
};

export type SwarmMetrics = {
  activeAgents: string;
  tasksToday: number;
  successRate: number;
  avgTime: string;
  tokens: string;
  latencyMs?: number;
  memory?: string;
  uptime?: string;
};

export function useSwarmStream() {
  const [agents, setAgents] = useState<LiveAgent[]>([]);
  const [metrics, setMetrics] = useState<SwarmMetrics | null>(null);
  const [activity, setActivity] = useState<{ text: string; time: string }[]>([]);
  const [pulse, setPulse] = useState(0);

  const refresh = useCallback(async () => {
    if (process.env.NODE_ENV === "development") {
      console.debug("[SWARM]", apiUrl("/agents/status"));
    }
    try {
      const [statusRes, metricsRes] = await Promise.all([
        apiFetch<{ agents: LiveAgent[] }>("/agents/status"),
        apiFetch<SwarmMetrics>("/agents/metrics")
      ]);
      setAgents(statusRes.agents.map((a) => normalizeSwarmAgent(a)));
      setMetrics(metricsRes);
      const busy = statusRes.agents.filter((a) => a.status === "busy").length;
      setPulse(busy);
    } catch {
      // keep last state
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 5000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const source = new EventSource(eventsStreamUrl());
    source.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as { name?: string; payload?: { role?: string } };
        const name = event.name ?? "";
        const role = event.payload?.role;
        const label = name.startsWith("neural.step")
          ? `${role ?? "Agente"} — ${name.replace("neural.step.", "")}`
          : name;
        if (name.includes("run") || name.includes("swarm") || name.startsWith("neural.")) {
          setActivity((prev) => [
            { text: label, time: "agora" },
            ...prev
          ].slice(0, 8));
          setPulse((p) => p + 1);
          void refresh();
        }
      } catch {
        // ignore
      }
    };
    return () => source.close();
  }, [refresh]);

  return { agents, metrics, activity, pulse, refresh };
}
