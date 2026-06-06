import { prisma } from "@princy/database";
import { rawGetConversationMemory, rawUpsertConversationSummary } from "./raw-db.js";

const MAX_HISTORY = Number(process.env.CHAT_MAX_HISTORY_MESSAGES ?? 6);

export async function getConversationMemory(conversationId: string) {
  return rawGetConversationMemory(conversationId);
}

export async function getRecentMessages(conversationId: string, limit = MAX_HISTORY) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { role: true, content: true }
  });
  return messages.reverse().map((m) => ({
    role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: m.content
  }));
}

export async function getFullMessages(conversationId: string, limit = 10) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { role: true, content: true, createdAt: true }
  });
  return messages.reverse();
}

export async function upsertConversationSummary(
  conversationId: string,
  shortSummary: string,
  longSummary?: string
) {
  return rawUpsertConversationSummary(conversationId, shortSummary, longSummary);
}

export async function updateUserPreferences(conversationId: string, prefs: Record<string, unknown>) {
  const existing = await getConversationMemory(conversationId);
  const merged = { ...(existing?.userPreferences as object ?? {}), ...prefs };
  const id = `cm_${Date.now()}`;
  await prisma.$executeRaw`
    INSERT INTO "ConversationMemory" (id, "conversationId", "userPreferences", "createdAt", "updatedAt")
    VALUES (${id}, ${conversationId}, ${JSON.stringify(merged)}::jsonb, NOW(), NOW())
    ON CONFLICT ("conversationId") DO UPDATE SET "userPreferences" = ${JSON.stringify(merged)}::jsonb, "updatedAt" = NOW()
  `;
  return getConversationMemory(conversationId);
}
