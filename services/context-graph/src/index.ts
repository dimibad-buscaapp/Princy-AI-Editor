import "dotenv/config";
import { createDatabaseReadinessCheck } from "@princy/core";
import { prisma } from "@princy/database";
import { startService } from "@princy/service-kit";
import { initRedisPublisher } from "@princy/event-bus";
import { registerContextRoutes } from "./routes/context.routes.js";

void initRedisPublisher();

const port = Number(process.env.CONTEXT_GRAPH_PORT ?? 3404);

startService({
  name: "Context Graph",
  description: "Context graph and relationship indexing service.",
  port,
  routes: [registerContextRoutes],
  readinessCheck: createDatabaseReadinessCheck(() => prisma.$queryRaw`SELECT 1`)
});
