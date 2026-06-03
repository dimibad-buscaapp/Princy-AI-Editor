import "dotenv/config";
import { createDatabaseReadinessCheck } from "@princy/core";
import { assertPgvectorReady, prisma } from "@princy/database";
import { startService } from "@princy/service-kit";
import { registerMemoryRoutes } from "./routes/memory.routes.js";

const port = Number(process.env.MEMORY_SERVICE_PORT ?? process.env.MEMORY_PORT ?? 3405);

startService({
  name: "Memory Service",
  description: "Long-term memory and retrieval service.",
  port,
  routes: [registerMemoryRoutes],
  readinessCheck: createDatabaseReadinessCheck(async () => {
    await prisma.$queryRaw`SELECT 1`;
    await assertPgvectorReady();
    return true;
  })
});
