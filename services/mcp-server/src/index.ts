import "dotenv/config";
import { startService } from "@princy/service-kit";
import { registerMcpRoutes } from "./routes/mcp.routes.js";
import { registerDefaultTools } from "./tools/register-default-tools.js";

registerDefaultTools();

const port = Number(process.env.MCP_SERVER_PORT ?? process.env.MCP_PORT ?? 3408);

startService({
  name: "MCP Server",
  description: "Model Context Protocol server for tool integrations.",
  port,
  routes: [registerMcpRoutes]
});
