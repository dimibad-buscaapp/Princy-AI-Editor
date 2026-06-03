import { defaultToolRegistry } from "@princy/tool-kit";

export type McpServerInfo = {
  id: string;
  name: string;
  url?: string;
  tools: string[];
};

const servers: McpServerInfo[] = [
  {
    id: "princy-builtin",
    name: "Princy Builtin",
    tools: ["workspace.read", "memory.search", "context.search", "agents.run"]
  }
];

export class McpRegistry {
  listServers() {
    return servers;
  }

  listTools() {
    return defaultToolRegistry.list();
  }

  discover() {
    return {
      servers: this.listServers(),
      tools: this.listTools()
    };
  }
}
