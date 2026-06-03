import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { TerminalService } from "../services/terminal.service.js";
import { WorkspaceRepository } from "../repositories/workspace.repository.js";

const runSchema = z.object({
  workspaceId: z.string(),
  command: z.string().min(1),
  sessionId: z.string().optional()
});

export function registerTerminalRoutes(app: Express) {
  const terminal = new TerminalService();
  const workspaces = new WorkspaceRepository();
  const auth = authenticate();

  app.post("/terminal/run", auth, validateBody(runSchema), asyncHandler(async (request, response) => {
    const workspace = await workspaces.findById(request.body.workspaceId);
    if (!workspace) {
      response.status(404).json({ error: "not_found" });
      return;
    }
    if (request.body.sessionId) {
      await terminal.saveHistory(request.body.sessionId, request.body.command);
    }
    const result = await terminal.runCommand(workspace.path, request.body.command);
    response.json(result);
  }));

  app.get("/terminal/stream", auth, (request, response) => {
    const cleanup = terminal.streamLogs(response);
    request.on("close", cleanup);
  });
}
