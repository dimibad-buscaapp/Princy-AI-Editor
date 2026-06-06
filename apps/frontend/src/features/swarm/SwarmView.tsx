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
import { useSwarmStream } from "./use-swarm-stream";
import { useSwarmTasks } from "./use-swarm-tasks";

export function SwarmView() {
  const toast = useToast();
  const { agents, metrics, activity, pulse } = useSwarmStream();
  const { tasks, createTask, runTask } = useSwarmTasks();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<{ id: string; title: string; status: string }[]>([]);

  const liveAgents = agents.length ? agents : fallbackAgents;
  const liveMetrics = metrics ?? fallbackMetrics;
  const liveActivity = activity.length ? activity : defaultActivity;
  const activeTasks = liveAgents.filter((a) => a.status === "busy").length;
  const linkIntensity = Math.min(1, 0.35 + pulse * 0.1 + activeTasks * 0.12);

  async function runSwarm() {
    try {
      const created = await createTask("Analisar e otimizar o Princy Core");
      const first = created.tasks.find((t) => t.status === "PENDING" && t.agentRole !== "COORDINATOR");
      if (first) await runTask(first.id);
      toast.show("Pipeline Swarm criado");
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
      </header>
      <div className={`swarm-view__canvas ${activeTasks > 0 ? "swarm-view__canvas--active" : ""}`}>
        <div className="swarm-neural-stage">
          <NeuralParticles />
          <NeuralOrbitLayer />
          <NeuralEnergyField />
          <PrincyNeuralCore active={activeTasks > 0} />
          <NeuralLinksLayer agents={liveAgents} intensity={linkIntensity} />
          {liveAgents.map((agent) => (
            <AgentOrbitalCard key={agent.id} agent={agent} />
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
        <GlowButton variant="violet" className="swarm-view__cta" onClick={() => void runSwarm()}>
          Executar Swarm
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
        <SwarmHudBeta />
      </aside>
      <aside className="swarm-tasks-panel ref-panel">
        <h3>Tarefas Ativas</h3>
        <ul>
          {tasks.slice(0, 12).map((t) => (
            <li key={t.id}>
              <strong>{t.agentRole}</strong> — {t.title} — {t.status}
              {t.status === "PENDING" ? (
                <button type="button" onClick={() => void runTask(t.id)}>Run</button>
              ) : null}
            </li>
          ))}
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
