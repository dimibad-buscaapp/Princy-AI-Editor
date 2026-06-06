import { spawnSync } from "node:child_process";

const workspaces = [
  "@princy/service-kit",
  "@princy/core",
  "@princy/audit-kit",
  "@princy/rbac-kit",
  "@princy/database",
  "@princy/ai-client",
  "@princy/event-bus",
  "@princy/tool-kit",
  "@princy/shared",
  "@princy/model-router",
  "@princy/memory",
  "@princy/api",
  "@princy/agents",
  "@princy/workspace-service",
  "@princy/context-graph",
  "@princy/memory-service",
  "@princy/automation-service",
  "@princy/gateway",
  "@princy/mcp-server",
  "@princy/scheduler-service",
  "@princy/frontend",
  "@princy/vscode-api-client",
  "princy-assistant",
  "@princy/desktop"
];

for (const workspace of workspaces) {
  const result = spawnSync("npm", ["run", "build", "-w", workspace], {
    stdio: "inherit",
    shell: true
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
