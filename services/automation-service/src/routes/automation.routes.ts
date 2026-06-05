import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { prisma } from "@princy/database";
import { AutonomousWorkflow } from "../autonomous/autonomous-workflow.js";
import { ApprovalWorkflow } from "../autonomous/approval-workflow.js";
import { GoalEngine } from "../autonomous/goal-engine.js";

const goalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().optional()
});

export function registerAutomationRoutes(app: Express) {
  const workflow = new AutonomousWorkflow();
  const goals = new GoalEngine();
  const approvals = new ApprovalWorkflow();
  const auth = authenticate();

  app.post("/automation/goals", auth, validateBody(goalSchema), asyncHandler(async (request, response) => {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    const result = await workflow.start(request.body.title, request.body.projectId, token);
    response.status(201).json(result);
  }));

  app.get("/automation/goals", auth, asyncHandler(async (_request, response) => {
    const list = await prisma.autonomousGoal.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    response.json({ goals: list });
  }));

  app.post("/automation/approvals/:id/approve", auth, asyncHandler(async (request, response) => {
    const approval = await approvals.approve(String(request.params.id));
    if (approval.goalId) {
      await goals.updateStatus(approval.goalId, "COMPLETED");
    }
    response.json({ approval });
  }));

  app.post("/automation/approvals/:id/reject", auth, asyncHandler(async (request, response) => {
    const approval = await approvals.reject(String(request.params.id));
    response.json({ approval });
  }));
}
