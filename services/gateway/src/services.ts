export type ServiceKey =
  | "api"
  | "agents"
  | "workspace"
  | "context"
  | "memory"
  | "automation"
  | "mcp"
  | "scheduler";

export type ServiceTarget = {
  key: ServiceKey;
  name: string;
  url: string;
  public: boolean;
};

export function getServiceTargets(): Record<ServiceKey, ServiceTarget> {
  return {
    api: {
      key: "api",
      name: "API",
      url: process.env.API_URL ?? "http://127.0.0.1:3401",
      public: false
    },
    agents: {
      key: "agents",
      name: "Agents",
      url: process.env.AGENTS_URL ?? "http://127.0.0.1:3402",
      public: false
    },
    workspace: {
      key: "workspace",
      name: "Workspace Service",
      url: process.env.WORKSPACE_SERVICE_URL ?? "http://127.0.0.1:3403",
      public: false
    },
    context: {
      key: "context",
      name: "Context Graph",
      url: process.env.CONTEXT_GRAPH_URL ?? "http://127.0.0.1:3404",
      public: false
    },
    memory: {
      key: "memory",
      name: "Memory Service",
      url: process.env.MEMORY_SERVICE_URL ?? "http://127.0.0.1:3405",
      public: false
    },
    automation: {
      key: "automation",
      name: "Automation Service",
      url: process.env.AUTOMATION_SERVICE_URL ?? "http://127.0.0.1:3406",
      public: false
    },
    mcp: {
      key: "mcp",
      name: "MCP Server",
      url: process.env.MCP_SERVER_URL ?? "http://127.0.0.1:3408",
      public: false
    },
    scheduler: {
      key: "scheduler",
      name: "Scheduler Service",
      url: process.env.SCHEDULER_SERVICE_URL ?? "http://127.0.0.1:3409",
      public: false
    }
  };
}

export function getSanitizedDiscovery() {
  const exposeInternalUrls = process.env.GATEWAY_EXPOSE_INTERNAL_URLS === "true";
  const targets = Object.values(getServiceTargets());

  return targets.map((target) => ({
    key: target.key,
    name: target.name,
    public: target.public,
    ...(exposeInternalUrls ? { url: target.url } : {})
  }));
}
