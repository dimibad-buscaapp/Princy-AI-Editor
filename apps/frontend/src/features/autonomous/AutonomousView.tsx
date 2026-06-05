"use client";

import { Check, Play, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { GlowButton } from "../../design-system/GlowButton";
import { HolographicCard } from "../../design-system/HolographicCard";
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
  metadata?: { objective?: string; plan?: string; diff?: { original: string; modified: string } };
};

export function AutonomousView() {
  const [objective, setObjective] = useState("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [approval, setApproval] = useState<Approval | null>(null);
  const [running, setRunning] = useState(false);

  async function loadGoals() {
    const data = await apiFetch<{ goals: Goal[] }>("/api/automation/goals");
    setGoals(data.goals ?? []);
  }

  useEffect(() => {
    void loadGoals();
  }, []);

  async function startAutonomous() {
    if (!objective.trim()) return;
    setRunning(true);
    try {
      const result = await apiFetch<{ goal: Goal; approval: Approval }>("/api/automation/goals", {
        method: "POST",
        body: { title: objective }
      });
      setApproval(result.approval);
      await loadGoals();
    } finally {
      setRunning(false);
    }
  }

  async function approve() {
    if (!approval) return;
    await apiFetch(`/api/automation/approvals/${approval.id}/approve`, { method: "POST" });
    setApproval(null);
    await loadGoals();
  }

  async function reject() {
    if (!approval) return;
    await apiFetch(`/api/automation/approvals/${approval.id}/reject`, { method: "POST" });
    setApproval(null);
  }

  const diff = approval?.metadata?.diff;

  return (
    <div className="auto-view">
      <header className="auto-view__header glass-panel luminous-border">
        <h1><Zap size={20} /> Autonomous Mode</h1>
        <p>Pipeline autônomo: planejamento → execução → aprovação → patch.</p>
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
      {approval ? (
        <HolographicCard title="Aprovação Pendente" className="auto-view__approval">
          <p><strong>Objetivo:</strong> {approval.metadata?.objective ?? objective}</p>
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
