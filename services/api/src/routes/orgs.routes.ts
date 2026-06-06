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

  app.post("/orgs/:orgId/invites", auth, validateBody(z.object({
    email: z.string().email(),
    role: z.string().default("developer")
  })), asyncHandler(async (request, response) => {
    const orgId = String(request.params.orgId);
    const id = cuid("inv");
    const token = cuid("tok");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60_000);
    await prisma.$executeRaw`
      INSERT INTO "OrgInvite" (id, "orgId", email, role, token, status, "expiresAt", "createdAt")
      VALUES (${id}, ${orgId}, ${request.body.email}, ${request.body.role}, ${token}, 'pending', ${expiresAt}, NOW())
    `;
    response.status(201).json({ invite: { id, orgId, email: request.body.email, token, expiresAt } });
  }));

  app.get("/orgs/:orgId/billing", auth, asyncHandler(async (request, response) => {
    const orgId = String(request.params.orgId);
    const rows = await prisma.$queryRaw`SELECT * FROM "OrgBilling" WHERE "orgId" = ${orgId}`;
    const billing = (rows as unknown[])[0] ?? {
      orgId,
      plan: "free",
      status: "active",
      seatsUsed: 1,
      seatsLimit: 5,
      placeholder: true
    };
    response.json({ billing });
  }));
}
