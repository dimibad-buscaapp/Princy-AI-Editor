import { startService } from "@princy/service-kit";

const port = Number(process.env.AUTOMATION_SERVICE_PORT ?? 3406);

startService({
  name: "Automation Service",
  description: "Workflow automation and scheduled jobs service.",
  port
});
