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
  tasksToday: 898,
  successRate: 97.8,
  avgTime: "2.4s",
  tokens: "2.4M"
};

export const swarmActivity = [
  { text: "Arquiteto concluiu análise de arquitetura", time: "há 1 min" },
  { text: "Desenvolvedor aplicou patch em chat.routes.ts", time: "há 3 min" },
  { text: "Testador validou suite de integração", time: "há 5 min" },
  { text: "Coordenador orquestrou 12 tarefas paralelas", time: "há 8 min" }
];

export const swarmAgents: SwarmAgent[] = [
  { id: "architect", name: "ARQUITETO", role: "ARCHITECT", status: "online", tasks: 142, success: 98.2, x: 50, y: 14 },
  { id: "analyst", name: "ANALISTA", role: "ANALYST", status: "online", tasks: 98, success: 97.5, x: 80, y: 24 },
  { id: "researcher", name: "PESQUISADOR", role: "RESEARCHER", status: "online", tasks: 156, success: 96.8, x: 90, y: 48 },
  { id: "writer", name: "ESCRITOR", role: "WRITER", status: "online", tasks: 76, success: 99.1, x: 76, y: 76 },
  { id: "coordinator", name: "COORDENADOR", role: "COORDINATOR", status: "online", tasks: 256, success: 98.9, x: 50, y: 86, featured: true },
  { id: "devops", name: "DEVOPS", role: "DEVOPS", status: "online", tasks: 112, success: 97.2, x: 18, y: 76 },
  { id: "tester", name: "TESTADOR", role: "TESTER", status: "online", tasks: 89, success: 99.4, x: 10, y: 48 },
  { id: "developer", name: "DESENVOLVEDOR", role: "DEVELOPER", status: "online", tasks: 198, success: 98.0, x: 20, y: 24 }
];
