import { animationClasses } from "../animations/index.js";

export type ThinkingPanelProps = {
  objective?: string;
  plan?: string;
  steps?: Array<{ label: string; status: string }>;
  tools?: string[];
  agents?: string[];
  tokens?: number;
  elapsedMs?: number;
  animations?: boolean;
};

export function ThinkingPanel({
  objective,
  plan,
  steps,
  tools,
  agents,
  tokens,
  elapsedMs,
  animations
}: ThinkingPanelProps) {
  const anim = animations !== false;
  return (
    <div className={`thinking-panel glass-panel ${anim ? animationClasses.thinking : ""}`}>
      <h3>Thinking Panel</h3>
      {objective ? <section><strong>Objective</strong><p>{objective}</p></section> : null}
      {plan ? <section><strong>Plan</strong><p>{plan}</p></section> : null}
      {steps?.length ? (
        <section>
          <strong>Steps</strong>
          <ul>{steps.map((s, i) => <li key={i} className={`step-${s.status}`}>{s.label}</li>)}</ul>
        </section>
      ) : null}
      {tools?.length ? <section><strong>Tools</strong><p>{tools.join(", ")}</p></section> : null}
      {agents?.length ? <section><strong>Agents</strong><p>{agents.join(", ")}</p></section> : null}
      <footer className="thinking-meta">
        {tokens != null ? <span>{tokens} tokens</span> : null}
        {elapsedMs != null ? <span>{(elapsedMs / 1000).toFixed(1)}s</span> : null}
      </footer>
    </div>
  );
}
