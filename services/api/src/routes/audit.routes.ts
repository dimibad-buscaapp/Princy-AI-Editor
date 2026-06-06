import { authenticate, asyncHandler } from "@princy/core";
import type { Express } from "express";
import { prisma } from "@princy/database";
import { requireRole } from "../middleware/role.middleware.js";

export function registerAuditRoutes(app: Express) {
  const auth = authenticate();

  app.get("/audit", auth, requireRole("ADMIN"), asyncHandler(async (request, response) => {
    const limit = Math.min(Number(request.query.limit ?? 50), 200);
    const entity = request.query.entity ? String(request.query.entity) : undefined;
    const logs = entity
      ? await prisma.$queryRaw`
          SELECT * FROM "AuditLog" WHERE entity = ${entity} ORDER BY "createdAt" DESC LIMIT ${limit}
        `
      : await prisma.$queryRaw`
          SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC LIMIT ${limit}
        `;
    response.json({ logs });
  }));
}
