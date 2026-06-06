import { authenticate, asyncHandler, HttpError, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import {
  createAgentMemory,
  deleteAgentMemory,
  getAgentMemory,
  type AgentMemoryKind
} from "@princy/memory";
import { resolveAgentIdentifier } from "../lib/resolve-agent-id.js";

const createSchema = z.object({
  kind: z.enum(["decision", "error", "preference", "context"]),
  content: z.string().min(1),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  success: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export function registerAgentMemoryRoutes(app: Express) {
  const auth = authenticate();

  app.get("/agents/:agentId/memory", auth, asyncHandler(async (request, response) => {
    const agentRole = await resolveAgentIdentifier(String(request.params.agentId));
    const kind = request.query.kind ? String(request.query.kind) as AgentMemoryKind : undefined;
    const projectId = request.query.projectId ? String(request.query.projectId) : undefined;
    const limit = request.query.limit ? Number(request.query.limit) : 50;

    const data = await getAgentMemory(agentRole, { kind, projectId, limit });
    response.json(data);
  }));

  app.post("/agents/:agentId/memory", auth, validateBody(createSchema), asyncHandler(async (request, response) => {
    const agentRole = await resolveAgentIdentifier(String(request.params.agentId));
    const body = request.body as z.infer<typeof createSchema>;

    const memory = await createAgentMemory({
      agentRole,
      kind: body.kind,
      content: body.content,
      projectId: body.projectId,
      taskId: body.taskId,
      success: body.success,
      metadata: body.metadata
    });

    response.status(201).json({ memory });
  }));

  app.delete("/agents/:agentId/memory/:memoryId", auth, asyncHandler(async (request, response) => {
    await resolveAgentIdentifier(String(request.params.agentId));
    const memoryId = String(request.params.memoryId);
    const ok = await deleteAgentMemory(memoryId);
    if (!ok) throw new HttpError(404, "not_found", "Memory not found");
    response.json({ deleted: true, memoryId });
  }));
}
