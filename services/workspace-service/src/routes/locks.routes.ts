import { authenticate, asyncHandler, validateBody, type AuthenticatedRequest } from "@princy/core";
import { prisma } from "@princy/database";
import type { Express } from "express";
import { z } from "zod";
import { getPresence, heartbeatPresence } from "../services/presence.service.js";

function cuid(p: string) {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const lockSchema = z.object({
  workspaceId: z.string(),
  filePath: z.string().min(1)
});

const presenceSchema = z.object({
  workspaceId: z.string(),
  filePath: z.string().optional()
});

export function registerLocksRoutes(app: Express) {
  const auth = authenticate();

  app.post("/workspace/locks", auth, validateBody(lockSchema), asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user!;
    const { workspaceId, filePath } = request.body;
    const expiresAt = new Date(Date.now() + 5 * 60_000);
    const id = cuid("lock");
    await prisma.$executeRaw`
      INSERT INTO "WorkspaceLock" (id, "workspaceId", "filePath", "userId", "userName", "expiresAt", "createdAt")
      VALUES (${id}, ${workspaceId}, ${filePath}, ${user.id}, ${user.email}, ${expiresAt}, NOW())
      ON CONFLICT ("workspaceId", "filePath") DO UPDATE SET
        "userId" = EXCLUDED."userId",
        "userName" = EXCLUDED."userName",
        "expiresAt" = EXCLUDED."expiresAt"
    `;
    const rows = await prisma.$queryRaw`
      SELECT * FROM "WorkspaceLock" WHERE "workspaceId" = ${workspaceId} AND "filePath" = ${filePath}
    `;
    response.status(201).json({ lock: (rows as unknown[])[0] });
  }));

  app.delete("/workspace/locks", auth, validateBody(lockSchema), asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user!;
    const { workspaceId, filePath } = request.body;
    await prisma.$executeRaw`
      DELETE FROM "WorkspaceLock"
      WHERE "workspaceId" = ${workspaceId} AND "filePath" = ${filePath} AND "userId" = ${user.id}
    `;
    response.json({ released: true });
  }));

  app.get("/workspace/locks", auth, asyncHandler(async (request, response) => {
    const workspaceId = String(request.query.workspaceId ?? "");
    await prisma.$executeRaw`DELETE FROM "WorkspaceLock" WHERE "expiresAt" < NOW()`;
    const locks = await prisma.$queryRaw`
      SELECT * FROM "WorkspaceLock" WHERE "workspaceId" = ${workspaceId} ORDER BY "createdAt" DESC
    `;
    response.json({ locks });
  }));

  app.post("/workspace/presence", auth, validateBody(presenceSchema), asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user!;
    const users = await heartbeatPresence(request.body.workspaceId, {
      userId: user.id,
      userName: user.email,
      filePath: request.body.filePath
    });
    response.json({ users });
  }));

  app.get("/workspace/presence", auth, asyncHandler(async (request, response) => {
    const workspaceId = String(request.query.workspaceId ?? "");
    const users = await getPresence(workspaceId);
    response.json({ users });
  }));
}
