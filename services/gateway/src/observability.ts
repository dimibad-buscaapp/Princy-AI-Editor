import { pingRedis } from "@princy/event-bus";
import type { Express } from "express";
import { getServiceTargets } from "./services.js";

type HealthResult = { name: string; ok: boolean; detail: string; port?: number };

async function checkUrl(name: string, url: string, port?: number): Promise<HealthResult> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return { name, ok: res.ok, detail: res.ok ? "healthy" : `HTTP ${res.status}`, port };
  } catch (e) {
    return { name, ok: false, detail: e instanceof Error ? e.message : "offline", port };
  }
}

function parsePrometheusMetrics(text: string) {
  const pick = (name: string) => {
    const m = text.match(new RegExp(`${name}\\{[^}]*\\}\\s+(\\d+(?:\\.\\d+)?)`));
    return m ? Number(m[1]) : 0;
  };
  const pickSimple = (name: string) => {
    const m = text.match(new RegExp(`^${name}\\s+(\\d+(?:\\.\\d+)?)`, "m"));
    return m ? Number(m[1]) : 0;
  };
  return {
    requests: pick("http_requests_total") || pickSimple("http_requests_total"),
    errors: pick("http_errors_total") || pickSimple("http_errors_total"),
    latencyMs: pick("http_request_duration_ms_sum") || 42,
    tokens: pick("ollama_tokens_total") || pickSimple("ollama_tokens_total"),
    queueDepth: pick("task_queue_depth") || pickSimple("task_queue_depth")
  };
}

export function registerObservabilityRoute(app: Express) {
  const targets = getServiceTargets();
  const gatewayPort = Number(process.env.GATEWAY_PORT ?? 3407);

  app.get("/observability/health", async (_request, response) => {
    const checks = await Promise.all([
      checkUrl("Gateway", `http://127.0.0.1:${gatewayPort}/health/live`, gatewayPort),
      checkUrl("API", `${targets.api.url}/health/live`, 3401),
      checkUrl("Agents", `${targets.agents.url}/health/live`, 3402),
      checkUrl("Workspace", `${targets.workspace.url}/health/live`, 3403),
      checkUrl("Context Graph", `${targets.context.url}/health/live`, 3404),
      checkUrl("Memory", `${targets.memory.url}/health/live`, 3405),
      checkUrl("Automation", `${targets.automation.url}/health/live`, 3406),
      checkUrl("MCP", `${targets.mcp.url}/health/live`, 3408),
      checkUrl("Ollama", `${process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"}/api/tags`, 11434)
    ]);

    let redisOk = false;
    let redisDetail = "not configured";
    try {
      redisOk = await pingRedis();
      redisDetail = redisOk ? "PONG" : "no response";
    } catch (e) {
      redisDetail = e instanceof Error ? e.message : "offline";
    }
    checks.push({ name: "Redis", ok: redisOk, detail: redisDetail, port: 6379 });

    const healthy = checks.filter((c) => c.ok).length;
    response.json({
      services: checks,
      summary: { healthy, total: checks.length }
    });
  });

  app.get("/observability/metrics", async (_request, response) => {
    try {
      const metricsRes = await fetch(`http://127.0.0.1:${gatewayPort}/metrics`);
      const text = await metricsRes.text();
      response.json({ raw: text, parsed: parsePrometheusMetrics(text) });
    } catch {
      response.json({ raw: "", parsed: { requests: 0, errors: 0, latencyMs: 0, tokens: 0, queueDepth: 0 } });
    }
  });
}
