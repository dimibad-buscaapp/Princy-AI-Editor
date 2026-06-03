import "dotenv/config";
import { createDatabaseReadinessCheck } from "@princy/core";
import { prisma } from "@princy/database";
import { startService } from "@princy/service-kit";
import { registerAgentsRoutes } from "./routes/agents.routes.js";
import { registerChatRoutes } from "./routes/chat.routes.js";
import { registerEventsRoutes } from "./routes/events.routes.js";

const port = Number(process.env.AGENTS_PORT ?? 3402);

startService({
  name: "Agents",
  description: "Agent orchestration service for AI tasks.",
  port,
  routes: [registerAgentsRoutes, registerChatRoutes, registerEventsRoutes],
  readinessCheck: createDatabaseReadinessCheck(() => prisma.$queryRaw`SELECT 1`)
});
