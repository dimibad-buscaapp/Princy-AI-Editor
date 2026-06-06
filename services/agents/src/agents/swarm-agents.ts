import { ArchitectAgent } from "./architect.agent.js";
import { CoderAgent } from "./coder.agent.js";
import { ContextGraphAgent } from "./context-graph.agent.js";
import { DebuggerAgent } from "./debugger.agent.js";
import { MemoryAgent } from "./memory.agent.js";
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

export class ReviewerSwarmAgent extends ReviewerAgent {
  readonly swarmRole = "REVIEWER" as const;
}

export class WriterAgent extends BaseAgent {
  readonly type = "REVIEWER" as const;
  readonly swarmRole = "WRITER" as const;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are a technical writer agent. Produce clear documentation.",
      `Objective: ${ctx.objective}\nContext: ${ctx.context ?? ""}\nPrior: ${ctx.previousOutput ?? ""}`,
      "chat"
    );
    return { output, metadata: { kind: "writer" } };
  }
}

export class ResearchAgent extends BaseAgent {
  readonly type = "PLANNER" as const;
  readonly swarmRole = "RESEARCHER" as const;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const memory = new MemoryAgent();
    const memResult = await memory.run(ctx);
    const output = await this.prompt(
      "You are a research agent. Summarize findings with sources from context.",
      `Objective: ${ctx.objective}\nMemory: ${memResult.output}\nContext: ${ctx.context ?? ""}`,
      "plan"
    );
    return { output, metadata: { kind: "research", memoryHits: memResult.metadata?.hits } };
  }
}

export class CoordinatorAgent extends BaseAgent {
  readonly type = "AUTO" as const;
  readonly swarmRole = "COORDINATOR" as const;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const output = await this.prompt(
      "You are the Princy Neural Core coordinator. Break the objective into steps for specialized agents.",
      `Objective: ${ctx.objective}\nContext: ${ctx.context ?? ""}`,
      "plan"
    );
    return { output, metadata: { kind: "coordinator" } };
  }
}

/** Full swarm pipeline with support agents */
export const SWARM_PIPELINE: { role: SwarmRole; agent: BaseAgent }[] = [
  { role: "COORDINATOR", agent: new CoordinatorAgent() },
  { role: "RESEARCHER", agent: new ResearchAgent() },
  { role: "MEMORY", agent: new MemoryAgent() },
  { role: "CONTEXT_GRAPH", agent: new ContextGraphAgent() },
  { role: "ARCHITECT", agent: new ArchitectAgent() },
  { role: "DEVELOPER", agent: new DeveloperAgent() },
  { role: "TESTER", agent: new TesterAgent() },
  { role: "REVIEWER", agent: new ReviewerSwarmAgent() },
  { role: "WRITER", agent: new WriterAgent() },
  { role: "DEVOPS", agent: new DevOpsAgent() }
];

/** Official autonomous pipeline */
export const AUTONOMOUS_PIPELINE: { role: SwarmRole; agent: BaseAgent }[] = [
  { role: "COORDINATOR", agent: new CoordinatorAgent() },
  { role: "ARCHITECT", agent: new ArchitectAgent() },
  { role: "DEVELOPER", agent: new DeveloperAgent() },
  { role: "TESTER", agent: new TesterAgent() },
  { role: "REVIEWER", agent: new ReviewerSwarmAgent() },
  { role: "DEVOPS", agent: new DevOpsAgent() }
];

export function mapSwarmToAgentType(role: SwarmRole): AgentType {
  const map: Record<SwarmRole, AgentType> = {
    COORDINATOR: "AUTO",
    ARCHITECT: "ARCHITECT",
    DEVELOPER: "CODER",
    TESTER: "DEBUGGER",
    REVIEWER: "REVIEWER",
    DEVOPS: "TERMINAL",
    RESEARCHER: "PLANNER",
    WRITER: "REVIEWER",
    MEMORY: "PLANNER",
    CONTEXT_GRAPH: "ARCHITECT"
  };
  return map[role];
}

const SWARM_CHAT_AGENTS = new Map<SwarmRole, BaseAgent>(
  SWARM_PIPELINE.map((step) => [step.role, step.agent])
);

/** Resolve swarm-specific agents for direct chat routing (not collapsed to 7 DB types). */
export function resolveSwarmChatAgent(role: string): BaseAgent | null {
  return SWARM_CHAT_AGENTS.get(role as SwarmRole) ?? null;
}

export const SWARM_CHAT_ROLES = [...SWARM_CHAT_AGENTS.keys()] as SwarmRole[];
