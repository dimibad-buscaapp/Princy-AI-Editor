import "dotenv/config";
import { createDatabaseReadinessCheck } from "@princy/core";
import { prisma } from "@princy/database";
import { startService } from "@princy/service-kit";
import { registerAgentsRoutes } from "./routes/agents.routes.js";
import { registerChatRoutes } from "./routes/chat.routes.js";
import { registerEventsRoutes } from "./routes/events.routes.js";
import { registerCompleteRoutes } from "./routes/complete.routes.js";
import { initRedisPublisher } from "@princy/event-bus";

const port = Number(process.env.AGENTS_PORT ?? 3402);

void initRedisPublisher();

startService({
  name: "Agents",
  description: "Agent orchestration service for AI tasks.",
  port,
  routes: [registerAgentsRoutes, registerChatRoutes, registerCompleteRoutes, registerEventsRoutes],
  readinessCheck: createDatabaseReadinessCheck(() => prisma.$queryRaw`SELECT 1`)
});
