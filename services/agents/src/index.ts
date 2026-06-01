import { startService } from "@princy/service-kit";

const port = Number(process.env.AGENTS_PORT ?? 3402);

startService({
  name: "Agents",
  description: "Agent orchestration service for AI tasks.",
  port
});
