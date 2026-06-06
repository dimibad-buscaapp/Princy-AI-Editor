"use client";

import { useCallback, useEffect, useState } from "react";
import { HolographicCard } from "../../design-system/HolographicCard";
import { useToast } from "../../design-system/Toast";
import { apiUrl } from "../../lib/api";
import { apiFetch } from "../../lib/api-client";
import { safeFetch } from "../../lib/safe-fetch";

type ServiceStatus = {
  name: string;
  ok: boolean;
  detail: string;
  port?: number;
};

type HealthPayload = {
  services: ServiceStatus[];
  summary?: { healthy: number; total: number };
  neuralCore?: { agents: string; status: string };
};

const WATCHED = [
  "Gateway",
  "Agents",
  "Memory",
  "Workspace",
  "Automation",
  "Context Graph",
  "Redis",
  "Ollama"
];

export function SystemHealthView() {
  const toast = useToast();
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [neuralCore, setNeuralCore] = useState<string>("—");
  const [lastUpdate, setLastUpdate] = useState<string>("—");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<HealthPayload>("/system/health");
      setServices(data.services ?? []);
      setNeuralCore(data.neuralCore ? `${data.neuralCore.status} (${data.neuralCore.agents})` : "—");
      setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
    } catch (error) {
      try {
        await safeFetch(apiUrl("/system/health"), {
          onError: (msg) => toast.show(msg)
        });
      } catch {
        toast.show("Falha ao carregar health do sistema");
      }
      console.warn("[system]", error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const display = WATCHED.map((name) => {
    const svc = services.find((s) => s.name === name);
    return svc ?? { name, ok: false, detail: "sem dados", port: undefined };
  });

  return (
    <div className="system-view">
      <header className="system-view__header glass-panel luminous-border">
        <h1>System Health</h1>
        <p>Atualização a cada 5s — última: {lastUpdate}</p>
        <p>Neural Core: {neuralCore}</p>
      </header>
      <div className="system-view__grid">
        {display.map((svc) => (
          <HolographicCard key={svc.name} title={svc.name}>
            <p className={`system-view__status system-view__status--${svc.ok ? "online" : "offline"}`}>
              {svc.ok ? "ONLINE" : "OFFLINE"}
            </p>
            <p className="system-view__detail">{svc.detail}</p>
            {svc.port ? <small>Porta {svc.port}</small> : null}
          </HolographicCard>
        ))}
      </div>
      {loading ? <p className="system-view__loading">Carregando...</p> : null}
    </div>
  );
}
