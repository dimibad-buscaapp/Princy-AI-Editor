"use client";

import Image from "next/image";
import { NeuralGlow } from "../../design-system/NeuralGlow";
import { GlowButton } from "../../design-system/GlowButton";
import { AgentHoloCard } from "./AgentHoloCard";
import { NeuralConnections } from "./NeuralConnections";
import { swarmActivity, swarmAgents, swarmMetrics } from "./swarm-data";

export function SwarmView() {
  return (
    <div className="swarm-view">
      <div className="swarm-view__canvas">
        <div className="swarm-view__bg-wrap" aria-hidden>
          <Image
            src="/princy/galaxy-bg.webp"
            alt=""
            fill
            className="swarm-view__bg"
            style={{ objectFit: "cover", objectPosition: "55% 60%", opacity: 0.35 }}
          />
        </div>
        <NeuralConnections agents={swarmAgents} />
        <div className="swarm-view__brain-wrap">
          <NeuralGlow size={360} />
          <Image
            src="/princy/swarm-brain.png"
            alt="Cérebro neural"
            width={280}
            height={280}
            className="swarm-view__brain"
            style={{ objectFit: "cover", objectPosition: "72% 72%" }}
          />
        </div>
        {swarmAgents.map((agent) => (
          <AgentHoloCard key={agent.id} agent={agent} />
        ))}
      </div>
      <aside className="swarm-view__panel glass-panel luminous-border">
        <h2 className="swarm-view__panel-title">SWARM STATUS</h2>
        <dl className="swarm-view__metrics">
          <div><dt>Agentes Ativos</dt><dd>{swarmMetrics.activeAgents}</dd></div>
          <div><dt>Tarefas Hoje</dt><dd>{swarmMetrics.tasksToday}</dd></div>
          <div><dt>Taxa de Sucesso</dt><dd>{swarmMetrics.successRate}%</dd></div>
          <div><dt>Tempo Médio</dt><dd>{swarmMetrics.avgTime}</dd></div>
          <div><dt>Tokens</dt><dd>{swarmMetrics.tokens}</dd></div>
        </dl>
        <h3 className="swarm-view__activity-title">ATIVIDADE RECENTE</h3>
        <ul className="swarm-view__activity">
          {swarmActivity.map((item) => (
            <li key={item.text}>
              <span>{item.text}</span>
              <small>{item.time}</small>
            </li>
          ))}
        </ul>
        <GlowButton variant="violet" className="swarm-view__cta" onClick={() => console.info("Ver todas as tarefas")}>
          Ver Todas as Tarefas
        </GlowButton>
      </aside>
    </div>
  );
}
