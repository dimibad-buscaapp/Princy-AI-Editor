import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { prisma } from "@princy/database";
import { PatchService } from "../services/patch.service.js";
import { WorkspaceRepository } from "../repositories/workspace.repository.js";

const createSchema = z.object({
  projectId: z.string(),
  workspaceId: z.string().optional(),
  filePath: z.string(),
  diff: z.string()
});

export function registerPatchRoutes(app: Express) {
  const patchService = new PatchService();
  const workspaceRepo = new WorkspaceRepository();
  const auth = authenticate();

  app.post("/patch/create", auth, validateBody(createSchema), asyncHandler(async (request, response) => {
    const workspace = request.body.workspaceId
      ? await workspaceRepo.findById(request.body.workspaceId)
      : null;
    const patch = await patchService.create({
      ...request.body,
      workspaceRoot: workspace?.path ?? process.cwd()
    });
    response.status(201).json({ patch });
  }));

  app.post("/patch/preview", auth, validateBody(createSchema), asyncHandler(async (request, response) => {
    const workspace = request.body.workspaceId
      ? await workspaceRepo.findById(request.body.workspaceId)
      : null;
    const preview = await patchService.preview({
      filePath: request.body.filePath,
      diff: request.body.diff,
      workspaceRoot: workspace?.path ?? process.cwd()
    });
    response.json({ preview });
  }));

  app.post("/patch/apply", auth, validateBody(z.object({ patchId: z.string() })), asyncHandler(async (request, response) => {
    const patch = await prisma.patch.findUnique({ where: { id: request.body.patchId }, include: { workspace: true } });
    if (!patch?.workspace) {
      response.status(400).json({ error: "workspace_required" });
      return;
    }
    const applied = await patchService.apply(request.body.patchId, patch.workspace.path);
    response.json({ patch: applied });
  }));

  app.post("/patch/rollback", auth, validateBody(z.object({ patchId: z.string() })), asyncHandler(async (request, response) => {
    const patch = await patchService.rollback(request.body.patchId);
    response.json({ patch });
  }));

  app.get("/patch/history", auth, asyncHandler(async (request, response) => {
    const patchId = String(request.query.patchId ?? "");
    const history = await patchService.history(patchId || undefined);
    response.json({ history });
  }));
}
