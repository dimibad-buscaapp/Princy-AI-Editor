import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express } from "express";
import { prisma } from "@princy/database";
import { z } from "zod";

function cuid(p: string) {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const policySchema = z.object({
  projectId: z.string(),
  preferLocal: z.boolean().optional(),
  cloudFallback: z.boolean().optional(),
  primaryProvider: z.string().optional(),
  rules: z.record(z.string(), z.unknown()).optional()
});

export function registerRoutingPolicyRoutes(app: Express) {
  const auth = authenticate();

  app.get("/routing/policy/:projectId", auth, asyncHandler(async (request, response) => {
    const projectId = String(request.params.projectId);
    const rows = await prisma.$queryRaw`SELECT * FROM "RoutingPolicy" WHERE "projectId" = ${projectId}`;
    response.json({ policy: (rows as unknown[])[0] ?? null });
  }));

  app.put("/routing/policy", auth, validateBody(policySchema), asyncHandler(async (request, response) => {
    const { projectId, preferLocal, cloudFallback, primaryProvider, rules } = request.body;
    const id = cuid("rp");
    await prisma.$executeRaw`
      INSERT INTO "RoutingPolicy" (id, "projectId", "preferLocal", "cloudFallback", "primaryProvider", rules, "createdAt", "updatedAt")
      VALUES (${id}, ${projectId}, ${preferLocal ?? true}, ${cloudFallback ?? false}, ${primaryProvider ?? "ollama"}, ${rules ? JSON.stringify(rules) : null}::jsonb, NOW(), NOW())
      ON CONFLICT ("projectId") DO UPDATE SET
        "preferLocal" = EXCLUDED."preferLocal",
        "cloudFallback" = EXCLUDED."cloudFallback",
        "primaryProvider" = EXCLUDED."primaryProvider",
        rules = EXCLUDED.rules,
        "updatedAt" = NOW()
    `;
    const rows = await prisma.$queryRaw`SELECT * FROM "RoutingPolicy" WHERE "projectId" = ${projectId}`;
    response.json({ policy: (rows as unknown[])[0] });
  }));
}
