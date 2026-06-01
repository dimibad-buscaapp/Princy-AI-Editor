import { startService } from "@princy/service-kit";

const port = Number(process.env.MCP_SERVER_PORT ?? 3408);

startService({
  name: "MCP Server",
  description: "Model Context Protocol server for tool integrations.",
  port
});
