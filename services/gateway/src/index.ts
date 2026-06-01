import { startService, type ServiceRouteRegistrar } from "@princy/service-kit";
import { checkGatewayReadiness } from "./health.js";
import { registerProxyRoutes } from "./proxy.js";
import { createGatewayRateLimit } from "./rate-limit.js";
import { getSanitizedDiscovery, getServiceTargets } from "./services.js";

const port = Number(process.env.GATEWAY_PORT ?? 3407);
const targets = getServiceTargets();

const preRoutes: ServiceRouteRegistrar[] = [
  (app) => {
    app.use(createGatewayRateLimit());
    registerProxyRoutes(app, [
      { path: "/api/chat", target: targets.agents },
      { path: "/api/projects", target: targets.api },
      { path: "/api/files", target: targets.workspace },
      { path: "/api/workspace", target: targets.workspace },
      { path: "/api/context", target: targets.context },
      { path: "/api/memory", target: targets.memory },
      { path: "/api/agents", target: targets.agents },
      { path: "/api/automation", target: targets.automation }
    ]);
  }
];

const routes: ServiceRouteRegistrar[] = [
  (app) => {
    app.get("/services", (_request, response) => {
      response.json(getSanitizedDiscovery());
    });

    app.get("/gateway/ready", async (_request, response) => {
      const readiness = await checkGatewayReadiness(Object.values(targets).filter((target) => target.key !== "mcp"));
      response.status(readiness.status === "healthy" ? 200 : 503).json(readiness);
    });
  }
];

startService({
  name: "Gateway",
  description: "Public backend gateway that routes frontend traffic to internal services.",
  port,
  preRoutes,
  readinessCheck: async () => {
    const readiness = await checkGatewayReadiness(Object.values(targets).filter((target) => target.key !== "mcp"));
    return readiness.status === "healthy";
  },
  routes
});
