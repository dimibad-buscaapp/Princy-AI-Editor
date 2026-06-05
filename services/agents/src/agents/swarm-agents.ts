import { ArchitectAgent } from "./architect.agent.js";
import { CoderAgent } from "./coder.agent.js";
import { DebuggerAgent } from "./debugger.agent.js";
import { PlannerAgent } from "./planner.agent.js";
import { ReviewerAgent } from "./reviewer.agent.js";
import { TerminalAgent } from "./terminal.agent.js";
import { BaseAgent, type AgentContext, type AgentResult } from "./base.agent.js";
import type { AgentType } from "@princy/database";
import type { SwarmRole } from "../swarm/swarm-registry.js";

export class DeveloperAgent extends CoderAgent {
  readonly swarmRole = "DEVELOPER" as const;
}

export class TesterAgent extends DebuggerAgent {
  readonly swarmRole = "TESTER" as const;
}

export class DevOpsAgent extends TerminalAgent {
  readonly swarmRole = "DEVOPS" as const;
}

export class AnalystAgent extends PlannerAgent {
  readonly swarmRole = "ANALYST" as const;
}

export class WriterAgent extends BaseAgent {
  readonly type = "REVIEWER" as const;
  readonly swarmRole = "WRITER" as const;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are a technical writer agent. Produce clear documentation.",
      `Objective: ${ctx.objective}\nContext: ${ctx.context ?? ""}`
    );
    return { output, metadata: { kind: "writer" } };
  }
}

export class ResearchAgent extends BaseAgent {
  readonly type = "PLANNER" as const;
  readonly swarmRole = "RESEARCHER" as const;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const memoryUrl = process.env.MEMORY_SERVICE_URL ?? "http://127.0.0.1:3405";
    let rag = "";
    try {
      const res = await fetch(`${memoryUrl}/memory/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: ctx.objective, limit: 5 })
      });
      if (res.ok) {
        const data = (await res.json()) as { results?: { content: string }[] };
        rag = data.results?.map((r) => r.content).join("\n") ?? "";
      }
    } catch {
      // memory optional
    }
    const output = await this.prompt(
      "You are a research agent. Summarize findings with sources from context.",
      `Objective: ${ctx.objective}\nMemory: ${rag}\nContext: ${ctx.context ?? ""}`
    );
    return { output, metadata: { kind: "research", ragHits: rag.length } };
  }
}

export class CoordinatorAgent extends BaseAgent {
  readonly type = "AUTO" as const;
  readonly swarmRole = "COORDINATOR" as const;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are the swarm coordinator. Break the objective into steps for specialized agents.",
      `Objective: ${ctx.objective}\nContext: ${ctx.context ?? ""}`
    );
    return { output, metadata: { kind: "coordinator" } };
  }
}

export const SWARM_PIPELINE: { role: SwarmRole; agent: BaseAgent }[] = [
  { role: "COORDINATOR", agent: new CoordinatorAgent() },
  { role: "ARCHITECT", agent: new ArchitectAgent() },
  { role: "DEVELOPER", agent: new DeveloperAgent() },
  { role: "TESTER", agent: new TesterAgent() },
  { role: "ANALYST", agent: new AnalystAgent() },
  { role: "DEVOPS", agent: new DevOpsAgent() }
];

export function mapSwarmToAgentType(role: SwarmRole): AgentType {
  const map: Record<SwarmRole, AgentType> = {
    COORDINATOR: "AUTO",
    ARCHITECT: "ARCHITECT",
    DEVELOPER: "CODER",
    TESTER: "DEBUGGER",
    ANALYST: "PLANNER",
    DEVOPS: "TERMINAL",
    RESEARCHER: "PLANNER",
    WRITER: "REVIEWER"
  };
  return map[role];
}
