import { authenticate, asyncHandler, validateBody, type AuthenticatedRequest } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { prisma } from "@princy/database";

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export function registerProjectsRoutes(app: Express) {
  const auth = authenticate();

  app.get("/projects", auth, asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const projects = await prisma.project.findMany({
      where: { ownerId: user.id },
      include: { workspaces: true },
      orderBy: { updatedAt: "desc" }
    });
    response.json({ projects });
  }));

  app.post("/projects", auth, validateBody(createProjectSchema), asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const project = await prisma.project.create({
      data: {
        name: request.body.name,
        description: request.body.description,
        ownerId: user.id
      }
    });
    response.status(201).json({ project });
  }));

  app.get("/projects/:id", auth, asyncHandler(async (request, response) => {
    const user = (request as AuthenticatedRequest).user;
    const project = await prisma.project.findFirst({
      where: { id: String(request.params.id), ownerId: user.id },
      include: { workspaces: true, conversations: true }
    });
    if (!project) {
      response.status(404).json({ error: "not_found" });
      return;
    }
    response.json({ project });
  }));
}
