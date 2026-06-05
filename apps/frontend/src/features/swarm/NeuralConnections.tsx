"use client";

import { motion } from "framer-motion";
import type { SwarmAgent } from "./swarm-data";

type NeuralConnectionsProps = {
  agents: SwarmAgent[];
  centerX?: number;
  centerY?: number;
};

function lightningPath(x1: number, y1: number, x2: number, y2: number, seed: number) {
  const mx = (x1 + x2) / 2 + Math.sin(seed) * 4;
  const my = (y1 + y2) / 2 + Math.cos(seed) * 4;
  return `M ${x1} ${y1} L ${mx} ${my} L ${x2} ${y2}`;
}

export function NeuralConnections({ agents, centerX = 50, centerY = 52 }: NeuralConnectionsProps) {
  return (
    <svg className="neural-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00f2ff" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#7000ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#00f2ff" stopOpacity="0.2" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="0.3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {[22, 32, 42].map((r) => (
        <circle
          key={r}
          cx={centerX}
          cy={centerY}
          r={r}
          fill="none"
          stroke="rgba(0,242,255,0.12)"
          strokeWidth="0.15"
          strokeDasharray="2 3"
        />
      ))}
      {agents.map((agent, i) => {
        const d = lightningPath(centerX, centerY, agent.x, agent.y, i * 1.7);
        return (
          <g key={agent.id} filter="url(#glow)">
            <motion.path
              d={d}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="0.2"
              initial={{ pathLength: 0, opacity: 0.3 }}
              animate={{ pathLength: 1, opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2 + i * 0.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
              r="0.35"
              fill="#00f2ff"
              animate={{
                cx: [centerX, agent.x, centerX],
                cy: [centerY, agent.y, centerY]
              }}
              transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "linear" }}
            />
          </g>
        );
      })}
    </svg>
  );
}
