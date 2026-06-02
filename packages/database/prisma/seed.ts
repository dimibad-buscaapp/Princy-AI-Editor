import { AgentKind, UserRole } from "@prisma/client";
import { prisma } from "../src/client.js";

const agents = [
  { kind: AgentKind.AUTO, name: "Auto", description: "Selects the best agent for each task." },
  { kind: AgentKind.PLANNER, name: "Planner", description: "Breaks requests into actionable implementation plans." },
  { kind: AgentKind.CODER, name: "Coder", description: "Implements code changes." },
  { kind: AgentKind.REVIEWER, name: "Reviewer", description: "Reviews code for risks and regressions." },
  { kind: AgentKind.DEBUGGER, name: "Debugger", description: "Investigates failures and runtime errors." },
  { kind: AgentKind.ARCHITECT, name: "Architect", description: "Designs technical architecture." },
  { kind: AgentKind.TERMINAL, name: "Terminal", description: "Runs commands and explains terminal output." }
];

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@princy.local" },
    update: {},
    create: {
      email: "admin@princy.local",
      name: "Princy Admin",
      role: UserRole.ADMIN
    }
  });

  for (const agent of agents) {
    await prisma.agent.upsert({
      where: { kind: agent.kind },
      update: {
        name: agent.name,
        description: agent.description,
        enabled: true
      },
      create: agent
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
