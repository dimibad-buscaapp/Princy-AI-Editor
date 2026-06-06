import "dotenv/config";
import { createDatabaseReadinessCheck } from "@princy/core";
import { prisma } from "@princy/database";
import { startService } from "@princy/service-kit";
import { registerAgentsRoutes } from "./routes/agents.routes.js";
import { registerChatRoutes } from "./routes/chat.routes.js";
import { registerEventsRoutes } from "./routes/events.routes.js";
import { registerCompleteRoutes } from "./routes/complete.routes.js";
import { registerCodeRoutes } from "./routes/code.routes.js";
import { registerModelsRoutes } from "./routes/models.routes.js";
import { registerSwarmRoutes } from "./routes/swarm.routes.js";
import { registerDevOpsRoutes } from "./routes/devops.routes.js";
import { registerMarketplaceRoutes } from "./routes/marketplace.routes.js";
import { getModelConfigService } from "./model-config/model-config.service.js";
import { startModelKeepAlive, warmupChatModels } from "./model-config/model-warmup.js";
import { initRedisPublisher } from "@princy/event-bus";

const port = Number(process.env.AGENTS_PORT ?? 3402);

void initRedisPublisher();
void getModelConfigService()
  .ensureDefaults()
  .then(() => warmupChatModels())
  .then(() => startModelKeepAlive())
  .catch((err) => {
    console.warn({ err }, "model config bootstrap failed");
  });

startService({
  name: "Agents",
  description: "Agent orchestration service for AI tasks.",
  port,
  routes: [
    registerAgentsRoutes,
    registerChatRoutes,
    registerCompleteRoutes,
    registerCodeRoutes,
    registerModelsRoutes,
    registerSwarmRoutes,
    registerDevOpsRoutes,
    registerMarketplaceRoutes,
    registerEventsRoutes
  ],
  readinessCheck: createDatabaseReadinessCheck(() => prisma.$queryRaw`SELECT 1`)
});
