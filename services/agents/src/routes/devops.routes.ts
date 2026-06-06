import { authenticate, asyncHandler, requireProjectCapability, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { OllamaClient } from "@princy/ai-client";
import { routeModel } from "@princy/model-router";
import { diagnoseTarget, getDevOpsStatus, isDestructiveCommand } from "../services/devops-diagnostics.service.js";

const diagnoseSchema = z.object({
  target: z.enum(["pm2", "docker", "database", "nginx", "redis", "ollama", "linux"]).default("linux")
});

const suggestSchema = z.object({
  issue: z.string().min(1),
  context: z.string().optional()
});

export function registerDevOpsRoutes(app: Express) {
  const auth = authenticate();
  const ollama = new OllamaClient();

  app.get("/devops/status", auth, asyncHandler(async (_request, response) => {
    response.json(await getDevOpsStatus());
  }));

  app.post("/devops/diagnose", auth, requireProjectCapability("devops", (r) => (r.body?.projectId ?? r.query.projectId) as string | undefined), validateBody(diagnoseSchema), asyncHandler(async (request, response) => {
    response.json(await diagnoseTarget(request.body.target));
  }));

  app.post("/devops/suggest-command", auth, validateBody(suggestSchema), asyncHandler(async (request, response) => {
    const status = await getDevOpsStatus();
    const model = routeModel("ARCHITECT");
    const res = await ollama.chat([
      {
        role: "system",
        content: "Suggest a safe diagnostic shell command. Return JSON: { explanation, command, requiresApproval }."
      },
      {
        role: "user",
        content: `Issue: ${request.body.issue}\nContext: ${request.body.context ?? ""}\nStatus: ${JSON.stringify(status).slice(0, 3000)}`
      }
    ], { model });
    const data = (await res.json()) as { message?: { content?: string } };
    const raw = data.message?.content ?? "";
    let parsed: { explanation?: string; command?: string; requiresApproval?: boolean } = {};
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { explanation: raw, command: null };
    } catch {
      parsed = { explanation: raw };
    }
    const command = parsed.command ?? null;
    const requiresApproval = command ? isDestructiveCommand(command) || Boolean(parsed.requiresApproval) : false;
    response.json({
      explanation: parsed.explanation ?? raw,
      suggestedCommand: command,
      requiresApproval,
      model
    });
  }));
}
