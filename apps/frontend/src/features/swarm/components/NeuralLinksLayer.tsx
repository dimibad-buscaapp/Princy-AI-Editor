"use client";

import type { SwarmAgent } from "../swarm-data";

type NeuralLinksLayerProps = {
  agents: SwarmAgent[];
  centerX?: number;
  centerY?: number;
  intensity?: number;
};

function bezierPath(x1: number, y1: number, x2: number, y2: number, seed: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx1 = x1 + dx * 0.35 + Math.sin(seed) * 6;
  const cy1 = y1 + dy * 0.15 + Math.cos(seed) * 4;
  const cx2 = x1 + dx * 0.65 + Math.cos(seed * 1.3) * 5;
  const cy2 = y1 + dy * 0.85 + Math.sin(seed * 1.3) * 4;
  return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
}

export function NeuralLinksLayer({
  agents,
  centerX = 50,
  centerY = 48,
  intensity = 0.6
}: NeuralLinksLayerProps) {
  const alpha = Math.min(1, 0.4 + intensity * 0.5);

  return (
    <svg className="neural-links-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="neuralLinkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00FFFF" stopOpacity={0.3 * alpha} />
          <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.9 * alpha} />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.3 * alpha} />
        </linearGradient>
        <filter id="neuralLinkGlow">
          <feGaussianBlur stdDeviation="0.35" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {agents.map((agent, i) => {
        const d = bezierPath(centerX, centerY, agent.x, agent.y, i * 1.7);
        const duration = 2.5 + i * 0.25;
        return (
          <g key={`link-${agent.id}`} filter="url(#neuralLinkGlow)" opacity={agent.compact ? 0.5 : 0.75}>
            <path
              className={`neural-links-layer__path ${agent.compact ? "neural-links-layer__path--dim" : ""}`}
              d={d}
              stroke="url(#neuralLinkGrad)"
              style={{ animationDuration: `${duration}s`, animationDelay: `${i * 0.15}s` }}
            />
            <circle className="neural-links-layer__particle" r="0.35" fill="#00FFFF">
              <animateMotion
                dur={`${duration}s`}
                repeatCount="indefinite"
                path={d}
                begin={`${i * 0.2}s`}
              />
            </circle>
            <circle className="neural-links-layer__particle" r="0.25" fill="#8B5CF6" opacity={0.8}>
              <animateMotion
                dur={`${duration + 1.2}s`}
                repeatCount="indefinite"
                path={d}
                begin={`${i * 0.35 + 0.5}s`}
              />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}
