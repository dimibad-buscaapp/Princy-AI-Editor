export type SwarmRole =
  | "ARCHITECT"
  | "DEVELOPER"
  | "RESEARCHER"
  | "TESTER"
  | "DEVOPS"
  | "WRITER"
  | "ANALYST"
  | "COORDINATOR";

export type SwarmAgentLive = {
  id: SwarmRole;
  name: string;
  role: SwarmRole;
  status: "online" | "busy" | "idle";
  model: string;
  tasks: number;
  success: number;
  memory: string;
  logs: string[];
  metrics: { tokens: number; latencyMs: number };
  x: number;
  y: number;
  featured?: boolean;
};

const DEFAULT_AGENTS: SwarmAgentLive[] = [
  { id: "ARCHITECT", name: "ARQUITETO", role: "ARCHITECT", status: "online", model: "qwen3:8b", tasks: 142, success: 98.2, memory: "2.1MB", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 50, y: 8 },
  { id: "ANALYST", name: "ANALISTA", role: "ANALYST", status: "online", model: "qwen3:8b", tasks: 98, success: 97.5, memory: "1.4MB", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 82, y: 22 },
  { id: "RESEARCHER", name: "PESQUISADOR", role: "RESEARCHER", status: "online", model: "qwen3:8b", tasks: 156, success: 96.8, memory: "3.2MB", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 92, y: 46 },
  { id: "WRITER", name: "ESCRITOR", role: "WRITER", status: "online", model: "qwen3:8b", tasks: 76, success: 99.1, memory: "0.9MB", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 78, y: 74 },
  { id: "COORDINATOR", name: "COORDENADOR", role: "COORDINATOR", status: "online", model: "qwen3:8b", tasks: 256, success: 98.9, memory: "4.0MB", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 50, y: 90, featured: true },
  { id: "DEVOPS", name: "DEVOPS", role: "DEVOPS", status: "online", model: "qwen3:8b", tasks: 112, success: 97.2, memory: "1.8MB", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 16, y: 74 },
  { id: "TESTER", name: "TESTADOR", role: "TESTER", status: "online", model: "qwen3:8b", tasks: 89, success: 99.4, memory: "1.1MB", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 8, y: 46 },
  { id: "DEVELOPER", name: "DESENVOLVEDOR", role: "DEVELOPER", status: "online", model: "qwen3:8b", tasks: 198, success: 98.0, memory: "2.8MB", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 18, y: 22 }
];

class SwarmRegistry {
  private agents = new Map<SwarmRole, SwarmAgentLive>();
  private startedAt = Date.now();
  private totalTokens = 0;
  private totalTasks = 0;
  private successCount = 0;
  private runCount = 0;

  constructor() {
    for (const agent of DEFAULT_AGENTS) {
      this.agents.set(agent.id, { ...agent, logs: [...agent.logs] });
    }
  }

  getAgents() {
    return [...this.agents.values()];
  }

  setStatus(role: SwarmRole, status: SwarmAgentLive["status"]) {
    const agent = this.agents.get(role);
    if (agent) agent.status = status;
  }

  recordRun(role: SwarmRole, log: string, tokens = 0, latencyMs = 0, ok = true) {
    const agent = this.agents.get(role);
    if (!agent) return;
    agent.tasks += 1;
    agent.status = "busy";
    agent.logs = [log, ...agent.logs].slice(0, 20);
    agent.metrics.tokens += tokens;
    agent.metrics.latencyMs = latencyMs;
    this.totalTasks += 1;
    this.totalTokens += tokens;
    this.runCount += 1;
    if (ok) this.successCount += 1;
    const rate = (this.successCount / Math.max(this.runCount, 1)) * 100;
    agent.success = Math.round(rate * 10) / 10;
    setTimeout(() => {
      if (agent.status === "busy") agent.status = "online";
    }, 3000);
  }

  getMetrics() {
    const uptimeSec = Math.floor((Date.now() - this.startedAt) / 1000);
    const tasksToday = this.totalTasks + DEFAULT_AGENTS.reduce((s, a) => s + a.tasks, 0);
    return {
      activeAgents: `${this.getAgents().filter((a) => a.status !== "idle").length}/8`,
      tasksToday,
      successRate: this.runCount ? Math.round((this.successCount / this.runCount) * 1000) / 10 : 97.8,
      avgTime: "2.4s",
      tokens: this.totalTokens > 1_000_000 ? `${(this.totalTokens / 1_000_000).toFixed(1)}M` : `${Math.round(this.totalTokens / 1000)}K`,
      latencyMs: 2400,
      memory: "2.4M",
      uptime: `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`
    };
  }
}

export const swarmRegistry = new SwarmRegistry();
