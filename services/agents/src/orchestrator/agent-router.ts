import type { AgentType } from "@princy/database";
import { ArchitectAgent } from "../agents/architect.agent.js";
import { AutoAgent } from "../agents/auto.agent.js";
import { CoderAgent } from "../agents/coder.agent.js";
import { DebuggerAgent } from "../agents/debugger.agent.js";
import { PlannerAgent } from "../agents/planner.agent.js";
import { ReviewerAgent } from "../agents/reviewer.agent.js";
import { TerminalAgent } from "../agents/terminal.agent.js";
import type { BaseAgent } from "../agents/base.agent.js";

const agents: Record<AgentType, BaseAgent> = {
  PLANNER: new PlannerAgent(),
  CODER: new CoderAgent(),
  REVIEWER: new ReviewerAgent(),
  DEBUGGER: new DebuggerAgent(),
  ARCHITECT: new ArchitectAgent(),
  TERMINAL: new TerminalAgent(),
  AUTO: new AutoAgent()
};

export class AgentRouter {
  resolve(type: AgentType): BaseAgent {
    return agents[type] ?? agents.AUTO;
  }
}
