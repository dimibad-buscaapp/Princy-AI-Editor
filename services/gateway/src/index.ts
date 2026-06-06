import { startService, type ServiceRouteRegistrar } from "@princy/service-kit";
import { checkGatewayReadiness } from "./health.js";
import { registerProxyRoutes } from "./proxy.js";
import { createGatewayRateLimit } from "./rate-limit.js";
import { getSanitizedDiscovery, getServiceTargets } from "./services.js";
import { registerGatewayWhoamiRoute } from "./whoami.js";
import { registerMetricsRoute } from "./metrics.js";
import { registerObservabilityRoute } from "./observability.js";
import { registerOpenAiCompatRoutes } from "./openai-compat.js";
import { registerGatewayEventsRoute } from "./events.js";
import { initRedisPublisher } from "@princy/event-bus";

const port = Number(process.env.GATEWAY_PORT ?? 3407);
const targets = getServiceTargets();

const preRoutes: ServiceRouteRegistrar[] = [
  (app) => {
    app.use(createGatewayRateLimit());
    registerProxyRoutes(app, [
      { path: "/api/auth", target: targets.api, rewritePrefix: "/auth" },
      { path: "/api/chat", target: targets.agents, rewritePrefix: "/chat" },
      { path: "/api/chat/complete", target: targets.agents, rewritePrefix: "/chat/complete" },
      { path: "/api/code", target: targets.agents, rewritePrefix: "/code" },
      { path: "/api/projects", target: targets.api, rewritePrefix: "/projects" },
      { path: "/api/sync", target: targets.api, rewritePrefix: "/sync" },
      { path: "/api/orgs", target: targets.api, rewritePrefix: "/orgs" },
      { path: "/api/teams", target: targets.api, rewritePrefix: "/teams" },
      { path: "/api/workspaces", target: targets.api, rewritePrefix: "/workspaces" },
      { path: "/api/files", target: targets.workspace, rewritePrefix: "/workspace" },
      { path: "/api/workspace", target: targets.workspace, rewritePrefix: "/workspace" },
      { path: "/api/context", target: targets.context, rewritePrefix: "/context" },
      { path: "/api/memory", target: targets.memory, rewritePrefix: "/memory" },
      { path: "/api/agents", target: targets.agents, rewritePrefix: "/agents" },
      { path: "/api/swarm", target: targets.agents, rewritePrefix: "/swarm" },
      { path: "/api/devops", target: targets.agents, rewritePrefix: "/devops" },
      { path: "/api/models", target: targets.agents, rewritePrefix: "/models" },
      { path: "/api/router", target: targets.agents, rewritePrefix: "/router" },
      { path: "/api/patch", target: targets.workspace, rewritePrefix: "/patch" },
      { path: "/api/terminal", target: targets.workspace, rewritePrefix: "/terminal" },
      { path: "/api/mcp", target: targets.mcp, rewritePrefix: "/mcp" },
      { path: "/api/automation", target: targets.automation, rewritePrefix: "/automation" },
      { path: "/api/autonomous", target: targets.automation, rewritePrefix: "/autonomous" }
    ]);
  }
];

void initRedisPublisher();

const routes: ServiceRouteRegistrar[] = [
  (app) => {
    registerOpenAiCompatRoutes(app);
    registerGatewayEventsRoute(app);
    registerMetricsRoute(app);
    registerObservabilityRoute(app);
    registerGatewayWhoamiRoute(app);

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
