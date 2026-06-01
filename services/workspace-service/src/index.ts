import { startService } from "@princy/service-kit";

const port = Number(process.env.WORKSPACE_SERVICE_PORT ?? 3403);

startService({
  name: "Workspace Service",
  description: "Workspace files, sessions, and project state service.",
  port
});
