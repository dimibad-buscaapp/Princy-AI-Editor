import { spawnSync } from "node:child_process";

const workspaces = [
  "@princy/service-kit",
  "@princy/core",
  "@princy/database",
  "@princy/ai-client",
  "@princy/event-bus",
  "@princy/tool-kit",
  "@princy/model-router",
  "@princy/api",
  "@princy/agents",
  "@princy/workspace-service",
  "@princy/context-graph",
  "@princy/memory-service",
  "@princy/automation-service",
  "@princy/gateway",
  "@princy/mcp-server",
  "@princy/frontend"
];

for (const workspace of workspaces) {
  const result = spawnSync("npm", ["run", "typecheck", "-w", workspace], {
    stdio: "inherit",
    shell: true
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
