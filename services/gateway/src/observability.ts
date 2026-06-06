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

async function buildHealthPayload() {
  const targets = getServiceTargets();
  const gatewayPort = Number(process.env.GATEWAY_PORT ?? 3407);

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

  let neuralCore = { agents: "10/10", status: "unknown" as string };
  let resolvedModels = {
    chat: process.env.OLLAMA_CHAT_MODEL ?? "qwen2.5:3b",
    editor: process.env.OLLAMA_CHAT_MODEL ?? "qwen2.5:3b",
    swarm: process.env.DEFAULT_REASONING_MODEL ?? "deepseek-r1:8b",
    autonomous: process.env.DEFAULT_REASONING_MODEL ?? "deepseek-r1:8b",
    embed: process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text"
  };
  try {
    const agentsRes = await fetch(`${targets.agents.url}/health/neural`, { signal: AbortSignal.timeout(3000) });
    if (agentsRes.ok) {
      const m = (await agentsRes.json()) as {
        agents?: string;
        status?: string;
        models?: typeof resolvedModels;
      };
      neuralCore = { agents: m.agents ?? "10/10", status: m.status ?? "online" };
      if (m.models) resolvedModels = m.models;
    }
  } catch {
    neuralCore.status = "offline";
  }

  const warnings: string[] = [];
  const fastModel = process.env.CHAT_FAST_MODEL ?? process.env.OLLAMA_CHAT_MODEL ?? "qwen2.5:3b";
  const ollamaCheck = checks.find((c) => c.name === "Ollama");
  if (ollamaCheck?.ok) {
    try {
      const tagsRes = await fetch(`${process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434"}/api/tags`, {
        signal: AbortSignal.timeout(3000)
      });
      if (tagsRes.ok) {
        const tags = (await tagsRes.json()) as { models?: { name: string }[] };
        const installed = (tags.models ?? []).map((m) => m.name);
        if (!installed.some((n) => n.startsWith(fastModel))) {
          warnings.push(`CHAT_FAST_MODEL ${fastModel} not installed in Ollama`);
        }
      }
    } catch {
      // ignore tag probe failures
    }
  }

  const healthy = checks.filter((c) => c.ok).length;
  return {
    services: checks,
    summary: { healthy, total: checks.length },
    neuralCore,
    models: resolvedModels,
    warnings
  };
}

export function registerObservabilityRoute(app: Express) {
  const gatewayPort = Number(process.env.GATEWAY_PORT ?? 3407);

  app.get("/api/system/health", async (_request, response) => {
    response.json(await buildHealthPayload());
  });

  app.get("/observability/health", async (_request, response) => {
    response.json(await buildHealthPayload());
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
