import fs from "node:fs/promises";
import path from "node:path";
import { authenticate, asyncHandler, HttpError, validateBody, type AuthenticatedRequest } from "@princy/core";
import { prisma } from "@princy/database";
import type { Express } from "express";
import { z } from "zod";
import { resolveSafePath } from "../workspace/workspace-guard.js";
import { WorkspaceScanner } from "../workspace/workspace-scanner.js";
import { WorkspaceRepository } from "../repositories/workspace.repository.js";
import { buildWorkspaceProfile } from "../services/workspace-profile.service.js";

const MEMORY_SERVICE_URL = (process.env.MEMORY_SERVICE_URL ?? "http://127.0.0.1:3405").replace(/\/$/, "");

const CONTEXT_GRAPH_URL = (process.env.CONTEXT_GRAPH_URL ?? "http://127.0.0.1:3404").replace(/\/$/, "");

const linkSchema = z.object({
  projectId: z.string().optional(),
  localPath: z.string().min(1)
});

const indexSchema = z.object({
  workspaceId: z.string().optional(),
  projectId: z.string().optional(),
  localPath: z.string().optional()
});

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

  app.post("/workspace/link", auth, validateBody(linkSchema), asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const workspace = await repo.linkLocal(user.id, request.body.localPath, request.body.projectId);
    response.json({ workspace });
  }));

  app.post("/workspace/index", auth, validateBody(indexSchema), asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    let workspace = request.body.workspaceId
      ? await repo.findById(request.body.workspaceId)
      : null;

    if (!workspace && request.body.localPath) {
      workspace = await repo.linkLocal(user.id, request.body.localPath, request.body.projectId);
    }
    if (!workspace) {
      throw new HttpError(400, "invalid_request", "workspaceId or localPath required.");
    }

    const hasAccess = await repo.assertProjectAccess(workspace.projectId, user.id);
    if (!hasAccess) {
      throw new HttpError(403, "forbidden", "Project access denied.");
    }

    const items = await scanner.scan(workspace.path);
    const metadata: Record<string, unknown> = { fileCount: items.length };

    for (const name of ["package.json", "tsconfig.json"]) {
      try {
        const content = await fs.readFile(path.join(workspace.path, name), "utf8");
        metadata[name] = JSON.parse(content);
      } catch {
        // optional files
      }
    }

    const authHeader = request.headers.authorization ?? "";
    const indexRes = await fetch(`${CONTEXT_GRAPH_URL}/context/index`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader
      },
      body: JSON.stringify({
        projectId: workspace.projectId,
        workspacePath: workspace.path
      })
    });

    let contextIndex: unknown = null;
    if (indexRes.ok) {
      contextIndex = await indexRes.json();
    }

    const profile = await buildWorkspaceProfile(workspace.path, workspace.id);

    void fetch(`${MEMORY_SERVICE_URL}/memory/project/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({
        projectId: workspace.projectId,
        name: workspace.path.split("/").pop(),
        stack: metadata,
        services: profile.services,
        ports: profile.ports
      })
    }).catch(() => undefined);

    response.json({
      workspaceId: workspace.id,
      projectId: workspace.projectId,
      path: workspace.path,
      items,
      metadata,
      contextIndex,
      profile
    });
  }));

  app.post("/workspace/profile", auth, validateBody(z.object({
    workspaceId: z.string().optional(),
    localPath: z.string().optional()
  })), asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    let workspace = request.body.workspaceId
      ? await repo.findById(request.body.workspaceId)
      : null;
    if (!workspace && request.body.localPath) {
      workspace = await repo.linkLocal(user.id, request.body.localPath);
    }
    if (!workspace) throw new HttpError(400, "invalid_request", "workspaceId or localPath required");
    const profile = await buildWorkspaceProfile(workspace.path, workspace.id);
    response.json({ profile, workspaceId: workspace.id, projectId: workspace.projectId });
  }));

  app.get("/workspace/profile", auth, asyncHandler(async (request, response) => {
    const workspaceId = String(request.query.workspaceId ?? "");
    const localPath = String(request.query.localPath ?? "");
    let workspace = workspaceId ? await repo.findById(workspaceId) : null;
    if (!workspace && localPath) {
      const user = (request as AuthenticatedRequest).user;
      workspace = await repo.linkLocal(user.id, localPath);
    }
    if (!workspace) throw new HttpError(400, "invalid_request", "workspaceId or localPath required");
    const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT * FROM "WorkspaceProfile" WHERE "workspaceId" = ${workspace.id} LIMIT 1
    `;
    if (!rows[0]) {
      const built = await buildWorkspaceProfile(workspace.path, workspace.id);
      response.json({ profile: built });
      return;
    }
    response.json({ profile: rows[0] });
  }));
}
