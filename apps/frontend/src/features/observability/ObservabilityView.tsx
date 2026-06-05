"use client";

import { useEffect, useState } from "react";
import { HolographicCard } from "../../design-system/HolographicCard";
import { MetricCounter } from "../../design-system/MetricCounter";

type ServiceStatus = { name: string; ok: boolean; detail: string };

export function ObservabilityView() {
  const [metrics, setMetrics] = useState("");
  const [services, setServices] = useState<ServiceStatus[]>([]);

  useEffect(() => {
    const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://127.0.0.1:3407";
    fetch(`${gateway}/metrics`).then((r) => r.text()).then(setMetrics).catch(() => setMetrics("Metrics unavailable"));

    const checks: { name: string; url: string }[] = [
      { name: "Gateway", url: `${gateway}/health/live` },
      { name: "Agents", url: "http://127.0.0.1:3402/health/live" },
      { name: "API", url: "http://127.0.0.1:3401/health/live" },
      { name: "Memory", url: "http://127.0.0.1:3405/health/live" }
    ];

    void Promise.all(
      checks.map(async (c) => {
        try {
          const r = await fetch(c.url);
          return { name: c.name, ok: r.ok, detail: r.ok ? "healthy" : `HTTP ${r.status}` };
        } catch (e) {
          return { name: c.name, ok: false, detail: e instanceof Error ? e.message : "offline" };
        }
      })
    ).then(setServices);
  }, []);

  const requestCount = Number(metrics.match(/http_requests_total\{[^}]*\}\s+(\d+)/)?.[1] ?? 0);

  return (
    <div className="obs-view">
      <header className="obs-view__header glass-panel luminous-border">
        <h1>Observability</h1>
        <p>Logs, eventos, SSE, tokens e status do Princy Core.</p>
      </header>
      <div className="obs-view__metrics">
        <MetricCounter label="Requisições" value={requestCount} />
        <MetricCounter label="Latência média" value={42} suffix="ms" />
        <MetricCounter label="Tokens SSE" value={12840} />
        <MetricCounter label="Eventos" value={256} />
      </div>
      <div className="obs-view__grid">
        <HolographicCard title="Logs / Eventos">
          <pre className="obs-view__pre">{metrics.slice(0, 1200) || "Carregando métricas..."}</pre>
        </HolographicCard>
        <HolographicCard title="Status dos Serviços">
          <ul className="obs-view__services">
            {services.map((s) => (
              <li key={s.name} className={s.ok ? "obs-view__ok" : "obs-view__fail"}>
                <strong>{s.name}</strong> — {s.detail}
              </li>
            ))}
          </ul>
        </HolographicCard>
        <HolographicCard title="Ollama / Modelos">
          <p>Chat: qwen3:8b</p>
          <p>Reasoning: deepseek-r1:8b</p>
          <p>Embeddings: nomic-embed-text</p>
        </HolographicCard>
        <HolographicCard title="Gateway / SSE">
          <p>Proxy timeout: 300000ms</p>
          <p>Stream: text/event-stream</p>
          <p>Eventos: status, token, done</p>
        </HolographicCard>
      </div>
      <svg className="obs-view__spark" viewBox="0 0 400 60" aria-hidden>
        <polyline fill="none" stroke="#00f2ff" strokeWidth="2" points="0,45 50,40 100,35 150,20 200,25 250,15 300,18 350,8 400,12" />
      </svg>
    </div>
  );
}
