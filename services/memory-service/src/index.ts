import { startService } from "@princy/service-kit";

const port = Number(process.env.MEMORY_SERVICE_PORT ?? 3405);

startService({
  name: "Memory Service",
  description: "Long-term memory and retrieval service.",
  port
});
