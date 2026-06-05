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
  x?: number;
  y?: number;
};

export function AgentHoloCard({ agent }: { agent: AgentCardData }) {
  const busy = agent.status === "busy";
  return (
    <motion.div
      className={`agent-holo-card glass-panel luminous-border ${agent.featured ? "agent-holo-card--featured" : ""} ${busy ? "agent-holo-card--busy" : ""}`}
      style={{ left: `${agent.x ?? 0}%`, top: `${agent.y ?? 0}%` }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, boxShadow: "0 0 24px rgba(0,242,255,0.3)" }}
    >
      <div className="agent-holo-card__head">
        <Image src="/princy/logo-alien.png" alt="" width={24} height={24} />
        <div>
          <h4>{agent.name}</h4>
          <span className="agent-holo-card__online">
            <span className="agent-holo-card__dot" /> Online
          </span>
        </div>
      </div>
      {agent.featured ? (
        <>
          <p className="agent-holo-card__featured">Orquestrando 8 agentes</p>
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
