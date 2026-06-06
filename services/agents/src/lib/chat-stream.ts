import { OllamaClient } from "@princy/ai-client";
import type { ModelIntent, ModelTask } from "@princy/model-router";
import type { Response } from "express";
import { getModelConfigService } from "../model-config/model-config.service.js";

export function writeSse(response: Response, event: string, data: unknown) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function startSse(response: Response) {
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  if (typeof response.flushHeaders === "function") {
    response.flushHeaders();
  }
}

export function startHeartbeat(response: Response, intervalMs = 15_000) {
  return setInterval(() => {
    try {
      response.write(": ping\n\n");
    } catch {
      /* connection closed */
    }
  }, intervalMs);
}

type ChatAgentConfig = {
  system: string;
  intent: ModelIntent;
};

const CHAT_AGENT_CONFIG: Record<string, ChatAgentConfig> = {
  AUTO: {
    system: "You are Princy IA, a helpful autonomous AI assistant. Answer clearly in the user's language.",
    intent: "chat"
  },
  PLANNER: {
    system: "You are a software planning agent. Produce a concise step-by-step plan.",
    intent: "plan"
  },
  CODER: {
    system: "You are a coding agent. Produce implementation code or patches.",
    intent: "code"
  },
  REVIEWER: {
    system: "You are a code reviewer. List issues and suggested fixes.",
    intent: "review"
  },
  DEBUGGER: {
    system: "You are a debugging agent. Diagnose errors and propose fixes.",
    intent: "debug"
  },
  ARCHITECT: {
    system: "You are a software architect. Describe components, boundaries, and data flow.",
    intent: "plan"
  },
  TERMINAL: {
    system: "You are a terminal operations agent. Suggest safe shell commands.",
    intent: "chat"
  },
  RESEARCHER: {
    system: "You are a research agent. Summarize findings with sources from context.",
    intent: "plan"
  },
  WRITER: {
    system: "You are a technical writer agent. Produce clear documentation.",
    intent: "chat"
  },
  MEMORY: {
    system: "You are the Memory Agent. Summarize relevant memories and RAG context.",
    intent: "chat"
  },
  CONTEXT_GRAPH: {
    system: "You are the Context Graph Agent. Map dependencies, symbols, and impact areas.",
    intent: "plan"
  }
};

export function resolveChatMessages(
  agentType: string,
  message: string,
  context?: Record<string, unknown>
) {
  const config = CHAT_AGENT_CONFIG[agentType] ?? CHAT_AGENT_CONFIG.AUTO!;
  const contextStr = context && Object.keys(context).length > 0 ? `\nContext: ${JSON.stringify(context)}` : "";
  return {
    intent: config.intent,
    messages: [
      { role: "system", content: config.system },
      { role: "user", content: `${message}${contextStr}` }
    ] as { role: string; content: string }[]
  };
}

export type StreamMetrics = {
  ttftMs: number;
  totalMs: number;
  tokenCount: number;
  tokensPerSec: number;
};

const FAST_CHAT_TASKS = new Set<ModelTask>(["CHAT", "INLINE_CHAT", "GHOST_TEXT", "EDITOR_ASSISTANT"]);

function ollamaOptionsForTask(task?: ModelTask, thinkingMode?: boolean) {
  if (thinkingMode || (task && !FAST_CHAT_TASKS.has(task))) {
    return { num_ctx: 4096, num_predict: 2048 };
  }
  return {
    num_ctx: Number(process.env.OLLAMA_CHAT_NUM_CTX ?? 2048),
    num_predict: Number(process.env.OLLAMA_CHAT_NUM_PREDICT ?? 512),
    temperature: 0.6
  };
}

export async function streamOllamaToSse(
  response: Response,
  messages: { role: string; content: string }[],
  model: string,
  ollama = new OllamaClient(),
  options?: { thinkingMode?: boolean; task?: ModelTask }
): Promise<{ content: string; metrics: StreamMetrics }> {
  const t0 = Date.now();
  let ttftMs = 0;
  let tokenCount = 0;
  const task = options?.task;
  const thinkingMode = options?.thinkingMode ?? false;

  writeSse(response, "status", { message: "generating", model, task: task ?? "CHAT" });

  const ollamaRes = await ollama.chat(messages, {
    stream: true,
    model,
    think: thinkingMode,
    keepAlive: process.env.OLLAMA_KEEP_ALIVE ?? "30m",
    ollamaOptions: ollamaOptionsForTask(task, thinkingMode)
  });
  const body = ollamaRes.body;
  if (!body) {
    throw new Error("No Ollama stream body");
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const chunk = JSON.parse(trimmed) as { message?: { content?: string; thinking?: string } };
        const thinking = chunk.message?.thinking ?? "";
        const content = chunk.message?.content ?? "";
        if (thinking) {
          writeSse(response, "thinking", { content: thinking });
        }
        if (content) {
          if (ttftMs === 0) ttftMs = Date.now() - t0;
          tokenCount += 1;
          full += content;
          writeSse(response, "token", { content });
        }
      } catch {
        /* skip malformed ndjson line */
      }
    }
  }

  const totalMs = Date.now() - t0;
  const metrics: StreamMetrics = {
    ttftMs: ttftMs || totalMs,
    totalMs,
    tokenCount: tokenCount || full.length,
    tokensPerSec: totalMs > 0 ? Math.round(((tokenCount || full.length) / (totalMs / 1000)) * 10) / 10 : 0
  };

  if (options?.task) {
    void getModelConfigService().recordMetric({
      modelId: model,
      task: options.task,
      ...metrics
    });
  }

  return { content: full, metrics };
}
