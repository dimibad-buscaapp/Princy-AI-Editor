"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { NeuralGlow } from "../../design-system/NeuralGlow";
import { GlowButton } from "../../design-system/GlowButton";
import { useToast } from "../../design-system/Toast";
import { apiFetch } from "../../lib/api-client";
import { AgentHoloCard } from "./AgentHoloCard";
import { NeuralConnections } from "./NeuralConnections";
import { swarmActivity as defaultActivity, swarmAgents as fallbackAgents, swarmMetrics as fallbackMetrics } from "./swarm-data";
import { useSwarmStream } from "./use-swarm-stream";

export function SwarmView() {
  const toast = useToast();
  const { agents, metrics, activity, pulse } = useSwarmStream();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<{ id: string; title: string; status: string }[]>([]);

  const liveAgents = agents.length ? agents : fallbackAgents;
  const liveMetrics = metrics ?? fallbackMetrics;
  const liveActivity = activity.length ? activity : defaultActivity;
  const activeTasks = liveAgents.filter((a) => a.status === "busy").length;

  async function runSwarm() {
    try {
      await apiFetch("/api/agents/swarm/run", {
        method: "POST",
        body: { objective: "Analisar e otimizar o Princy Core" }
      });
      toast.show("Swarm iniciado");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Falha ao iniciar swarm");
    }
  }

  async function openHistory() {
    try {
      const data = await apiFetch<{ history: { id: string; task?: { title: string; status: string } }[] }>("/api/agents/history?limit=20");
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
      <div className={`swarm-view__canvas ${activeTasks > 0 ? "swarm-view__canvas--active" : ""}`}>
        <div className="swarm-view__bg-wrap" aria-hidden>
          <Image
            src="/princy/galaxy-bg.webp"
            alt=""
            fill
            className="swarm-view__bg"
            style={{ objectFit: "cover", objectPosition: "55% 60%", opacity: 0.35 }}
          />
        </div>
        <NeuralConnections agents={liveAgents} intensity={Math.min(1, 0.3 + pulse * 0.1 + activeTasks * 0.15)} />
        <motion.div
          className="swarm-view__brain-wrap"
          animate={activeTasks > 0 ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 2, repeat: activeTasks > 0 ? Infinity : 0 }}
        >
          <NeuralGlow size={360} />
          <Image
            src="/princy/swarm-brain.png"
            alt="Cérebro neural"
            width={280}
            height={280}
            className="swarm-view__brain"
            style={{ objectFit: "cover", objectPosition: "72% 72%" }}
          />
        </motion.div>
        {liveAgents.map((agent) => (
          <AgentHoloCard key={agent.id} agent={agent} />
        ))}
      </div>
      <aside className="swarm-view__panel glass-panel luminous-border">
        <h2 className="swarm-view__panel-title">SWARM STATUS</h2>
        <dl className="swarm-view__metrics">
          <div><dt>Agentes Ativos</dt><dd>{liveMetrics.activeAgents ?? "8/8"}</dd></div>
          <div><dt>Tarefas Hoje</dt><dd>{liveMetrics.tasksToday}</dd></div>
          <div><dt>Taxa de Sucesso</dt><dd>{liveMetrics.successRate}%</dd></div>
          <div><dt>Tempo Médio</dt><dd>{liveMetrics.avgTime}</dd></div>
          <div><dt>Tokens</dt><dd>{liveMetrics.tokens}</dd></div>
          {liveMetrics.uptime ? <div><dt>Uptime</dt><dd>{liveMetrics.uptime}</dd></div> : null}
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
      </aside>
      {historyOpen ? (
        <div className="swarm-history-modal glass-panel luminous-border">
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
