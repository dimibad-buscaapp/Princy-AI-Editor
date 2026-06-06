import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express } from "express";
import { z } from "zod";
import { prisma } from "@princy/database";
import { eventBus } from "@princy/event-bus";
import { getCachedResponse, setCachedResponse } from "@princy/memory";
import { mapAgentTypeToTask, routeAgent, routeChatModel, routeModel } from "@princy/model-router";
import type { ModelTask } from "@princy/model-router";
import {
  startHeartbeat,
  startSse,
  streamOllamaToSse,
  writeSse
} from "../lib/chat-stream.js";
import { compressChatContext } from "../lib/chat-context-compressor.js";
import { getModelConfigService } from "../model-config/model-config.service.js";

const agentTypeSchema = z.enum([
  "AUTO",
  "PLANNER",
  "CODER",
  "REVIEWER",
  "DEBUGGER",
  "ARCHITECT",
  "TERMINAL",
  "RESEARCHER",
  "WRITER",
  "MEMORY",
  "CONTEXT_GRAPH"
]);

const chatSchema = z.object({
  conversationId: z.string().optional(),
  projectId: z.string().optional(),
  message: z.string().min(1),
  agentType: agentTypeSchema.optional(),
  thinkingMode: z.boolean().optional(),
  model: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional()
});

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
      data: { projectId, title: message.slice(0, 80) }
    });
  }

  await prisma.message.create({
    data: { conversationId: conversation.id, role: "USER", content: message, metadata: context as object }
  });

  return conversation;
}

async function persistAssistantMessage(conversationId: string, content: string) {
  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, role: "ASSISTANT", content }
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })
  ]);
  eventBus.publish({ type: "agent", name: "chat.completed", payload: { conversationId } });
}

function sectionForDate(date: Date): "today" | "yesterday" | "older" {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  if (date >= startToday) return "today";
  if (date >= startYesterday) return "yesterday";
  return "older";
}

export function registerChatRoutes(app: Express) {
  const auth = authenticate();

  app.get("/chat/conversations", auth, asyncHandler(async (_request, response) => {
    const rows = await prisma.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: { id: true, title: true, updatedAt: true }
    });
    response.json({
      conversations: rows.map((row) => ({
        id: row.id,
        title: row.title,
        section: sectionForDate(row.updatedAt),
        time: row.updatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      }))
    });
  }));

  app.get("/chat/conversations/:id/messages", auth, asyncHandler(async (request, response) => {
    const id = String(request.params.id);
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true, createdAt: true }
    });
    response.json({
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role === "USER" ? "user" : "assistant",
        content: m.content,
        time: m.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      }))
    });
  }));

  app.post("/chat/stream", auth, validateBody(chatSchema), asyncHandler(async (request, response) => {
    const { conversationId, projectId, message, agentType, thinkingMode, model: modelOverride, context } =
      request.body;

    startSse(response);
    const heartbeat = startHeartbeat(response);
    writeSse(response, "status", { message: "connected", agentType: agentType ?? "AUTO" });
    writeSse(response, "thinking", { content: "Carregando memória..." });

    const routeType = agentType ?? "AUTO";
    const task: ModelTask = thinkingMode
      ? "ARCHITECT"
      : context?.inlineChat
        ? "INLINE_CHAT"
        : mapAgentTypeToTask(routeType);
    const useOverride = context?.forceModel === true && (modelOverride || typeof context?.model === "string");
    const model = useOverride
      ? (modelOverride ?? (context?.model as string))
      : thinkingMode
        ? routeModel("ARCHITECT")
        : routeType !== "AUTO"
          ? routeAgent(routeType)
          : routeChatModel(message, process.env.CHAT_DEFAULT_MODE === "deep" ? "deep" : "fast");

    const cached = await getCachedResponse(message, projectId);
    let assistantContent = "";
    let streamMetrics = { ttftMs: 0, totalMs: 0, tokenCount: 0, tokensPerSec: 0, cacheHit: false, ragChunks: 0, historyMessages: 0 };
    let streamOk = false;
    let conversationIdForPersist: string | undefined = conversationId;

    try {
      if (cached && !thinkingMode) {
        const started = Date.now();
        writeSse(response, "token", { content: cached.response });
        assistantContent = cached.response;
        streamMetrics = {
          ttftMs: Date.now() - started,
          totalMs: Date.now() - started,
          tokenCount: cached.response.length,
          tokensPerSec: 0,
          cacheHit: true,
          ragChunks: 0,
          historyMessages: 0
        };
        streamOk = true;
        writeSse(response, "done", {
          ok: true,
          agentType: routeType,
          model: cached.model,
          task,
          metrics: streamMetrics,
          conversationId: conversationIdForPersist,
          cacheHit: true
        });
      } else {
        const compressed = await compressChatContext({ conversationId, projectId, message });
        streamMetrics.ragChunks = compressed.ragChunks;
        streamMetrics.historyMessages = compressed.historyMessages;

        if (thinkingMode) {
          writeSse(response, "thinking", { content: "Raciocínio avançado com modelo de reasoning..." });
        }

        const result = await streamOllamaToSse(response, compressed.messages, model, undefined, { thinkingMode, task });
        assistantContent = result.content;
        streamMetrics = { ...result.metrics, cacheHit: false, ragChunks: compressed.ragChunks, historyMessages: compressed.historyMessages };
        streamOk = true;
        void setCachedResponse(message, assistantContent, model, projectId);
        writeSse(response, "done", {
          ok: true,
          agentType: routeType,
          model,
          task,
          metrics: streamMetrics,
          conversationId: conversationIdForPersist,
          cacheHit: false
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "chat failed";
      writeSse(response, "error", { message: errorMessage });
      writeSse(response, "done", { ok: false });
    } finally {
      clearInterval(heartbeat);
      response.end();
      if (streamOk && assistantContent) {
        void persistConversation(conversationId, projectId, message, context)
          .then(async (conversation) => {
            conversationIdForPersist = conversation.id;
            await persistAssistantMessage(conversation.id, assistantContent);
            const memoryUrl = process.env.MEMORY_SERVICE_URL ?? "http://127.0.0.1:3405";
            fetch(`${memoryUrl}/memory/chat/summarize`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: request.headers.authorization ?? ""
              },
              body: JSON.stringify({ conversationId: conversation.id })
            }).catch(() => undefined);
          })
          .catch((error) => {
            console.warn({ error }, "chat persistence failed");
          });
        void getModelConfigService().recordMetric({
          modelId: model,
          task,
          ttftMs: streamMetrics.ttftMs,
          totalMs: streamMetrics.totalMs,
          tokenCount: streamMetrics.tokenCount,
          tokensPerSec: streamMetrics.tokensPerSec,
          cacheHit: streamMetrics.cacheHit
        });
      }
    }
  }));
}
