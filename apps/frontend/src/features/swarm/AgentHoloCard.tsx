"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { SwarmAgent } from "./swarm-data";

export function AgentHoloCard({ agent }: { agent: SwarmAgent }) {
  return (
    <motion.div
      className={`agent-holo-card glass-panel luminous-border ${agent.featured ? "agent-holo-card--featured" : ""}`}
      style={{ left: `${agent.x}%`, top: `${agent.y}%` }}
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
      {agent.featured ? <p className="agent-holo-card__featured">Orquestrador central do swarm</p> : null}
      <p>Tarefas: {agent.tasks}</p>
      <p>Sucesso: {agent.success}%</p>
    </motion.div>
  );
}
