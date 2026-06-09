import { useState, useCallback } from "react";
import { useVscodeBridge, useInitState } from "../hooks/useVscodeBridge.js";
import { HolographicCard, MetricCounter, LoadingSkeleton } from "../components/primitives.js";

function ObservabilityApp() {
  const init = useInitState();
  const [health, setHealth] = useState<Record<string, unknown>>({});
  const [router, setRouter] = useState<Record<string, unknown>>({});
  const [metrics, setMetrics] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);

  const onMessage = useCallback((msg: { type: string; [k: string]: unknown }) => {
    if (msg.type === "data") {
      setHealth((msg.health as Record<string, unknown>) ?? {});
      setRouter((msg.router as Record<string, unknown>) ?? {});
      setMetrics((msg.metrics as Record<string, unknown>) ?? {});
      setLoading(false);
    }
  }, []);

  useVscodeBridge(onMessage);

  const routerEntries = Object.entries(router).slice(0, 8);

  return (
    <div className={`panel-body ${!init.motionEnabled ? "no-motion" : ""}`}>
      {loading ? <LoadingSkeleton lines={5} /> : null}
      <div className="grid-2">
        <MetricCounter label="Status" value={String(health.status ?? "—")} />
        <MetricCounter label="Services" value={String((health.services as unknown[])?.length ?? "—")} />
      </div>
      <HolographicCard title="Router">
        <div className="grid-2">
          {routerEntries.map(([k, v]) => (
            <MetricCounter key={k} label={k} value={typeof v === "object" ? JSON.stringify(v).slice(0, 20) : String(v)} />
          ))}
        </div>
      </HolographicCard>
      <HolographicCard title="Metrics">
        <svg className="sparkline" viewBox="0 0 100 40"><polyline fill="none" stroke="var(--cyan)" strokeWidth="2" points="0,30 20,25 40,20 60,15 80,10 100,5" /></svg>
        <pre style={{ fontSize: 10, maxHeight: 150, overflow: "auto" }}>{JSON.stringify(metrics, null, 2)}</pre>
      </HolographicCard>
    </div>
  );
}

export default ObservabilityApp;
