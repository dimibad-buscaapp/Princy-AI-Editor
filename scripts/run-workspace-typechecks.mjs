import { spawnSync } from "node:child_process";

const steps = [
  ["run", "build", "-w", "@princy/service-kit"],
  ["run", "typecheck", "-w", "@princy/frontend"],
  ["run", "typecheck", "-w", "@princy/api"],
  ["run", "typecheck", "-w", "@princy/agents"],
  ["run", "typecheck", "-w", "@princy/workspace-service"],
  ["run", "typecheck", "-w", "@princy/context-graph"],
  ["run", "typecheck", "-w", "@princy/memory-service"],
  ["run", "typecheck", "-w", "@princy/automation-service"],
  ["run", "typecheck", "-w", "@princy/gateway"],
  ["run", "typecheck", "-w", "@princy/mcp-server"]
];

for (const args of steps) {
  const result = spawnSync("npm", args, {
    stdio: "inherit",
    shell: true
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
