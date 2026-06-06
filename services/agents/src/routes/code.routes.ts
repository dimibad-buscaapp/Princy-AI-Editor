import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { OllamaClient } from "@princy/ai-client";
import { DeveloperAgent, TesterAgent } from "../agents/swarm-agents.js";
import { ArchitectAgent } from "../agents/architect.agent.js";
import { ResearchAgent } from "../agents/swarm-agents.js";
import { DebuggerAgent } from "../agents/debugger.agent.js";
import { AgentExecutionEngine } from "../orchestrator/agent-execution-engine.js";
import { routeAutocomplete, routeModel, routeTask } from "@princy/model-router";
import { getModelConfigService } from "../model-config/model-config.service.js";

const codeSchema = z.object({
  prefix: z.string().optional(),
  code: z.string().optional(),
  objective: z.string().min(1),
  context: z.string().optional(),
  language: z.string().optional()
});

const ghostSchema = z.object({
  prefix: z.string().min(1),
  language: z.string().optional()
});

const fixSchema = z.object({
  code: z.string().min(1),
  error: z.string().optional(),
  language: z.string().optional(),
  context: z.string().optional()
});

export function registerCodeRoutes(app: Express) {
  const auth = authenticate();
  const engine = new AgentExecutionEngine();
  app.post("/code/complete", auth, validateBody(codeSchema), asyncHandler(async (request, response) => {
    const { objective, prefix, context } = request.body;
    const result = await engine.execute(new DeveloperAgent(), {
      objective: `Complete code: ${prefix ?? ""}\n${objective}`,
      context
    });
    response.json({ suggestion: (prefix ?? "") + result.output, model: routeTask(`complete code: ${objective}`) });
  }));

  app.post("/code/explain", auth, validateBody(codeSchema), asyncHandler(async (request, response) => {
    const { code, objective, context } = request.body;
    const result = await engine.execute(new ResearchAgent(), {
      objective: `Explain this code:\n${code ?? objective}`,
      context
    });
    response.json({ explanation: result.output, model: routeTask(`explain: ${code ?? objective}`) });
  }));

  app.post("/code/refactor", auth, validateBody(codeSchema), asyncHandler(async (request, response) => {
    const { code, objective, context } = request.body;
    const arch = await engine.execute(new ArchitectAgent(), { objective: `Refactor plan: ${objective}`, context: code });
    const dev = await engine.execute(new DeveloperAgent(), {
      objective: `Refactor:\n${code ?? ""}`,
      context: `${context ?? ""}\n${arch.output}`
    });
    response.json({ plan: arch.output, refactored: dev.output, model: routeTask(objective) });
  }));

  app.post("/code/tests", auth, validateBody(codeSchema), asyncHandler(async (request, response) => {
    const { code, objective, context } = request.body;
    const result = await engine.execute(new TesterAgent(), {
      objective: `Generate tests for:\n${code ?? objective}`,
      context
    });
    response.json({ tests: result.output, model: routeTask(`generate tests: ${code ?? objective}`) });
  }));

  const ollama = new OllamaClient();
  app.post("/code/ghost-text", auth, validateBody(ghostSchema), asyncHandler(async (request, response) => {
    const { prefix, language } = request.body;
    const model = routeAutocomplete();
    const started = Date.now();
    const chatRes = await ollama.chat([
      {
        role: "system",
        content: "Complete the code concisely. Return only the completion suffix, no explanation."
      },
      { role: "user", content: `Language: ${language ?? "typescript"}\n\n${prefix}` }
    ], { model });
    const data = (await chatRes.json()) as { message?: { content?: string } };
    const suggestion = (data.message?.content ?? "").trim();
    const totalMs = Date.now() - started;
    void getModelConfigService().recordMetric({
      modelId: model,
      task: "GHOST_TEXT",
      ttftMs: totalMs,
      totalMs,
      tokenCount: suggestion.length,
      tokensPerSec: totalMs > 0 ? Math.round((suggestion.length / (totalMs / 1000)) * 10) / 10 : 0
    });
    response.json({ suggestion: prefix + suggestion, model });
  }));

  app.post("/code/fix", auth, validateBody(fixSchema), asyncHandler(async (request, response) => {
    const { code, error, language, context } = request.body;
    const objective = error
      ? `Fix this ${language ?? "code"} error:\n${error}\n\nCode:\n${code}`
      : `Fix issues in this ${language ?? "code"}:\n${code}`;
    const result = await engine.execute(new DebuggerAgent(), { objective, context });
    response.json({
      fix: result.output,
      explanation: result.output,
      model: routeTask(objective)
    });
  }));
}
