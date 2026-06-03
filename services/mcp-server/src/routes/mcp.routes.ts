import type { Express } from "express";
import { McpRegistry } from "../mcp/registry.js";

export function registerMcpRoutes(app: Express) {
  const registry = new McpRegistry();

  app.get("/mcp/tools", (_request, response) => {
    response.json({ tools: registry.listTools() });
  });

  app.get("/mcp/servers", (_request, response) => {
    response.json({ servers: registry.listServers() });
  });

  app.get("/mcp/discovery", (_request, response) => {
    response.json(registry.discover());
  });
}
