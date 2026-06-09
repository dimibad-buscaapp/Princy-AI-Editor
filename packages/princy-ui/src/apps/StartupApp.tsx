import { useState, useCallback } from "react";
import { useVscodeBridge } from "../hooks/useVscodeBridge.js";
import { HolographicCard, GlowButton, MetricCounter } from "../components/primitives.js";

type Project = { path: string; lastOpened: string };
type SwarmRun = { id: string; title: string; status: string };

function StartupApp() {
  const [health, setHealth] = useState<Record<string, unknown>>({});
  const [recent, setRecent] = useState<Project[]>([]);
  const [swarmRuns, setSwarmRuns] = useState<SwarmRun[]>([]);

  const onMessage = useCallback((msg: { type: string; [k: string]: unknown }) => {
    if (msg.type === "data") {
      setHealth((msg.health as Record<string, unknown>) ?? {});
      setRecent((msg.recent as Project[]) ?? []);
      setSwarmRuns((msg.swarmRuns as SwarmRun[]) ?? []);
    }
  }, []);

  const { post } = useVscodeBridge(onMessage);

  return (
    <div className="panel-body">
      <h2 style={{ color: "var(--cyan)", fontSize: 18, margin: "0 0 16px" }}>Princy Code</h2>
      <div className="grid-2">
        <MetricCounter label="VPS Status" value={String(health.status ?? "checking...")} />
        <MetricCounter label="Services" value={String((health.services as unknown[])?.length ?? "—")} />
      </div>
      <HolographicCard title="Recent Projects">
        {recent.length === 0 ? <div className="empty">No recent projects</div> : null}
        {recent.map((p, i) => (
          <div key={i} style={{ fontSize: 12, padding: "4px 0", cursor: "pointer" }} onClick={() => post("openProject", { path: p.path })}>{p.path}</div>
        ))}
      </HolographicCard>
      <HolographicCard title="Latest Swarm Runs">
        {swarmRuns.map((r) => (
          <div key={r.id} style={{ fontSize: 12, padding: "4px 0" }}>{r.title} — {r.status}</div>
        ))}
      </HolographicCard>
      <div className="toolbar">
        <GlowButton onClick={() => post("openChat")}>Open Chat</GlowButton>
        <GlowButton variant="ghost" onClick={() => post("openSwarm")}>Open Swarm</GlowButton>
        <GlowButton variant="ghost" onClick={() => post("openMarketplace")}>Marketplace</GlowButton>
      </div>
    </div>
  );
}

export default StartupApp;
