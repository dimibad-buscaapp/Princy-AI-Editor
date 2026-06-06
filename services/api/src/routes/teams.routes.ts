import { recordAudit } from "@princy/audit-kit";
import { authenticate, asyncHandler, validateBody, type AuthenticatedRequest } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { prisma } from "@princy/database";

function cuid(p: string) {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function registerTeamsRoutes(app: Express) {
  const auth = authenticate();

  app.get("/teams", auth, asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).user!.id;
    const orgId = request.query.orgId ? String(request.query.orgId) : undefined;
    const teams = orgId
      ? await prisma.$queryRaw`SELECT * FROM "Team" WHERE "orgId" = ${orgId} ORDER BY name`
      : await prisma.$queryRaw`
          SELECT t.* FROM "Team" t JOIN "TeamMember" m ON m."teamId" = t.id WHERE m."userId" = ${userId}
        `;
    response.json({ teams });
  }));

  app.post("/teams", auth, validateBody(z.object({
    orgId: z.string(),
    name: z.string().min(1),
    slug: z.string().min(1)
  })), asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).user!.id;
    const id = cuid("team");
    await prisma.$executeRaw`
      INSERT INTO "Team" (id, "orgId", name, slug, "createdAt", "updatedAt")
      VALUES (${id}, ${request.body.orgId}, ${request.body.name}, ${request.body.slug}, NOW(), NOW())
    `;
    await prisma.$executeRaw`
      INSERT INTO "TeamMember" (id, "teamId", "userId", role, "createdAt")
      VALUES (${cuid("tm")}, ${id}, ${userId}, 'owner', NOW())
    `;
    const rows = await prisma.$queryRaw`SELECT * FROM "Team" WHERE id = ${id}`;
    void recordAudit({ actorId: userId, action: "team.create", entity: "Team", entityId: id }).catch(() => undefined);
    response.status(201).json({ team: (rows as unknown[])[0] });
  }));

  app.get("/workspaces/shared", auth, asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).user!.id;
    const workspaces = await prisma.$queryRaw`
      SELECT w.*, p.name AS "projectName", p."teamId"
      FROM "Workspace" w
      JOIN "Project" p ON p.id = w."projectId"
      WHERE p."teamId" IN (SELECT m."teamId" FROM "TeamMember" m WHERE m."userId" = ${userId})
      ORDER BY w."updatedAt" DESC LIMIT 50
    `;
    response.json({ workspaces });
  }));
}
