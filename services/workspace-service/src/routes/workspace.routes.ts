import fs from "node:fs/promises";
import { authenticate, asyncHandler, HttpError, validateBody, type AuthenticatedRequest } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { resolveSafePath } from "../workspace/workspace-guard.js";
import { WorkspaceScanner } from "../workspace/workspace-scanner.js";
import { WorkspaceRepository } from "../repositories/workspace.repository.js";

const writeSchema = z.object({
  workspaceId: z.string(),
  path: z.string(),
  content: z.string()
});

const renameSchema = z.object({
  workspaceId: z.string(),
  from: z.string(),
  to: z.string()
});

const deleteSchema = z.object({
  workspaceId: z.string(),
  path: z.string()
});

export function registerWorkspaceRoutes(app: Express) {
  const repo = new WorkspaceRepository();
  const scanner = new WorkspaceScanner();
  const auth = authenticate();

  app.get("/workspace/scan", auth, asyncHandler(async (request, response) => {
    const workspaceId = String(request.query.workspaceId ?? "");
    const workspace = await repo.findById(workspaceId);
    if (!workspace) {
      throw new HttpError(404, "not_found", "Workspace not found.");
    }
    const items = await scanner.scan(workspace.path);
    response.json({ items });
  }));

  app.get("/workspace/read", auth, asyncHandler(async (request, response) => {
    const workspaceId = String(request.query.workspaceId ?? "");
    const filePath = String(request.query.path ?? "");
    const workspace = await repo.findById(workspaceId);
    if (!workspace) {
      throw new HttpError(404, "not_found", "Workspace not found.");
    }
    const safe = resolveSafePath(workspace.path, filePath);
    const content = await fs.readFile(safe, "utf8");
    response.json({ path: filePath, content });
  }));

  app.post("/workspace/write", auth, validateBody(writeSchema), asyncHandler(async (request, response) => {
    const workspace = await repo.findById(request.body.workspaceId);
    if (!workspace) {
      throw new HttpError(404, "not_found", "Workspace not found.");
    }
    const safe = resolveSafePath(workspace.path, request.body.path);
    await fs.mkdir(safe.substring(0, safe.lastIndexOf("/") || safe.lastIndexOf("\\")), { recursive: true }).catch(() => undefined);
    await fs.writeFile(safe, request.body.content, "utf8");
    response.json({ success: true });
  }));

  app.post("/workspace/rename", auth, validateBody(renameSchema), asyncHandler(async (request, response) => {
    const workspace = await repo.findById(request.body.workspaceId);
    if (!workspace) {
      throw new HttpError(404, "not_found", "Workspace not found.");
    }
    const from = resolveSafePath(workspace.path, request.body.from);
    const to = resolveSafePath(workspace.path, request.body.to);
    await fs.rename(from, to);
    response.json({ success: true });
  }));

  app.delete("/workspace/delete", auth, validateBody(deleteSchema), asyncHandler(async (request, response) => {
    const workspace = await repo.findById(request.body.workspaceId);
    if (!workspace) {
      throw new HttpError(404, "not_found", "Workspace not found.");
    }
    const safe = resolveSafePath(workspace.path, request.body.path);
    await fs.rm(safe, { recursive: true, force: true });
    response.json({ success: true });
  }));
}
