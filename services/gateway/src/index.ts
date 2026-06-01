import { startService, type ServiceRouteRegistrar } from "@princy/service-kit";

const port = Number(process.env.GATEWAY_PORT ?? 3407);

const serviceUrls = {
  api: process.env.API_URL ?? "http://localhost:3401",
  agents: process.env.AGENTS_URL ?? "http://localhost:3402",
  workspaceService: process.env.WORKSPACE_SERVICE_URL ?? "http://localhost:3403",
  contextGraph: process.env.CONTEXT_GRAPH_URL ?? "http://localhost:3404",
  memoryService: process.env.MEMORY_SERVICE_URL ?? "http://localhost:3405",
  automationService: process.env.AUTOMATION_SERVICE_URL ?? "http://localhost:3406",
  mcpServer: process.env.MCP_SERVER_URL ?? "http://localhost:3408"
};

const routes: ServiceRouteRegistrar[] = [
  (app) => {
    app.get("/services", (_request, response) => {
      response.json(serviceUrls);
    });
  }
];

startService({
  name: "Gateway",
  description: "Public backend gateway that routes frontend traffic to internal services.",
  port,
  routes
});
