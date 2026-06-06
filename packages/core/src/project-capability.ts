import type { NextFunction, Request, Response } from "express";
import { prisma } from "@princy/database";
import { HttpError } from "./http-error.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

export type ProjectCapability =
  | "read"
  | "write"
  | "swarm"
  | "devops"
  | "autonomous"
  | "patch"
  | "admin";

export async function hasProjectCapability(projectId: string, userId: string, capability: ProjectCapability) {
  const owner = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Project" WHERE id = ${projectId} AND "ownerId" = ${userId} LIMIT 1
  `;
  if (owner.length > 0) return true;
  const perm = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "ProjectPermission"
    WHERE "projectId" = ${projectId} AND "userId" = ${userId} AND capability = ${capability}
    LIMIT 1
  `;
  return perm.length > 0;
}

export function requireProjectCapability(capability: ProjectCapability, projectIdFrom: (req: Request) => string | undefined) {
  return async (request: Request, _response: Response, next: NextFunction) => {
    const user = (request as AuthenticatedRequest).user;
    if (!user) {
      next(new HttpError(401, "unauthorized", "Authentication required."));
      return;
    }
    const projectId = projectIdFrom(request);
    if (!projectId) {
      next();
      return;
    }
    const allowed = await hasProjectCapability(projectId, user.id, capability);
    if (!allowed) {
      next(new HttpError(403, "forbidden", `Missing capability: ${capability}`));
      return;
    }
    next();
  };
}
