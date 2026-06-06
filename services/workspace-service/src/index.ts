import "dotenv/config";
import { createDatabaseReadinessCheck } from "@princy/core";
import { prisma } from "@princy/database";
import { startService } from "@princy/service-kit";
import { registerWorkspaceRoutes } from "./routes/workspace.routes.js";
import { registerPatchRoutes } from "./routes/patch.routes.js";
import { registerTerminalRoutes } from "./routes/terminal.routes.js";
import { registerLocksRoutes } from "./routes/locks.routes.js";
import { initRedisPublisher } from "@princy/event-bus";

void initRedisPublisher();

const port = Number(process.env.WORKSPACE_SERVICE_PORT ?? process.env.WORKSPACE_PORT ?? 3403);

startService({
  name: "Workspace Service",
  description: "Workspace files, sessions, and project state service.",
  port,
  routes: [registerWorkspaceRoutes, registerPatchRoutes, registerTerminalRoutes, registerLocksRoutes],
  readinessCheck: createDatabaseReadinessCheck(() => prisma.$queryRaw`SELECT 1`)
});
