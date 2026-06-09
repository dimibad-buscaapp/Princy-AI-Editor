import { useState, useCallback } from "react";
import { useVscodeBridge, useInitState } from "../hooks/useVscodeBridge.js";
import { AgentOrbitalCard } from "../components/AgentOrbitalCard.js";
import { ThinkingPanel } from "../components/ThinkingPanel.js";

const HUD_AGENTS = [
  { name: "Coordinator", role: "COORDINATOR" },
  { name: "Architect", role: "ARCHITECT" },
  { name: "Developer", role: "DEVELOPER" },
  { name: "Tester", role: "TESTER" },
  { name: "Reviewer", role: "REVIEWER" },
  { name: "DevOps", role: "DEVOPS" }
];

function HudApp() {
  const init = useInitState();
  const [agents, setAgents] = useState<Array<{ name: string; role: string; model?: string; latencyMs?: number; status: string; artifacts?: string[] }>>([]);
  const [thinking, setThinking] = useState<Record<string, unknown>>({});

  const onMessage = useCallback((msg: { type: string; [k: string]: unknown }) => {
    if (msg.type === "data") {
      setAgents((msg.agents as typeof agents) ?? []);
      setThinking((msg.thinking as Record<string, unknown>) ?? {});
    }
  }, []);

  useVscodeBridge(onMessage);

  const merged = HUD_AGENTS.map((h) => {
    const live = agents.find((a) => a.role === h.role || a.name === h.name);
    return { ...h, model: live?.model, latencyMs: live?.latencyMs, status: live?.status ?? "idle", artifacts: live?.artifacts };
  });

  return (
    <div className={`panel-body ${!init.motionEnabled ? "no-motion" : ""}`}>
      <ThinkingPanel
        objective={thinking.objective as string}
        plan={thinking.plan as string}
        steps={thinking.steps as Array<{ label: string; status: string }>}
        animations={init.chatAnimations}
      />
      <div className="neural-links" />
      {merged.map((a, i) => (
        <AgentOrbitalCard key={i} {...a} animations={init.chatAnimations} />
      ))}
    </div>
  );
}

export default HudApp;
