import { startService } from "@princy/service-kit";

const port = Number(process.env.CONTEXT_GRAPH_PORT ?? 3404);

startService({
  name: "Context Graph",
  description: "Context graph and relationship indexing service.",
  port
});
