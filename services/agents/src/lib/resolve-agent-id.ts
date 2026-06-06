import type { AgentType } from "@princy/database";
import { prisma } from "@princy/database";
import { HttpError } from "@princy/core";

const SWARM_ROLES = new Set([
  "COORDINATOR",
  "ARCHITECT",
  "DEVELOPER",
  "TESTER",
  "REVIEWER",
  "DEVOPS"
]);

const TYPE_TO_ROLE: Partial<Record<AgentType, string>> = {
  AUTO: "COORDINATOR",
  ARCHITECT: "ARCHITECT",
  CODER: "DEVELOPER",
  DEBUGGER: "TESTER",
  REVIEWER: "REVIEWER",
  TERMINAL: "DEVOPS",
  PLANNER: "COORDINATOR"
};

export async function resolveAgentIdentifier(agentId: string): Promise<string> {
  const normalized = agentId.toUpperCase();
  if (SWARM_ROLES.has(normalized)) {
    return normalized;
  }

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (agent) {
    const role = TYPE_TO_ROLE[agent.type];
    if (role) return role;
  }

  throw new HttpError(404, "not_found", `Unknown agent: ${agentId}`);
}
