"use client";

import { useEffect, useState } from "react";
import { HolographicCard } from "../../design-system/HolographicCard";
import { MetricCounter } from "../../design-system/MetricCounter";
import { apiFetch } from "../../lib/api-client";

type ServiceStatus = { name: string; ok: boolean; detail: string; port?: number };

type ParsedMetrics = {
  requests: number;
  errors: number;
  latencyMs: number;
  tokens: number;
  queueDepth: number;
};

export function ObservabilityView() {
  const [metricsRaw, setMetricsRaw] = useState("");
  const [parsed, setParsed] = useState<ParsedMetrics>({ requests: 0, errors: 0, latencyMs: 0, tokens: 0, queueDepth: 0 });
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:3407";

  useEffect(() => {
    void (async () => {
      try {
        const health = await apiFetch<{ services: ServiceStatus[] }>("/observability/health");
        setServices(health.services ?? []);
      } catch {
        setServices([]);
      }
      try {
        const res = await fetch(`${gateway}/observability/metrics`);
        const data = (await res.json()) as { raw?: string; parsed?: ParsedMetrics };
        setMetricsRaw(data.raw ?? "");
        if (data.parsed) setParsed(data.parsed);
      } catch {
        fetch(`${gateway}/metrics`).then((r) => r.text()).then(setMetricsRaw).catch(() => setMetricsRaw(""));
      }
    })();
  }, [gateway]);

  const healthyCount = services.filter((s) => s.ok).length;

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
      <div className="obs-view__grid">
        <HolographicCard title="Prometheus / Métricas">
          <pre className="obs-view__pre">{metricsRaw.slice(0, 1500) || "Carregando métricas..."}</pre>
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
        <HolographicCard title="Ollama / Modelos">
          <p>Chat: {process.env.NEXT_PUBLIC_CHAT_MODEL ?? "qwen3:8b"}</p>
          <p>Embeddings: nomic-embed-text</p>
        </HolographicCard>
        <HolographicCard title="Gateway / SSE / Redis">
          <p>Event stream: /api/events/stream</p>
          <p>Canal Redis: princy:events</p>
        </HolographicCard>
      </div>
      <svg className="obs-view__spark" viewBox="0 0 400 60" aria-hidden>
        <polyline fill="none" stroke="#00f2ff" strokeWidth="2" points="0,45 50,40 100,35 150,20 200,25 250,15 300,18 350,8 400,12" />
      </svg>
    </div>
  );
}
