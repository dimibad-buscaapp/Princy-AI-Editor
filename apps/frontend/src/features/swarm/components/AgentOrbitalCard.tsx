"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type AgentCardData = {
  id: string;
  name: string;
  status?: string;
  tasks?: number;
  success?: number;
  featured?: boolean;
  compact?: boolean;
  x?: number;
  y?: number;
};

export function AgentOrbitalCard({ agent }: { agent: AgentCardData }) {
  const busy = agent.status === "busy";
  return (
    <motion.div
      className={`agent-orbital-card ${agent.featured ? "agent-orbital-card--featured" : ""} ${agent.compact ? "agent-orbital-card--compact" : ""} ${busy ? "agent-orbital-card--busy" : ""}`}
      style={{ left: `${agent.x ?? 0}%`, top: `${agent.y ?? 0}%` }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="agent-orbital-card__head">
        <Image
          src="/princy/logo-alien.png"
          alt=""
          width={agent.compact ? 18 : 22}
          height={agent.compact ? 18 : 22}
          className="agent-orbital-card__icon"
        />
        <div>
          <h4>{agent.name}</h4>
          <span className="agent-orbital-card__online">
            <span className="agent-orbital-card__dot" /> {busy ? "Ocupado" : "Online"}
          </span>
        </div>
      </div>
      {agent.featured ? (
        <>
          <p className="agent-orbital-card__featured">Orquestrando 10 agentes</p>
          <p>Sincronização: 100%</p>
        </>
      ) : (
        <>
          <p>Tarefas: {agent.tasks}</p>
          <p>Sucesso: {agent.success}%</p>
        </>
      )}
    </motion.div>
  );
}
