import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import {
  classifyAndSuggest,
  getAutomationSuggestions,
  listTaskPatterns,
  recordTaskPattern
} from "../task-learning/task-learning.service.js";

const recordSchema = z.object({
  objective: z.string().min(1),
  projectId: z.string().optional(),
  planSnapshot: z.record(z.string(), z.unknown()).optional()
});

const classifySchema = z.object({
  objective: z.string().min(1),
  projectId: z.string().optional()
});

export function registerTaskLearningRoutes(app: Express) {
  const auth = authenticate();

  app.get("/agents/task-learning/patterns", auth, asyncHandler(async (request, response) => {
    const projectId = request.query.projectId ? String(request.query.projectId) : undefined;
    const limit = request.query.limit ? Number(request.query.limit) : 50;
    const patterns = await listTaskPatterns({ projectId, limit });
    response.json({ patterns });
  }));

  app.get("/agents/task-learning/suggestions", auth, asyncHandler(async (request, response) => {
    const min = request.query.min ? Number(request.query.min) : 3;
    const suggestions = await getAutomationSuggestions(min);
    response.json({ suggestions });
  }));

  app.post("/agents/task-learning/classify", auth, validateBody(classifySchema), asyncHandler(async (request, response) => {
    const { objective, projectId } = request.body;
    const result = await classifyAndSuggest(objective, projectId);
    response.json(result);
  }));

  app.post("/agents/task-learning/record", auth, validateBody(recordSchema), asyncHandler(async (request, response) => {
    const result = await recordTaskPattern(request.body);
    response.status(201).json(result);
  }));
}
