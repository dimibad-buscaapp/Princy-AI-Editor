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
};

export const swarmMetrics = {
  activeAgents: "8/8",
  tasksToday: 0,
  successRate: 0,
  avgTime: "—",
  tokens: "0",
  uptime: "—"
};

export const swarmActivity = [
  { text: "Arquiteto criou plano", time: "há 2 min" },
  { text: "Desenvolvedor implementou feature", time: "há 5 min" },
  { text: "Testador validou mudanças", time: "há 8 min" },
  { text: "Coordenador sincronizou swarm", time: "há 12 min" }
];

export const swarmAgents: SwarmAgent[] = [
  { id: "architect", name: "ARQUITETO", role: "ARCHITECT", status: "online", tasks: 142, success: 98.2, x: 50, y: 8 },
  { id: "analyst", name: "ANALISTA", role: "ANALYST", status: "online", tasks: 98, success: 97.5, x: 82, y: 22 },
  { id: "researcher", name: "PESQUISADOR", role: "RESEARCHER", status: "online", tasks: 156, success: 96.8, x: 92, y: 46 },
  { id: "writer", name: "ESCRITOR", role: "WRITER", status: "online", tasks: 76, success: 99.1, x: 78, y: 74 },
  { id: "coordinator", name: "COORDENADOR", role: "COORDINATOR", status: "online", tasks: 256, success: 98.9, x: 50, y: 90, featured: true },
  { id: "devops", name: "DEVOPS", role: "DEVOPS", status: "online", tasks: 112, success: 97.2, x: 16, y: 74 },
  { id: "tester", name: "TESTADOR", role: "TESTER", status: "online", tasks: 89, success: 99.4, x: 8, y: 46 },
  { id: "developer", name: "DESENVOLVEDOR", role: "DEVELOPER", status: "online", tasks: 198, success: 98.0, x: 18, y: 22 }
];
