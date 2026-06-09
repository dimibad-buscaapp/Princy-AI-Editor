import { useState, useCallback } from "react";
import { useVscodeBridge, useInitState } from "../hooks/useVscodeBridge.js";
import { AgentOrbitalCard } from "../components/AgentOrbitalCard.js";
import { ThinkingPanel } from "../components/ThinkingPanel.js";
import { BetaBadge, GlowButton, LoadingSkeleton } from "../components/primitives.js";

type Agent = { name: string; role: string; model?: string; latencyMs?: number; status: string; artifacts?: string[] };
type Activity = { time: string; message: string };

function SwarmApp() {
  const init = useInitState();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskObjective, setTaskObjective] = useState("");
  const [thinking, setThinking] = useState<{ objective?: string; plan?: string; steps?: Array<{ label: string; status: string }> }>({});

  const onMessage = useCallback((msg: { type: string; [k: string]: unknown }) => {
    if (msg.type === "data") {
      setAgents((msg.agents as Agent[]) ?? []);
      setActivity((msg.activity as Activity[]) ?? []);
      setThinking((msg.thinking as typeof thinking) ?? {});
      setLoading(false);
    }
    if (msg.type === "loading") setLoading(true);
  }, []);

  const { post } = useVscodeBridge(onMessage);

  return (
    <div className={`panel-body ${!init.motionEnabled ? "no-motion" : ""}`}>
      <div className="toolbar">
        <BetaBadge label="SWARM" />
        <span className="badge">Live SSE</span>
        <GlowButton onClick={() => post("refresh")}>Refresh</GlowButton>
      </div>
      <div className="neural-links" />
      <ThinkingPanel {...thinking} animations={init.chatAnimations} />
      {loading ? <LoadingSkeleton lines={4} /> : null}
      <div className="grid-2">
        {agents.map((a, i) => (
          <AgentOrbitalCard key={i} {...a} animations={init.chatAnimations} />
        ))}
      </div>
      <h3 style={{ color: "var(--violet)", fontSize: 13 }}>Activity</h3>
      <div className="timeline">
        {activity.map((a, i) => (
          <div key={i} className="timeline-item"><div className="time">{a.time}</div>{a.message}</div>
        ))}
      </div>
      <div className="chat-input-row">
        <input type="text" className="search-input" placeholder="Swarm objective..." value={taskObjective} onChange={(e) => setTaskObjective(e.target.value)} />
        <GlowButton onClick={() => post("createTask", { objective: taskObjective })}>Create Task</GlowButton>
        <GlowButton variant="ghost" onClick={() => post("runTask")}>Run</GlowButton>
      </div>
    </div>
  );
}

export default SwarmApp;
