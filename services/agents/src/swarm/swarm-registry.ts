export type SwarmRole =
  | "COORDINATOR"
  | "ARCHITECT"
  | "DEVELOPER"
  | "TESTER"
  | "REVIEWER"
  | "RESEARCHER"
  | "DEVOPS"
  | "WRITER"
  | "MEMORY"
  | "CONTEXT_GRAPH";

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
  compact?: boolean;
};

const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL ?? "qwen2.5:3b";
const REASON_MODEL = process.env.DEFAULT_REASONING_MODEL ?? "deepseek-r1:8b";

const DEFAULT_AGENTS: SwarmAgentLive[] = [
  { id: "COORDINATOR", name: "COORDENADOR", role: "COORDINATOR", status: "online", model: REASON_MODEL, tasks: 0, success: 0, memory: "—", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 50, y: 52, featured: true },
  { id: "ARCHITECT", name: "ARQUITETO", role: "ARCHITECT", status: "online", model: REASON_MODEL, tasks: 0, success: 0, memory: "—", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 50, y: 10 },
  { id: "DEVELOPER", name: "DESENVOLVEDOR", role: "DEVELOPER", status: "online", model: CHAT_MODEL, tasks: 0, success: 0, memory: "—", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 14, y: 22 },
  { id: "TESTER", name: "TESTADOR", role: "TESTER", status: "online", model: CHAT_MODEL, tasks: 0, success: 0, memory: "—", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 10, y: 50 },
  { id: "REVIEWER", name: "REVISOR", role: "REVIEWER", status: "online", model: REASON_MODEL, tasks: 0, success: 0, memory: "—", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 14, y: 78 },
  { id: "RESEARCHER", name: "PESQUISADOR", role: "RESEARCHER", status: "online", model: REASON_MODEL, tasks: 0, success: 0, memory: "—", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 86, y: 22 },
  { id: "DEVOPS", name: "DEVOPS", role: "DEVOPS", status: "online", model: CHAT_MODEL, tasks: 0, success: 0, memory: "—", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 86, y: 78 },
  { id: "WRITER", name: "ESCRITOR", role: "WRITER", status: "online", model: CHAT_MODEL, tasks: 0, success: 0, memory: "—", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 90, y: 50 },
  { id: "MEMORY", name: "MEMÓRIA", role: "MEMORY", status: "online", model: "nomic-embed-text", tasks: 0, success: 0, memory: "—", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 72, y: 12, compact: true },
  { id: "CONTEXT_GRAPH", name: "GRAPH", role: "CONTEXT_GRAPH", status: "online", model: REASON_MODEL, tasks: 0, success: 0, memory: "—", logs: [], metrics: { tokens: 0, latencyMs: 0 }, x: 28, y: 12, compact: true }
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
    const active = this.getAgents().filter((a) => a.status === "busy").length;
    return {
      activeAgents: `${Math.max(active, 1)}/10`,
      tasksToday: this.totalTasks,
      successRate: this.runCount ? Math.round((this.successCount / this.runCount) * 1000) / 10 : 0,
      avgTime: this.runCount ? `${Math.round(2400 / Math.max(this.runCount, 1))}ms` : "—",
      tokens: this.totalTokens > 1_000_000 ? `${(this.totalTokens / 1_000_000).toFixed(1)}M` : `${this.totalTokens}`,
      latencyMs: 2400,
      memory: "2.4M",
      uptime: `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m`
    };
  }
}

export const swarmRegistry = new SwarmRegistry();
