export type SwarmAgent = {
  id: string;
  name: string;
  role: string;
  status: "online" | "busy" | "idle";
  tasks: number;
  success: number;
  x: number;
  y: number;
  featured?: boolean;
  compact?: boolean;
};

export const SWARM_DISPLAY_NAMES: Record<string, string> = {
  ARCHITECT: "ARQUITETO",
  REVIEWER: "ANALISTA",
  DEVELOPER: "DESENVOLVEDOR",
  RESEARCHER: "PESQUISADOR",
  TESTER: "TESTADOR",
  WRITER: "ESCRITOR",
  DEVOPS: "DEVOPS",
  COORDINATOR: "COORDENADOR",
  MEMORY: "MEMORY ENGINE",
  CONTEXT_GRAPH: "AUTONOMOUS ENGINE"
};

export const SWARM_ORBITAL_POSITIONS: Record<string, { x: number; y: number; featured?: boolean; compact?: boolean }> = {
  ARCHITECT: { x: 50, y: 8 },
  RESEARCHER: { x: 18, y: 18 },
  REVIEWER: { x: 82, y: 18 },
  DEVELOPER: { x: 8, y: 42 },
  TESTER: { x: 92, y: 42 },
  WRITER: { x: 12, y: 68 },
  DEVOPS: { x: 88, y: 68 },
  COORDINATOR: { x: 50, y: 88, featured: true },
  MEMORY: { x: 32, y: 6, compact: true },
  CONTEXT_GRAPH: { x: 68, y: 6, compact: true }
};

export const swarmMetrics = {
  activeAgents: "10/10",
  tasksToday: 898,
  successRate: 97.8,
  avgTime: "2.4s",
  tokens: "2.4M",
  uptime: "—"
};

export const swarmActivity = [
  { text: "Arquiteto criou plano", time: "há 2 min" },
  { text: "Desenvolvedor implementou feature", time: "há 3 min" },
  { text: "Testador validou mudanças", time: "há 4 min" },
  { text: "DevOps fez deploy", time: "há 5 min" }
];

/** 10-agent orbital layout calibrated for Princy Neural Core reference */
export const swarmAgents: SwarmAgent[] = [
  { id: "ARCHITECT", name: "ARQUITETO", role: "ARCHITECT", status: "online", tasks: 128, success: 98.2, x: 50, y: 8 },
  { id: "RESEARCHER", name: "PESQUISADOR", role: "RESEARCHER", status: "online", tasks: 143, success: 99.0, x: 18, y: 18 },
  { id: "REVIEWER", name: "ANALISTA", role: "REVIEWER", status: "online", tasks: 64, success: 99.1, x: 82, y: 18 },
  { id: "DEVELOPER", name: "DESENVOLVEDOR", role: "DEVELOPER", status: "online", tasks: 256, success: 98.7, x: 8, y: 42 },
  { id: "TESTER", name: "TESTADOR", role: "TESTER", status: "online", tasks: 112, success: 96.3, x: 92, y: 42 },
  { id: "WRITER", name: "ESCRITOR", role: "WRITER", status: "online", tasks: 87, success: 95.8, x: 12, y: 68 },
  { id: "DEVOPS", name: "DEVOPS", role: "DEVOPS", status: "online", tasks: 76, success: 97.6, x: 88, y: 68 },
  { id: "COORDINATOR", name: "COORDENADOR", role: "COORDINATOR", status: "online", tasks: 256, success: 100, x: 50, y: 88, featured: true },
  { id: "MEMORY", name: "MEMORY ENGINE", role: "MEMORY", status: "online", tasks: 42, success: 99.5, x: 32, y: 6, compact: true },
  { id: "CONTEXT_GRAPH", name: "AUTONOMOUS ENGINE", role: "CONTEXT_GRAPH", status: "online", tasks: 38, success: 98.7, x: 68, y: 6, compact: true }
];

export function normalizeSwarmAgent(agent: SwarmAgent): SwarmAgent {
  const role = agent.role || agent.id;
  const pos = SWARM_ORBITAL_POSITIONS[role];
  return {
    ...agent,
    name: SWARM_DISPLAY_NAMES[role] ?? agent.name,
    x: pos?.x ?? agent.x,
    y: pos?.y ?? agent.y,
    featured: pos?.featured ?? agent.featured,
    compact: pos?.compact ?? agent.compact
  };
}
