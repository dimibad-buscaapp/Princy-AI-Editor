import { startService } from "@princy/service-kit";

const port = Number(process.env.API_PORT ?? 3401);

startService({
  name: "API",
  description: "Core API for product workflows and app data.",
  port
});
