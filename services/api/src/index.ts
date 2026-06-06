import "dotenv/config";
import { startService } from "@princy/service-kit";
import { createDatabaseReadinessCheck } from "@princy/core";
import { prisma } from "@princy/database";
import { registerAuthRoutes } from "./routes/auth.routes.js";
import { registerProjectsRoutes } from "./routes/projects.routes.js";
import { registerSyncRoutes } from "./routes/sync.routes.js";
import { registerOrgsRoutes } from "./routes/orgs.routes.js";
import { registerTeamsRoutes } from "./routes/teams.routes.js";
import { registerAuditRoutes } from "./routes/audit.routes.js";
import { registerOAuthRoutes } from "./routes/oauth.routes.js";
import { registerAnalyticsRoutes } from "./routes/analytics.routes.js";

const port = Number(process.env.API_PORT ?? 3401);

startService({
  name: "API",
  description: "Core API for product workflows and app data.",
  port,
  routes: [
    registerAuthRoutes,
    registerOAuthRoutes,
    registerProjectsRoutes,
    registerSyncRoutes,
    registerOrgsRoutes,
    registerTeamsRoutes,
    registerAuditRoutes,
    registerAnalyticsRoutes
  ],
  readinessCheck: createDatabaseReadinessCheck(() => prisma.$queryRaw`SELECT 1`)
});
