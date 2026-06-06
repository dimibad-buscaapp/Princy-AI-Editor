import "dotenv/config";
import { createDatabaseReadinessCheck } from "@princy/core";
import { assertPgvectorReady, prisma } from "@princy/database";
import { startService } from "@princy/service-kit";
import { initRedisPublisher } from "@princy/event-bus";
import { registerMemoryRoutes } from "./routes/memory.routes.js";
import { registerMemoryV2Routes } from "./routes/memory-v2.routes.js";
import { registerChatCacheRoutes } from "./routes/chat-cache.routes.js";

void initRedisPublisher();

const port = Number(process.env.MEMORY_SERVICE_PORT ?? process.env.MEMORY_PORT ?? 3405);

startService({
  name: "Memory Service",
  description: "Long-term memory and retrieval service.",
  port,
  routes: [registerMemoryRoutes, registerMemoryV2Routes, registerChatCacheRoutes],
  readinessCheck: createDatabaseReadinessCheck(async () => {
    await prisma.$queryRaw`SELECT 1`;
    await assertPgvectorReady();
    return true;
  })
});
