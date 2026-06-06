import { prisma } from "@princy/database";
import { formatProjectMemorySlice, getProjectMemory } from "./project-memory.js";
import { getConversationMemory, getRecentMessages } from "./conversation-memory.js";
import { listCodeMemory } from "./code-memory.js";

const MAX_RAG = Number(process.env.CHAT_MAX_RAG_CHUNKS ?? 3);

export type RetrieveInput = {
  projectId?: string;
  conversationId?: string;
  query: string;
};

export async function retrieveMemoryContext(input: RetrieveInput) {
  const chunks: Array<{ title: string; content: string; score?: number }> = [];

  if (input.projectId) {
    const projectMem = await getProjectMemory(input.projectId);
    const slice = formatProjectMemorySlice(projectMem as Parameters<typeof formatProjectMemorySlice>[0]);
    if (slice) chunks.push({ title: "Project Memory", content: slice });

    const codeMem = await listCodeMemory(input.projectId, 10);
    for (const c of codeMem.slice(0, 3)) {
      chunks.push({
        title: `${c.kind}: ${c.symbol ?? c.filePath}`,
        content: JSON.stringify(c.metadata ?? { path: c.filePath })
      });
    }
  }

  if (input.conversationId) {
    const convMem = await getConversationMemory(input.conversationId);
    if (convMem?.shortSummary) {
      chunks.push({ title: "Conversation Summary", content: convMem.shortSummary });
    }
  }

  const semantic = await semanticSearch(input.query, input.projectId, MAX_RAG);
  chunks.push(...semantic);

  return { chunks: chunks.slice(0, MAX_RAG), ragChunks: semantic.length };
}

export async function buildChatContext(input: RetrieveInput) {
  const [memory, history] = await Promise.all([
    retrieveMemoryContext(input),
    input.conversationId ? getRecentMessages(input.conversationId) : Promise.resolve([])
  ]);

  const convMem = input.conversationId
    ? await getConversationMemory(input.conversationId)
    : null;

  return {
    summary: convMem?.shortSummary ?? "",
    history,
    ragChunks: memory.chunks,
    historyMessages: history.length,
    ragCount: memory.ragChunks
  };
}

async function semanticSearch(query: string, projectId?: string, limit = 3) {
  const where = projectId
    ? { projectId, scope: "PROJECT" as const }
    : {};
  const rows = await prisma.memoryChunk.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: limit * 3,
    select: { title: true, content: true }
  });

  const q = query.toLowerCase();
  const scored = rows
    .map((r) => {
      const text = `${r.title ?? ""} ${r.content}`.toLowerCase();
      const score = q.split(" ").filter((w) => w.length > 3 && text.includes(w)).length;
      return { title: r.title ?? "Memory", content: r.content.slice(0, 800), score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (scored.length > 0) return scored;
  return rows.slice(0, limit).map((r) => ({
    title: r.title ?? "Memory",
    content: r.content.slice(0, 800)
  }));
}
