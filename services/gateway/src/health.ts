import type { ServiceTarget } from "./services.js";

export type DependencyHealth = {
  key: string;
  name: string;
  status: "healthy" | "unhealthy";
  url: string;
  statusCode?: number;
  error?: string;
};

export async function checkDependencyHealth(target: ServiceTarget): Promise<DependencyHealth> {
  const timeoutMs = Number(process.env.GATEWAY_HEALTH_TIMEOUT_MS ?? 1500);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${target.url}/health/ready`;

  try {
    const response = await fetch(url, { signal: controller.signal });
    return {
      key: target.key,
      name: target.name,
      status: response.ok ? "healthy" : "unhealthy",
      url,
      statusCode: response.status
    };
  } catch (error) {
    return {
      key: target.key,
      name: target.name,
      status: "unhealthy",
      url,
      error: error instanceof Error ? error.message : "unknown_error"
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkGatewayReadiness(targets: ServiceTarget[]) {
  const dependencies = await Promise.all(targets.map((target) => checkDependencyHealth(target)));
  const healthy = dependencies.every((dependency) => dependency.status === "healthy");

  return {
    status: healthy ? "healthy" : "degraded",
    dependencies
  };
}
