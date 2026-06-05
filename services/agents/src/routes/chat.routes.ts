import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express, Response } from "express";
import { z } from "zod";
import { prisma } from "@princy/database";
import { eventBus } from "@princy/event-bus";

const chatSchema = z.object({
  conversationId: z.string().optional(),
  projectId: z.string().optional(),
  message: z.string().min(1),
  agentType: z.enum(["AUTO", "PLANNER", "CODER", "REVIEWER", "DEBUGGER", "ARCHITECT", "TERMINAL"]).optional(),
  thinkingMode: z.boolean().optional(),
  context: z.record(z.string(), z.unknown()).optional()
});

function writeSse(response: Response, event: string, data: unknown) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

function startSse(response: Response) {
  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  if (typeof response.flushHeaders === "function") {
    response.flushHeaders();
  }
}

function resolveChatTimeoutMs() {
  return Number(
    process.env.AGENT_TIMEOUT_MS ??
      process.env.AGENTS_TIMEOUT_MS ??
      process.env.OLLAMA_TIMEOUT_MS ??
      300_000
  );
}

function resolveOllamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL ?? process.env.OLLAMA_URL ?? "http://127.0.0.1:11434").replace(/\/$/, "");
}

function resolveChatModel() {
  return process.env.OLLAMA_CHAT_MODEL ?? process.env.DEFAULT_CHAT_MODEL ?? "qwen3:8b";
}

async function persistConversation(
  conversationId: string | undefined,
  projectId: string | undefined,
  message: string,
  context: Record<string, unknown> | undefined
) {
  let conversation = conversationId
    ? await prisma.conversation.findUnique({ where: { id: conversationId } })
    : null;

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        projectId,
        title: message.slice(0, 80)
      }
    });
  }

  await prisma.message.create({
    data: { conversationId: conversation.id, role: "USER", content: message, metadata: context as object }
  });

  return conversation;
}

async function persistAssistantMessage(conversationId: string, content: string) {
  await prisma.message.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content
    }
  });
  eventBus.publish({ type: "agent", name: "chat.completed", payload: { conversationId } });
}

export function registerChatRoutes(app: Express) {
  const auth = authenticate();

  app.post("/chat/stream", auth, validateBody(chatSchema), asyncHandler(async (request, response) => {
    const { conversationId, projectId, message, thinkingMode, context } = request.body;

    startSse(response);
    writeSse(response, "status", { message: "connected" });

    if (thinkingMode) {
      writeSse(response, "thinking", { content: "Analyzing request and gathering context..." });
    }

    const model = resolveChatModel();
    const ollamaBaseUrl = resolveOllamaBaseUrl();
    const timeoutMs = resolveChatTimeoutMs();
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    let assistantContent = "";
    let streamOk = false;
    let conversationIdForPersist: string | undefined = conversationId;

    const persistPromise = persistConversation(conversationId, projectId, message, context)
      .then((conversation) => {
        conversationIdForPersist = conversation.id;
      })
      .catch((error) => {
        console.warn({ error }, "chat persistence failed");
      });

    try {
      const chatResponse = await fetch(`${ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            { role: "system", content: `You are Princy AI. Context: ${JSON.stringify(context ?? {})}` },
            { role: "user", content: message }
          ]
        }),
        signal: controller.signal
      });

      if (!chatResponse.ok) {
        const detail = await chatResponse.text().catch(() => "");
        throw new Error(
          `Ollama chat failed: ${chatResponse.status} (model=${model})${detail ? ` — ${detail.slice(0, 200)}` : ""}`
        );
      }

      if (!chatResponse.body) {
        throw new Error("Ollama returned empty response body.");
      }

      const reader = chatResponse.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        pending += decoder.decode(value, { stream: true });
        const lines = pending.split("\n");
        pending = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }
          try {
            const parsed = JSON.parse(line) as { message?: { content?: string } };
            const token = parsed.message?.content ?? "";
            if (token) {
              assistantContent += token;
              writeSse(response, "token", { content: token });
            }
          } catch {
            assistantContent += line;
            writeSse(response, "token", { content: line });
          }
        }
      }

      if (pending.trim()) {
        try {
          const parsed = JSON.parse(pending) as { message?: { content?: string } };
          const token = parsed.message?.content ?? "";
          if (token) {
            assistantContent += token;
            writeSse(response, "token", { content: token });
          }
        } catch {
          assistantContent += pending;
          writeSse(response, "token", { content: pending });
        }
      }

      streamOk = true;
      writeSse(response, "done", { ok: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "chat failed";
      writeSse(response, "error", { message: errorMessage });
      writeSse(response, "done", { ok: false });
    } finally {
      clearTimeout(timeoutHandle);
      await persistPromise;
      if (streamOk && conversationIdForPersist && assistantContent) {
        await persistAssistantMessage(conversationIdForPersist, assistantContent).catch((error) => {
          console.warn({ error }, "assistant message persistence failed");
        });
      }
      response.end();
    }
  }));
}
