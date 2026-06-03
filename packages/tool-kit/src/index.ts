import { z } from "zod";

export type ToolContext = {
  userId: string;
  role: string;
  projectId?: string;
};

export type ToolDefinition = {
  name: string;
  description: string;
  permissions: Array<"ADMIN" | "DEVELOPER" | "VIEWER">;
  inputSchema: z.ZodType;
  execute: (input: unknown, ctx: ToolContext) => Promise<unknown>;
};

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  list() {
    return [...this.tools.values()].map((t) => ({
      name: t.name,
      description: t.description,
      permissions: t.permissions
    }));
  }

  get(name: string) {
    return this.tools.get(name);
  }
}

export class ToolExecutor {
  constructor(private readonly registry: ToolRegistry) {}

  async execute(name: string, input: unknown, ctx: ToolContext) {
    const tool = this.registry.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    if (!tool.permissions.includes(ctx.role as "ADMIN" | "DEVELOPER" | "VIEWER")) {
      throw new Error("Permission denied for tool.");
    }
    const parsed = tool.inputSchema.parse(input);
    return tool.execute(parsed, ctx);
  }
}

export const defaultToolRegistry = new ToolRegistry();
