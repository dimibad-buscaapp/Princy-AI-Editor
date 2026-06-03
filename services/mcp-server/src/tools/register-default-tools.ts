import { defaultToolRegistry } from "@princy/tool-kit";
import { z } from "zod";

export function registerDefaultTools() {
  defaultToolRegistry.register({
    name: "memory.search",
    description: "Search project memory",
    permissions: ["ADMIN", "DEVELOPER", "VIEWER"],
    inputSchema: z.object({ query: z.string() }),
    execute: async (input) => ({ results: [], query: (input as { query: string }).query })
  });
  defaultToolRegistry.register({
    name: "context.search",
    description: "Search context graph",
    permissions: ["ADMIN", "DEVELOPER"],
    inputSchema: z.object({ query: z.string() }),
    execute: async (input) => ({ nodes: [], query: (input as { query: string }).query })
  });
  defaultToolRegistry.register({
    name: "workspace.read",
    description: "Read workspace file",
    permissions: ["ADMIN", "DEVELOPER"],
    inputSchema: z.object({ path: z.string() }),
    execute: async (input) => ({ path: (input as { path: string }).path, content: "" })
  });
  defaultToolRegistry.register({
    name: "agents.run",
    description: "Run an agent",
    permissions: ["ADMIN", "DEVELOPER"],
    inputSchema: z.object({ objective: z.string() }),
    execute: async (input) => ({ status: "queued", objective: (input as { objective: string }).objective })
  });
}
