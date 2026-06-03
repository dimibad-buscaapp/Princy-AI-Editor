import { authenticate, asyncHandler, validateBody } from "@princy/core";
import type { Express, Response } from "express";
import { z } from "zod";
import { prisma } from "@princy/database";
import { OllamaClient } from "@princy/ai-client";
import { AiRouter } from "@princy/model-router";
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

export function registerChatRoutes(app: Express) {
  const ollama = new OllamaClient();
  const aiRouter = new AiRouter();
  const auth = authenticate();

  app.post("/chat/stream", auth, validateBody(chatSchema), asyncHandler(async (request, response) => {
    const { conversationId, projectId, message, thinkingMode, context } = request.body;

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

    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");

    if (thinkingMode) {
      writeSse(response, "thinking", { content: "Analyzing request and gathering context..." });
    }

    const model = aiRouter.route("chat");
    const started = Date.now();
    let assistantContent = "";

    try {
      const chatResponse = await ollama.chat(
        [
          { role: "system", content: `You are Princy AI. Context: ${JSON.stringify(context ?? {})}` },
          { role: "user", content: message }
        ],
        { stream: true }
      );

      if (chatResponse.body) {
        const reader = chatResponse.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
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
      } else {
        const data = (await chatResponse.json()) as { message?: { content?: string } };
        assistantContent = data.message?.content ?? "No response from model.";
        writeSse(response, "token", { content: assistantContent });
      }

      aiRouter.recordLatency(model.id, Date.now() - started);
    } catch (error) {
      assistantContent = `Error: ${error instanceof Error ? error.message : "chat failed"}`;
      writeSse(response, "error", { message: assistantContent });
      aiRouter.recordFailure(model.id);
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: assistantContent
      }
    });

    eventBus.publish({ type: "agent", name: "chat.completed", payload: { conversationId: conversation.id } });
    writeSse(response, "done", { conversationId: conversation.id });
    response.end();
  }));
}
