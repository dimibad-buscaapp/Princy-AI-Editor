"use client";

import { Check, Play, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { GlowButton } from "../../design-system/GlowButton";
import { HolographicCard } from "../../design-system/HolographicCard";
import { eventsStreamUrl } from "../../lib/api";
import { apiFetch } from "../../lib/api-client";
import { DiffViewer } from "../editor/DiffViewer";

type Goal = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
};

type Approval = {
  id: string;
  goalId: string;
  type: string;
  status: string;
  metadata?: {
    objective?: string;
    plan?: string;
    diff?: { original: string; modified: string };
    review?: string;
    steps?: string[];
  };
};

type PipelineStep = {
  role: string;
  status: "pending" | "running" | "done" | "failed";
};

const DEFAULT_STEPS = ["COORDINATOR", "ARCHITECT", "DEVELOPER", "TESTER", "REVIEWER", "DEVOPS"];

const ROLE_LABELS: Record<string, string> = {
  COORDINATOR: "Coordenador",
  ARCHITECT: "Arquiteto",
  DEVELOPER: "Desenvolvedor",
  TESTER: "Testador",
  REVIEWER: "Revisor",
  DEVOPS: "DevOps"
};

export function AutonomousView() {
  const [objective, setObjective] = useState("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>(
    DEFAULT_STEPS.map((role) => ({ role, status: "pending" }))
  );
  const [phase, setPhase] = useState<string>("idle");

  async function loadGoals() {
    const data = await apiFetch<{ goals: Goal[] }>("/automation/goals");
    setGoals(data.goals ?? []);
  }

  useEffect(() => {
    void loadGoals();
  }, []);

  useEffect(() => {
    const source = new EventSource(eventsStreamUrl());
    source.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as {
          name?: string;
          payload?: { role?: string; phase?: string; goalId?: string };
        };
        const name = event.name ?? "";

        if (name === "goal.planning") {
          setPhase("PLANNING");
          setSteps((prev) => prev.map((s, i) => (i < 2 ? { ...s, status: "running" } : s)));
        }
        if (name === "goal.executing") {
          setPhase("EXECUTING");
          setSteps((prev) =>
            prev.map((s, i) => ({
              ...s,
              status: i < 2 ? "done" : i < 5 ? "running" : s.status
            }))
          );
        }
        if (name === "goal.awaiting_approval") {
          setPhase("AWAITING_APPROVAL");
          setSteps((prev) => prev.map((s) => ({ ...s, status: s.status === "running" ? "done" : s.status })));
        }
        if (name === "goal.completed") {
          setPhase("COMPLETED");
          setSteps((prev) => prev.map((s) => ({ ...s, status: "done" })));
        }

        if (name === "neural.step.started" && event.payload?.role) {
          const role = event.payload.role;
          setSteps((prev) =>
            prev.map((s) =>
              s.role === role ? { ...s, status: "running" } : s
            )
          );
        }
        if (name === "neural.step.completed" && event.payload?.role) {
          const role = event.payload.role;
          setSteps((prev) =>
            prev.map((s) =>
              s.role === role ? { ...s, status: "done" } : s
            )
          );
        }
        if (name === "neural.step.failed" && event.payload?.role) {
          const role = event.payload.role;
          setSteps((prev) =>
            prev.map((s) =>
              s.role === role ? { ...s, status: "failed" } : s
            )
          );
        }
        if (name === "autonomous.planning") setPhase("PLANNING");
        if (name === "autonomous.executing") setPhase("EXECUTING");
      } catch {
        /* ignore */
      }
    };
    return () => source.close();
  }, []);

  async function startAutonomous() {
    if (!objective.trim()) return;
    setRunning(true);
    setPhase("PLANNING");
    setSteps(DEFAULT_STEPS.map((role) => ({ role, status: "pending" })));
    try {
      const result = await apiFetch<{ goal: Goal; approval: Approval }>("/automation/goals", {
        method: "POST",
        body: { title: objective }
      });
      setApproval(result.approval);
      if (result.approval.metadata?.steps) {
        setSteps(
          result.approval.metadata.steps.map((role) => ({
            role,
            status: role === "DEVOPS" ? "pending" : "done"
          }))
        );
      }
      setPhase("AWAITING_APPROVAL");
      await loadGoals();
    } finally {
      setRunning(false);
    }
  }

  async function approve() {
    if (!approval) return;
    await apiFetch(`/automation/approvals/${approval.id}/approve`, { method: "POST" });
    setApproval(null);
    setPhase("COMPLETED");
    setSteps((prev) => prev.map((s) => ({ ...s, status: "done" })));
    await loadGoals();
  }

  async function reject() {
    if (!approval) return;
    await apiFetch(`/automation/approvals/${approval.id}/reject`, { method: "POST" });
    setApproval(null);
    setPhase("idle");
    setSteps(DEFAULT_STEPS.map((role) => ({ role, status: "pending" })));
  }

  const diff = approval?.metadata?.diff;

  return (
    <div className="auto-view">
      <header className="auto-view__header glass-panel luminous-border">
        <h1><Zap size={20} /> Autonomous Mode</h1>
        <p>Pipeline oficial: Coordenador → Arquiteto → Dev → Testador → Revisor → DevOps → aprovação.</p>
      </header>
      <div className="auto-view__input glass-panel">
        <input
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder='Ex: "Criar sistema completo de autenticação"'
        />
        <GlowButton variant="violet" onClick={startAutonomous} disabled={running}>
          <Play size={14} /> {running ? "Executando..." : "Iniciar"}
        </GlowButton>
      </div>
      <HolographicCard title={`Pipeline — ${phase}`}>
        <ol className="auto-view__pipeline">
          {steps.map((step) => (
            <li key={step.role} className={`auto-view__step auto-view__step--${step.status}`}>
              <span>{ROLE_LABELS[step.role] ?? step.role}</span>
              <small>{step.status}</small>
            </li>
          ))}
        </ol>
      </HolographicCard>
      {approval ? (
        <HolographicCard title="Aprovação Pendente" className="auto-view__approval">
          <p><strong>Objetivo:</strong> {approval.metadata?.objective ?? objective}</p>
          {approval.metadata?.review ? (
            <p><strong>Revisão:</strong> {approval.metadata.review.slice(0, 300)}</p>
          ) : null}
          {approval.metadata?.plan ? <pre className="auto-view__plan">{approval.metadata.plan}</pre> : null}
          {diff ? <DiffViewer original={diff.original} modified={diff.modified} height="220px" /> : null}
          <div className="auto-view__actions">
            <GlowButton variant="cyan" onClick={approve}><Check size={14} /> Aprovar</GlowButton>
            <GlowButton variant="violet" onClick={reject}><X size={14} /> Rejeitar</GlowButton>
          </div>
        </HolographicCard>
      ) : null}
      <HolographicCard title="Histórico de Objetivos">
        <ul className="auto-view__goals">
          {goals.map((g) => (
            <li key={g.id} className={`auto-view__goal auto-view__goal--${g.status.toLowerCase()}`}>
              <strong>{g.title}</strong>
              <span>{g.status}</span>
            </li>
          ))}
        </ul>
      </HolographicCard>
    </div>
  );
}
