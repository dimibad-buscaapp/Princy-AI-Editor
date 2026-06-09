import { animationClasses } from "../animations/index.js";

export type AgentOrbitalCardProps = {
  name: string;
  role: string;
  model?: string;
  latencyMs?: number;
  status: string;
  artifacts?: string[];
  animations?: boolean;
};

export function AgentOrbitalCard({
  name,
  role,
  model,
  latencyMs,
  status,
  artifacts,
  animations
}: AgentOrbitalCardProps) {
  const anim = animations !== false;
  const working = status === "working" || status === "running";
  return (
    <div className={`agent-orbital-card ${working && anim ? animationClasses.agentWorking : ""}`}>
      <div className="agent-orbital-header">
        <span className="agent-name">{name}</span>
        <span className={`agent-status status-${status}`}>{status}</span>
      </div>
      <div className="agent-role">{role}</div>
      {model ? <div className="agent-model">{model}</div> : null}
      {latencyMs != null ? <div className="agent-latency">{latencyMs}ms</div> : null}
      {artifacts?.length ? (
        <ul className="agent-artifacts">{artifacts.map((a, i) => <li key={i}>{a}</li>)}</ul>
      ) : null}
    </div>
  );
}
