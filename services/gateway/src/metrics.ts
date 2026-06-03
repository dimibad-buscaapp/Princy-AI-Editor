import type { Express } from "express";

const metrics = {
  requestsTotal: 0,
  proxyErrors: 0,
  uptimeStarted: Date.now()
};

export function registerMetricsRoute(app: Express) {
  app.get("/metrics", (_request, response) => {
    const lines = [
      "# HELP princy_uptime_seconds Uptime in seconds",
      "# TYPE princy_uptime_seconds gauge",
      `princy_uptime_seconds ${Math.round((Date.now() - metrics.uptimeStarted) / 1000)}`,
      "# HELP princy_requests_total Total gateway requests",
      "# TYPE princy_requests_total counter",
      `princy_requests_total ${metrics.requestsTotal}`,
      "# HELP princy_proxy_errors_total Proxy errors",
      "# TYPE princy_proxy_errors_total counter",
      `princy_proxy_errors_total ${metrics.proxyErrors}`
    ];
    response.setHeader("Content-Type", "text/plain; version=0.0.4");
    response.send(lines.join("\n") + "\n");
  });
}

export function incrementRequestMetric() {
  metrics.requestsTotal += 1;
}

export function incrementProxyErrorMetric() {
  metrics.proxyErrors += 1;
}
