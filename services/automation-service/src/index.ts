import "dotenv/config";
import { createDatabaseReadinessCheck } from "@princy/core";
import { prisma } from "@princy/database";
import { startService } from "@princy/service-kit";
import { registerAutomationRoutes } from "./routes/automation.routes.js";

const port = Number(process.env.AUTOMATION_SERVICE_PORT ?? process.env.AUTOMATION_PORT ?? 3406);

startService({
  name: "Automation Service",
  description: "Workflow automation and autonomous goals.",
  port,
  routes: [registerAutomationRoutes],
  readinessCheck: createDatabaseReadinessCheck(() => prisma.$queryRaw`SELECT 1`)
});
