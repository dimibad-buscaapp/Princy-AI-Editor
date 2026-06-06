"use client";

import { useEffect, useState } from "react";
import { BetaBadge } from "../../design-system/BetaBadge";
import { LoadingSkeleton } from "../../design-system/LoadingSkeleton";
import { useSwarmHud } from "./use-swarm-hud";
import type { SwarmRun, SwarmRunDetail } from "./use-swarm-run";

type SwarmHudBetaProps = {
  activeRun?: SwarmRunDetail | null;
  queue?: SwarmRun[];
  onCancelRun?: (id: string) => void;
};

function statusVariant(status: string): "success" | "danger" | "reasoning" | "muted" {
  if (status === "done") return "success";
  if (status === "error") return "danger";
  if (status === "busy") return "reasoning";
  return "muted";
}

function LiveTimer({ startedAt }: { startedAt?: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  if (!startedAt) return null;
  return <span className="swarm-hud__live-timer">{elapsed}s</span>;
}

export function SwarmHudBeta({ activeRun, queue = [], onCancelRun }: SwarmHudBetaProps) {
  const { steps, loading, progress, currentAgent, refresh } = useSwarmHud(activeRun);
  const doneCount = steps.filter((s) => s.status === "done").length;

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

      {activeRun ? (
        <div className="swarm-hud__progress-wrap">
          <div className="swarm-hud__progress-bar" style={{ width: `${progress}%` }} />
          <span className="swarm-hud__progress-label">
            {doneCount}/6 — {progress}%
            {currentAgent ? ` · ${currentAgent}` : ""}
          </span>
        </div>
      ) : null}

      <ol className="swarm-hud__pipeline">
        {steps.map((step, i) => (
          <li key={step.role} className="swarm-hud__step">
            {i > 0 ? <span className="swarm-hud__connector" aria-hidden>↓</span> : null}
            <div className={`swarm-hud__step-card ${step.current ? "swarm-hud__step-card--active" : ""}`}>
              <div className="swarm-hud__step-head">
                <strong>{step.role}</strong>
                <BetaBadge variant={statusVariant(step.status)}>{step.status}</BetaBadge>
                {step.current && step.status === "busy" ? <LiveTimer startedAt={step.startedAt ?? Date.now()} /> : null}
              </div>
              <p className="swarm-hud__model">{step.model}</p>
              <p className="swarm-hud__action">{step.lastAction}</p>
              {step.durationMs ? <p className="swarm-hud__time">{step.durationMs}ms</p> : null}
              {step.artifacts && step.artifacts.length > 0 ? (
                <ul className="swarm-hud__artifacts">
                  {step.artifacts.map((a) => (
                    <li key={`${step.role}-${a.type}`} className="swarm-artifact__item" title={a.content}>
                      <BetaBadge variant="muted">{a.type}</BetaBadge>
                      <span>{a.title}</span>
                    </li>
                  ))}
                </ul>
              ) : step.artifactSummary ? (
                <p className="swarm-hud__artifact" title={step.artifactSummary}>
                  {step.artifactSummary}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {queue.length > 0 ? (
        <div className="swarm-queue">
          <h4 className="swarm-queue__title">Fila ({queue.length})</h4>
          <ul className="swarm-queue__list">
            {queue.map((run) => (
              <li key={run.id} className="swarm-queue__item">
                <span className="swarm-queue__objective">{run.objective.slice(0, 48)}</span>
                <BetaBadge variant={run.status === "RUNNING" ? "reasoning" : "muted"}>{run.status}</BetaBadge>
                {onCancelRun && (run.status === "PENDING" || run.status === "RUNNING") ? (
                  <button type="button" className="beta-tab" onClick={() => onCancelRun(run.id)}>
                    Cancel
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
