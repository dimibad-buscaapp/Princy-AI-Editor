import bcrypt from "bcryptjs";
import { AgentType, UserRole } from "@prisma/client";
import { prisma } from "../src/client.js";

const agents = [
  { type: AgentType.AUTO, name: "Auto" },
  { type: AgentType.PLANNER, name: "Planner" },
  { type: AgentType.CODER, name: "Coder" },
  { type: AgentType.REVIEWER, name: "Reviewer" },
  { type: AgentType.DEBUGGER, name: "Debugger" },
  { type: AgentType.ARCHITECT, name: "Architect" },
  { type: AgentType.TERMINAL, name: "Terminal" }
];

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@princy.local" }
  });

  if (existingAdmin) {
    console.log("Admin user already exists: admin@princy.local");
  } else {
    const passwordHash = await bcrypt.hash("princy-admin-change-me", 12);

    await prisma.user.create({
      data: {
        email: "admin@princy.local",
        name: "Princy Admin",
        passwordHash,
        role: UserRole.ADMIN
      }
    });

    console.log("Admin user created: admin@princy.local");
  }

  for (const agent of agents) {
    const existingAgent = await prisma.agent.findFirst({
      where: { type: agent.type }
    });

    if (existingAgent) {
      await prisma.agent.update({
        where: { id: existingAgent.id },
        data: { name: agent.name }
      });
      continue;
    }

    await prisma.agent.create({ data: agent });
  }

  console.log("Base agents are ready.");
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
