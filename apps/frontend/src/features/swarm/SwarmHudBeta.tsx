"use client";

import { BetaBadge } from "../../design-system/BetaBadge";
import { LoadingSkeleton } from "../../design-system/LoadingSkeleton";
import { useSwarmHud } from "./use-swarm-hud";

function statusVariant(status: string): "success" | "danger" | "reasoning" | "muted" {
  if (status === "done") return "success";
  if (status === "error") return "danger";
  if (status === "busy") return "reasoning";
  return "muted";
}

export function SwarmHudBeta() {
  const { steps, loading, refresh } = useSwarmHud();

  if (loading && steps.length === 0) {
    return (
      <aside className="swarm-hud beta-card">
        <LoadingSkeleton height={280} />
      </aside>
    );
  }

  return (
    <aside className="swarm-hud beta-card">
      <div className="swarm-hud__header">
        <h3>Swarm HUD</h3>
        <button type="button" className="beta-tab" onClick={() => void refresh()}>
          Refresh
        </button>
      </div>
      <ol className="swarm-hud__pipeline">
        {steps.map((step, i) => (
          <li key={step.role} className="swarm-hud__step">
            {i > 0 ? <span className="swarm-hud__connector" aria-hidden>↓</span> : null}
            <div className="swarm-hud__step-card">
              <div className="swarm-hud__step-head">
                <strong>{step.role}</strong>
                <BetaBadge variant={statusVariant(step.status)}>{step.status}</BetaBadge>
              </div>
              <p className="swarm-hud__model">{step.model}</p>
              <p className="swarm-hud__action">{step.lastAction}</p>
              {step.durationMs ? <p className="swarm-hud__time">{step.durationMs}ms</p> : null}
              {step.artifact ? <p className="swarm-hud__artifact" title={step.artifact}>{step.artifact}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
