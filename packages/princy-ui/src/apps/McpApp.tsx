import { useState, useCallback } from "react";
import { useVscodeBridge, useInitState } from "../hooks/useVscodeBridge.js";
import { HolographicCard, GlowButton, LoadingSkeleton } from "../components/primitives.js";

type Server = { id: string; name: string; status?: string; latencyMs?: number };

function McpApp() {
  const init = useInitState();
  const [servers, setServers] = useState<Server[]>([]);
  const [health, setHealth] = useState<Record<string, unknown>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const onMessage = useCallback((msg: { type: string; [k: string]: unknown }) => {
    if (msg.type === "data") {
      setServers((msg.servers as Server[]) ?? []);
      setHealth((msg.health as Record<string, unknown>) ?? {});
      setLogs((msg.logs as string[]) ?? []);
      setLoading(false);
    }
    if (msg.type === "testResult") {
      setLogs((prev) => [`Test ${msg.serverId}: ${msg.latencyMs}ms — ${msg.ok ? "OK" : "FAIL"}`, ...prev]);
    }
  }, []);

  const { post } = useVscodeBridge(onMessage);

  return (
    <div className={!init.motionEnabled ? "no-motion" : ""}>
      <div className="toolbar">
        <span className="badge">Health: {String(health.status ?? "unknown")}</span>
        <GlowButton onClick={() => post("refresh")}>Refresh</GlowButton>
      </div>
      {loading ? <LoadingSkeleton /> : null}
      {servers.map((s) => (
        <HolographicCard key={s.id} title={s.name}>
          <div style={{ fontSize: 12 }}>Status: {s.status ?? "—"} {s.latencyMs != null ? `(${s.latencyMs}ms)` : ""}</div>
          <GlowButton onClick={() => post("test", { serverId: s.id })}>Test</GlowButton>
        </HolographicCard>
      ))}
      <HolographicCard title="Logs">
        <pre style={{ fontSize: 10, maxHeight: 120, overflow: "auto" }}>{logs.join("\n") || "No logs"}</pre>
      </HolographicCard>
    </div>
  );
}

export default McpApp;
