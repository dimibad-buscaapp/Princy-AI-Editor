"use client";

import Image from "next/image";
import { useState } from "react";
import { GlowButton } from "../../design-system/GlowButton";
import { useToast } from "../../design-system/Toast";
import { apiFetch } from "../../lib/api-client";
import { AgentOrbitalCard } from "./components/AgentOrbitalCard";
import { NeuralEnergyField } from "./components/NeuralEnergyField";
import { NeuralLinksLayer } from "./components/NeuralLinksLayer";
import { NeuralOrbitLayer } from "./components/NeuralOrbitLayer";
import { NeuralParticles } from "./components/NeuralParticles";
import { PrincyNeuralCore } from "./components/PrincyNeuralCore";
import { SwarmHudBeta } from "./SwarmHudBeta";
import { swarmActivity as defaultActivity, swarmAgents as fallbackAgents, swarmMetrics as fallbackMetrics } from "./swarm-data";
import { useSwarmRun } from "./use-swarm-run";
import { useSwarmStream } from "./use-swarm-stream";

export function SwarmView() {
  const toast = useToast();
  const { agents, metrics, activity, pulse } = useSwarmStream();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const { queue, activeRun, startRun, cancelRun, loading: runLoading } = useSwarmRun(selectedRunId);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<{ id: string; title: string; status: string }[]>([]);

  const liveAgents = agents.length ? agents : fallbackAgents;
  const liveMetrics = metrics ?? fallbackMetrics;
  const liveActivity = activity.length ? activity : defaultActivity;
  const currentRole = activeRun?.run.currentAgent?.toUpperCase() ?? null;
  const activeTasks = liveAgents.filter((a) => a.status === "busy").length;
  const linkIntensity = Math.min(1, 0.35 + pulse * 0.1 + activeTasks * 0.12);

  async function runSwarm() {
    try {
      const run = await startRun("Analisar e otimizar o Princy Core", "Fase 34 multi-agent pipeline");
      if (run?.id) setSelectedRunId(run.id);
      toast.show(`Swarm iniciado: ${run?.id?.slice(0, 8) ?? "ok"}`);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Falha ao iniciar swarm");
    }
  }

  async function openHistory() {
    try {
      const data = await apiFetch<{ history: { id: string; task?: { title: string; status: string } }[] }>("/agents/history", {
        query: { limit: 20 }
      });
      setHistory(
        data.history.map((h) => ({
          id: h.id,
          title: h.task?.title ?? "Execução",
          status: h.task?.status ?? "COMPLETED"
        }))
      );
      setHistoryOpen(true);
    } catch {
      toast.show("Histórico indisponível");
    }
  }

  return (
    <div className="swarm-view">
      <header className="swarm-view__titlebar">
        <span>Swarm</span>
        {activeRun?.run ? (
          <span className="swarm-view__run-status">
            Run {activeRun.run.status} — {activeRun.run.progress}%
          </span>
        ) : null}
      </header>
      <div className={`swarm-view__canvas ${activeTasks > 0 ? "swarm-view__canvas--active" : ""}`}>
        <div className="swarm-neural-stage">
          <NeuralParticles />
          <NeuralOrbitLayer />
          <NeuralEnergyField />
          <PrincyNeuralCore active={activeTasks > 0} />
          <NeuralLinksLayer agents={liveAgents} intensity={linkIntensity} />
          {liveAgents.map((agent) => (
            <AgentOrbitalCard
              key={agent.id}
              agent={agent}
              isCurrent={currentRole === agent.role?.toUpperCase() || currentRole === agent.id?.toUpperCase()}
            />
          ))}
          <Image src="/princy/hero-alien.png" alt="" width={140} height={90} className="swarm-view__ship" aria-hidden />
        </div>
      </div>
      <aside className="swarm-view__panel ref-panel">
        <h2 className="swarm-view__panel-title">SWARM STATUS</h2>
        <dl className="swarm-view__metrics">
          <div><dt>Agentes Ativos</dt><dd>{liveMetrics.activeAgents ?? "10/10"}</dd></div>
          <div><dt>Tarefas Hoje</dt><dd>{liveMetrics.tasksToday}</dd></div>
          <div><dt>Taxa de Sucesso</dt><dd>{liveMetrics.successRate}%</dd></div>
          <div><dt>Tempo Médio</dt><dd>{liveMetrics.avgTime}</dd></div>
          <div><dt>Tokens Usados</dt><dd>{liveMetrics.tokens}</dd></div>
        </dl>
        <GlowButton variant="violet" className="swarm-view__cta" onClick={() => void runSwarm()} disabled={runLoading}>
          {runLoading ? "Iniciando..." : "Executar Swarm"}
        </GlowButton>
        <h3 className="swarm-view__activity-title">ATIVIDADE RECENTE</h3>
        <ul className="swarm-view__activity">
          {liveActivity.map((item) => (
            <li key={`${item.text}-${item.time}`}>
              <span>{item.text}</span>
              <small>{item.time}</small>
            </li>
          ))}
        </ul>
        <GlowButton variant="violet" className="swarm-view__cta" onClick={() => void openHistory()}>
          Ver Todas as Tarefas
        </GlowButton>
        <SwarmHudBeta
          activeRun={activeRun}
          queue={queue}
          onCancelRun={(id) => void cancelRun(id).then(() => toast.show("Run cancelado"))}
        />
      </aside>
      <aside className="swarm-tasks-panel ref-panel">
        <h3>Fila de Runs</h3>
        <ul className="swarm-queue__list">
          {queue.length === 0 ? (
            <li className="swarm-queue__empty">Nenhum run ativo</li>
          ) : (
            queue.map((run) => (
              <li key={run.id} className="swarm-queue__item">
                <strong>{run.objective.slice(0, 40)}</strong>
                <span>{run.status} — {run.progress}%</span>
                {run.currentAgent ? <small>{run.currentAgent}</small> : null}
              </li>
            ))
          )}
        </ul>
      </aside>
      {historyOpen ? (
        <div className="swarm-history-modal ref-panel">
          <h3>Histórico de Tarefas</h3>
          <ul>
            {history.map((h) => (
              <li key={h.id}>{h.title} — {h.status}</li>
            ))}
          </ul>
          <button type="button" onClick={() => setHistoryOpen(false)}>Fechar</button>
        </div>
      ) : null}
    </div>
  );
}
