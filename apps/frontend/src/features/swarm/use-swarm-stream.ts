"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api-client";

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
    try {
      const [statusRes, metricsRes] = await Promise.all([
        apiFetch<{ agents: LiveAgent[] }>("/api/agents/status"),
        apiFetch<SwarmMetrics>("/api/agents/metrics")
      ]);
      setAgents(statusRes.agents);
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
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://127.0.0.1:3407";
    const source = new EventSource(`${gateway}/api/events/stream`);
    source.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as { name?: string; payload?: { role?: string } };
        if (event.name?.includes("run") || event.name?.includes("swarm")) {
          setActivity((prev) => [
            { text: event.name ?? "evento", time: "agora" },
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
