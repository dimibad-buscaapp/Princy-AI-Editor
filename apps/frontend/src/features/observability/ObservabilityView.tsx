"use client";

import { useEffect, useState } from "react";
import { HolographicCard } from "../../design-system/HolographicCard";
import { MetricCounter } from "../../design-system/MetricCounter";
import { gatewayUrl } from "../../lib/api";
import { apiFetch } from "../../lib/api-client";

type ServiceStatus = { name: string; ok: boolean; detail: string; port?: number };

type ParsedMetrics = {
  requests: number;
  errors: number;
  latencyMs: number;
  tokens: number;
  queueDepth: number;
};

type ModelMetrics = {
  aggregates: { ttftMs: number; totalMs: number; tokensPerSec: number; runs: number };
  recent: {
    id: string;
    modelId: string;
    task: string;
    ttftMs: number;
    totalMs: number;
    tokenCount: number;
    tokensPerSec: number;
    at: string;
  }[];
};

type HealthModels = {
  chat?: string;
  editor?: string;
  swarm?: string;
  autonomous?: string;
  embed?: string;
};

export function ObservabilityView() {
  const [metricsRaw, setMetricsRaw] = useState("");
  const [parsed, setParsed] = useState<ParsedMetrics>({ requests: 0, errors: 0, latencyMs: 0, tokens: 0, queueDepth: 0 });
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [activeModels, setActiveModels] = useState<HealthModels>({});
  const [cacheStats, setCacheStats] = useState<{ entries: number; totalHits: number } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const health = await apiFetch<{ services: ServiceStatus[]; models?: HealthModels }>("/system/health");
        setServices(health.services ?? []);
        if (health.models) setActiveModels(health.models);
      } catch {
        setServices([]);
      }
      try {
        const metrics = await apiFetch<ModelMetrics>("/agents/models/metrics", { query: { limit: 20 } });
        setModelMetrics(metrics);
      } catch {
        setModelMetrics(null);
      }
      try {
        const cache = await apiFetch<{ entries: number; totalHits: number }>("/memory/cache/stats");
        setCacheStats(cache);
      } catch {
        setCacheStats(null);
      }
      try {
        const res = await fetch(gatewayUrl("/observability/metrics"));
        const data = (await res.json()) as { raw?: string; parsed?: ParsedMetrics };
        setMetricsRaw(data.raw ?? "");
        if (data.parsed) setParsed(data.parsed);
      } catch {
        fetch(gatewayUrl("/metrics")).then((r) => r.text()).then(setMetricsRaw).catch(() => setMetricsRaw(""));
      }
    })();
  }, []);

  const healthyCount = services.filter((s) => s.ok).length;
  const agg = modelMetrics?.aggregates;

  return (
    <div className="obs-view">
      <header className="obs-view__header glass-panel luminous-border">
        <h1>Observability</h1>
        <p>Health de {services.length} dependências — {healthyCount} saudáveis.</p>
      </header>
      <div className="obs-view__metrics">
        <MetricCounter label="Requisições" value={parsed.requests} />
        <MetricCounter label="Latência média" value={Math.round(parsed.latencyMs)} suffix="ms" />
        <MetricCounter label="Tokens" value={parsed.tokens} />
        <MetricCounter label="Fila" value={parsed.queueDepth} />
        <MetricCounter label="Erros" value={parsed.errors} />
      </div>
      <div className="obs-view__metrics">
        <MetricCounter label="TTFT médio" value={agg?.ttftMs ?? 0} suffix="ms" />
        <MetricCounter label="Tempo total médio" value={agg?.totalMs ?? 0} suffix="ms" />
        <MetricCounter label="Tokens/segundo" value={agg?.tokensPerSec ?? 0} />
        <MetricCounter label="Runs medidos" value={agg?.runs ?? 0} />
      </div>
      <div className="obs-view__grid">
        <HolographicCard title="Performance de Modelos">
          <ul className="obs-view__services">
            {(modelMetrics?.recent ?? []).slice(0, 10).map((m) => (
              <li key={m.id}>
                <strong>{m.modelId}</strong> ({m.task}) — TTFT {m.ttftMs}ms · {m.totalMs}ms · {m.tokensPerSec} tok/s
              </li>
            ))}
            {!modelMetrics?.recent?.length ? <li>Sem métricas de modelo ainda.</li> : null}
          </ul>
        </HolographicCard>
        <HolographicCard title="Status dos Serviços (11)">
          <ul className="obs-view__services">
            {services.map((s) => (
              <li key={s.name} className={s.ok ? "obs-view__ok" : "obs-view__fail"}>
                <strong>{s.name}</strong>
                {s.port ? <span className="obs-view__port">:{s.port}</span> : null}
                — {s.detail}
              </li>
            ))}
            {services.length === 0 ? <li>Verificando serviços...</li> : null}
          </ul>
        </HolographicCard>
        <HolographicCard title="Chat Cache">
          <p>Entradas: {cacheStats?.entries ?? 0}</p>
          <p>Total hits: {cacheStats?.totalHits ?? 0}</p>
        </HolographicCard>
        <HolographicCard title="Modelos Ativos">
          <p>Chat: {activeModels.chat ?? "qwen2.5:3b"}</p>
          <p>Editor: {activeModels.editor ?? "qwen2.5:3b"}</p>
          <p>Swarm: {activeModels.swarm ?? "deepseek-r1:8b"}</p>
          <p>Autonomous: {activeModels.autonomous ?? "deepseek-r1:8b"}</p>
          <p>Embeddings: {activeModels.embed ?? "nomic-embed-text"}</p>
        </HolographicCard>
        <HolographicCard title="Prometheus / Métricas">
          <pre className="obs-view__pre">{metricsRaw.slice(0, 1500) || "Carregando métricas..."}</pre>
        </HolographicCard>
      </div>
      <svg className="obs-view__spark" viewBox="0 0 400 60" aria-hidden>
        <polyline fill="none" stroke="#00f2ff" strokeWidth="2" points="0,45 50,40 100,35 150,20 200,25 250,15 300,18 350,8 400,12" />
      </svg>
    </div>
  );
}
