import { authenticate, asyncHandler, validateBody, type AuthenticatedRequest } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { prisma } from "@princy/database";

function cuid(p: string) {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function registerOrgsRoutes(app: Express) {
  const auth = authenticate();

  app.get("/orgs", auth, asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).user!.id;
    const orgs = await prisma.$queryRaw`
      SELECT * FROM "Organization" WHERE "ownerId" = ${userId} OR id IN (
        SELECT t."orgId" FROM "Team" t JOIN "TeamMember" m ON m."teamId" = t.id WHERE m."userId" = ${userId}
      ) ORDER BY "createdAt" DESC
    `;
    response.json({ orgs });
  }));

  app.post("/orgs", auth, validateBody(z.object({ name: z.string().min(1), slug: z.string().min(1) })), asyncHandler(async (request, response) => {
    const userId = (request as AuthenticatedRequest).user!.id;
    const id = cuid("org");
    await prisma.$executeRaw`
      INSERT INTO "Organization" (id, name, slug, "ownerId", "createdAt", "updatedAt")
      VALUES (${id}, ${request.body.name}, ${request.body.slug}, ${userId}, NOW(), NOW())
    `;
    const rows = await prisma.$queryRaw`SELECT * FROM "Organization" WHERE id = ${id}`;
    response.status(201).json({ org: (rows as unknown[])[0] });
  }));
}
