import type { ClientRequest, IncomingMessage } from "node:http";
import type { Express, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { ServiceTarget } from "./services.js";

type ProxyRoute = {
  path: string;
  target: ServiceTarget;
  rewritePrefix?: string;
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

function isEventStreamRequest(request: Request) {
  const path = request.originalUrl ?? request.url ?? "";
  if (path.includes("/stream")) {
    return true;
  }
  const accept = request.header("accept") ?? "";
  return accept.includes("text/event-stream");
}

function applyEventStreamProxyHeaders(proxyRes: IncomingMessage) {
  const contentType = String(proxyRes.headers["content-type"] ?? "");
  if (!contentType.includes("text/event-stream")) {
    return;
  }
  proxyRes.headers["cache-control"] = "no-cache, no-transform";
  proxyRes.headers["x-accel-buffering"] = "no";
}

function getForwardedFor(request: Request) {
  const existing = request.header("x-forwarded-for");
  const current = request.ip ?? request.socket.remoteAddress;

  if (existing && current) {
    return `${existing}, ${current}`;
  }

  return existing ?? current ?? "";
}

function getForwardedProto(request: Request) {
  return request.header("x-forwarded-proto") ?? request.protocol ?? "http";
}

function setGatewayHeaders(proxyRequest: ClientRequest, request: Request, response: Response) {
  const requestId = String(response.locals.requestId ?? request.header("x-request-id") ?? "");

  if (requestId) {
    proxyRequest.setHeader("X-Request-Id", requestId);
  }

  proxyRequest.setHeader("X-Forwarded-For", getForwardedFor(request));
  proxyRequest.setHeader("X-Forwarded-Host", request.header("host") ?? "");
  proxyRequest.setHeader("X-Forwarded-Proto", getForwardedProto(request));
  proxyRequest.setHeader("X-Princy-Gateway", "true");

  const authorization = request.header("authorization");
  if (authorization) {
    proxyRequest.setHeader("Authorization", authorization);
  }

  const accept = request.header("accept");
  if (accept) {
    proxyRequest.setHeader("Accept", accept);
  }

  const contentType = request.header("content-type");
  if (contentType) {
    proxyRequest.setHeader("Content-Type", contentType);
  }
}

function rewritePath(path: string, route: ProxyRoute) {
  if (!route.rewritePrefix) {
    return path;
  }

  if (path.startsWith(route.path)) {
    return `${route.rewritePrefix}${path.slice(route.path.length) || ""}`;
  }

  return `${route.rewritePrefix}${path.startsWith("/") ? path : `/${path}`}`;
}

function createRouteProxy(route: ProxyRoute, timeout: number) {
  return createProxyMiddleware({
    target: route.target.url,
    changeOrigin: true,
    proxyTimeout: timeout,
    timeout,
    pathRewrite: (path) => rewritePath(path, route),
    on: {
      proxyReq: (proxyRequest, request, response) => {
        setGatewayHeaders(proxyRequest, request as Request, response as Response);
      },
      proxyRes: (proxyRes, request) => {
        if (isEventStreamRequest(request as Request)) {
          applyEventStreamProxyHeaders(proxyRes);
        }
        recordSuccess(route.target.key);
      },
      error: (error, _request, response) => {
        recordFailure(route.target.key);
        console.warn({
          targetService: route.target.key,
          message: error.message
        }, "gateway proxy request failed");
        if (!("writeHead" in response) || ("headersSent" in response && response.headersSent)) {
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
  });
}

export function registerProxyRoutes(app: Express, routes: ProxyRoute[]) {
  const defaultTimeout = Number(process.env.GATEWAY_PROXY_TIMEOUT_MS ?? 300_000);

  for (const route of routes) {
    const streamProxy = createRouteProxy(route, 0);
    const defaultProxy = createRouteProxy(route, defaultTimeout);
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

    app.use(route.path, (request: Request, response: Response, next) => {
      const started = Date.now();

      response.on("finish", () => {
        console.info({
          requestId: response.locals.requestId,
          method: request.method,
          path: request.originalUrl,
          targetService: route.target.key,
          statusCode: response.statusCode,
          durationMs: Date.now() - started,
          hasAuthorization: Boolean(request.header("authorization"))
        }, "gateway proxy request completed");
      });

      next();
    });

    app.use(route.path, (request: Request, response: Response, next) => {
      const proxy = isEventStreamRequest(request) ? streamProxy : defaultProxy;
      proxy(request, response, next);
    });
  }
}
