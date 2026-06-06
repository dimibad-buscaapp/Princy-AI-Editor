import { authenticate, asyncHandler, requireProjectCapability, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { AutonomousProjectService } from "../autonomous/autonomous-project.service.js";

const createSchema = z.object({
  title: z.string().min(1),
  objective: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().optional()
});

const approveSchema = z.object({
  approvalId: z.string().min(1)
});

export function registerAutonomousProjectRoutes(app: Express) {
  const service = new AutonomousProjectService();
  const auth = authenticate();

  app.post("/autonomous/projects", auth, validateBody(createSchema), requireProjectCapability("autonomous", (r) => r.body?.projectId), asyncHandler(async (request, response) => {
    const project = await service.create(request.body);
    response.status(201).json(project);
  }));

  app.get("/autonomous/projects", auth, asyncHandler(async (request, response) => {
    const limit = request.query.limit ? Number(request.query.limit) : 50;
    const projects = await service.list(limit);
    response.json({ projects });
  }));

  app.get("/autonomous/projects/:id", auth, asyncHandler(async (request, response) => {
    const detail = await service.getById(String(request.params.id));
    response.json(detail);
  }));

  app.post("/autonomous/projects/:id/run", auth, requireProjectCapability("autonomous", (r) => (r.body?.projectId ?? r.query.projectId) as string | undefined), asyncHandler(async (request, response) => {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    const result = await service.run(String(request.params.id), token);
    response.json(result);
  }));

  app.post("/autonomous/projects/:id/pause", auth, asyncHandler(async (request, response) => {
    const detail = await service.pause(String(request.params.id));
    response.json(detail);
  }));

  app.post("/autonomous/projects/:id/approve", auth, validateBody(approveSchema), asyncHandler(async (request, response) => {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    const result = await service.approve(String(request.params.id), request.body.approvalId, token);
    response.json(result);
  }));
}
