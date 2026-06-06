"use client";

import { useCallback, useEffect, useState } from "react";
import { BetaBadge } from "../../design-system/BetaBadge";
import { LoadingSkeleton } from "../../design-system/LoadingSkeleton";
import { gatewayUrl } from "../../lib/api";

type ServiceRow = {
  name: string;
  port?: number;
  ok: boolean;
  detail: string;
  latencyMs?: number;
};

const EXPECTED_PORTS: Record<string, number> = {
  Frontend: 3400,
  API: 3401,
  Agents: 3402,
  "Workspace Service": 3403,
  Workspace: 3403,
  "Context Graph": 3404,
  Memory: 3405,
  Automation: 3406,
  Gateway: 3407,
  MCP: 3408,
  Ollama: 11434,
  Redis: 6379
};

type ServiceStatusPanelProps = {
  compact?: boolean;
  limit?: number;
};

export function ServiceStatusPanel({ compact = false, limit }: ServiceStatusPanelProps) {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [lastCheck, setLastCheck] = useState("—");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const started = performance.now();
    try {
      const res = await fetch(gatewayUrl("/api/system/health"));
      const data = (await res.json()) as {
        services?: { name: string; ok: boolean; detail: string; port?: number }[];
      };
      const latencyMs = Math.round(performance.now() - started);
      const rows: ServiceRow[] = (data.services ?? []).map((s) => ({
        ...s,
        port: s.port ?? EXPECTED_PORTS[s.name],
        latencyMs: s.ok ? latencyMs : undefined
      }));

      const hasFrontend = rows.some((r) => r.name === "Frontend");
      if (!hasFrontend) {
        rows.unshift({
          name: "Frontend",
          port: 3400,
          ok: typeof window !== "undefined",
          detail: typeof window !== "undefined" ? "browser active" : "unknown",
          latencyMs: 0
        });
      }

      const apiOk = rows.find((r) => r.name === "API")?.ok;
      rows.push({
        name: "PostgreSQL",
        ok: apiOk ?? false,
        detail: apiOk ? "via API connection" : "inferred offline",
        latencyMs: undefined
      });

      setServices(limit ? rows.slice(0, limit) : rows);
      setLastCheck(new Date().toLocaleTimeString("pt-BR"));
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className={compact ? "service-panel service-panel--compact" : "service-panel"}>
        <LoadingSkeleton height={compact ? 120 : 240} />
      </div>
    );
  }

  return (
    <div className={compact ? "service-panel service-panel--compact" : "service-panel"}>
      <div className="service-panel__header">
        <h3>{compact ? "Serviços" : "Status dos Serviços"}</h3>
        <div className="service-panel__meta">
          <span>Último check: {lastCheck}</span>
          <button type="button" className="beta-tab" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
      </div>
      <ul className="service-panel__list">
        {services.map((s) => (
          <li key={s.name} className={`service-panel__row ${s.ok ? "service-panel__row--ok" : "service-panel__row--fail"}`}>
            <span className="service-panel__name">
              {s.name}
              {s.port ? <span className="service-panel__port">:{s.port}</span> : null}
            </span>
            <span className="service-panel__status">
              <BetaBadge variant={s.ok ? "success" : "danger"}>{s.ok ? "online" : "offline"}</BetaBadge>
              {s.latencyMs !== undefined ? <span className="service-panel__latency">{s.latencyMs}ms</span> : null}
            </span>
            {!compact ? <span className="service-panel__detail">{s.detail}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
