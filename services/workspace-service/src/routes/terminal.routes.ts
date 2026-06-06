import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { OllamaClient } from "@princy/ai-client";
import { routeModel } from "@princy/model-router";
import { TerminalService } from "../services/terminal.service.js";
import { WorkspaceRepository } from "../repositories/workspace.repository.js";

const runSchema = z.object({
  workspaceId: z.string(),
  command: z.string().min(1),
  sessionId: z.string().optional()
});

const terminalErrorSchema = z.object({
  output: z.string().min(1),
  cwd: z.string().optional(),
  language: z.string().optional()
});

export function registerTerminalRoutes(app: Express) {
  const terminal = new TerminalService();
  const workspaces = new WorkspaceRepository();
  const auth = authenticate();

  app.post("/terminal/run", auth, validateBody(runSchema), asyncHandler(async (request, response) => {
    const workspace = await workspaces.findById(request.body.workspaceId);
    if (!workspace) {
      response.status(404).json({ error: "not_found" });
      return;
    }
    if (request.body.sessionId) {
      await terminal.saveHistory(request.body.sessionId, request.body.command);
    }
    const result = await terminal.runCommand(workspace.path, request.body.command);
    response.json(result);
  }));

  app.get("/terminal/stream", auth, (request, response) => {
    const cleanup = terminal.streamLogs(response);
    request.on("close", cleanup);
  });

  const ollama = new OllamaClient();

  app.post("/terminal/explain-error", auth, validateBody(terminalErrorSchema), asyncHandler(async (request, response) => {
    const { output, cwd, language } = request.body;
    const model = routeModel("CHAT");
    const chatRes = await ollama.chat([
      {
        role: "system",
        content: "Explain the terminal error concisely. Respond in the same language as the error output when possible."
      },
      {
        role: "user",
        content: `Working directory: ${cwd ?? "unknown"}\nRuntime: ${language ?? "unknown"}\n\n${output}`
      }
    ], { model });
    const data = (await chatRes.json()) as { message?: { content?: string } };
    response.json({ explanation: (data.message?.content ?? "").trim(), model });
  }));

  app.post("/terminal/fix-error", auth, validateBody(terminalErrorSchema), asyncHandler(async (request, response) => {
    const { output, cwd, language } = request.body;
    const model = routeModel("EDITOR_ASSISTANT");
    const chatRes = await ollama.chat([
      {
        role: "system",
        content: "Analyze the terminal error and suggest a fix. Return JSON with keys: explanation (string), fix (string), suggestedCommand (string or null). Never suggest destructive commands without a warning."
      },
      {
        role: "user",
        content: `Working directory: ${cwd ?? "unknown"}\nRuntime: ${language ?? "unknown"}\n\n${output}`
      }
    ], { model });
    const data = (await chatRes.json()) as { message?: { content?: string } };
    const raw = (data.message?.content ?? "").trim();
    let parsed: { explanation?: string; fix?: string; suggestedCommand?: string | null } = {};
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? (JSON.parse(jsonMatch[0]) as typeof parsed) : { explanation: raw, fix: raw };
    } catch {
      parsed = { explanation: raw, fix: raw };
    }
    response.json({
      explanation: parsed.explanation ?? raw,
      fix: parsed.fix ?? raw,
      suggestedCommand: parsed.suggestedCommand ?? null,
      model
    });
  }));
}
