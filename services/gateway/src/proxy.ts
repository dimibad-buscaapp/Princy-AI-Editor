import type { Express, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { ServiceTarget } from "./services.js";

type ProxyRoute = {
  path: string;
  target: ServiceTarget;
};

const circuitState = new Map<string, { failures: number; openUntil: number }>();

function isCircuitOpen(key: string) {
  const state = circuitState.get(key);
  return state ? Date.now() < state.openUntil : false;
}

function recordFailure(key: string) {
  const current = circuitState.get(key) ?? { failures: 0, openUntil: 0 };
  const failures = current.failures + 1;
  circuitState.set(key, {
    failures,
    openUntil: failures >= Number(process.env.GATEWAY_CIRCUIT_BREAKER_FAILURES ?? 5) ? Date.now() + Number(process.env.GATEWAY_CIRCUIT_BREAKER_RESET_MS ?? 30_000) : 0
  });
}

function recordSuccess(key: string) {
  circuitState.delete(key);
}

export function registerProxyRoutes(app: Express, routes: ProxyRoute[]) {
  const timeout = Number(process.env.GATEWAY_PROXY_TIMEOUT_MS ?? 10_000);

  for (const route of routes) {
    app.use(route.path, (request: Request, response: Response, next) => {
      if (isCircuitOpen(route.target.key)) {
        response.status(503).json({
          error: "service_unavailable",
          service: route.target.key,
          requestId: response.locals.requestId
        });
        return;
      }

      next();
    });

    app.use(
      route.path,
      createProxyMiddleware({
        target: route.target.url,
        changeOrigin: true,
        proxyTimeout: timeout,
        timeout,
        pathRewrite: (_path, request) => request.originalUrl,
        on: {
          proxyRes: () => {
            recordSuccess(route.target.key);
          },
          error: (error, _request, response) => {
            recordFailure(route.target.key);
            if ("headersSent" in response && response.headersSent) {
              return;
            }
            response.writeHead(502, { "Content-Type": "application/json" });
            response.end(
              JSON.stringify({
                error: "bad_gateway",
                service: route.target.key,
                message: error.message
              })
            );
          }
        }
      })
    );
  }
}
