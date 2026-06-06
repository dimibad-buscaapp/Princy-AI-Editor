import { buildChatContext } from "@princy/memory";
import { prisma } from "@princy/database";

async function getWorkspaceProfileSlice(projectId: string) {
  const rows = await prisma.$queryRaw<Array<{ framework: string | null; language: string | null; services: unknown; ports: unknown }>>`
    SELECT wp.framework, wp.language, wp.services, wp.ports
    FROM "WorkspaceProfile" wp
    JOIN "Workspace" w ON w.id = wp."workspaceId"
    WHERE w."projectId" = ${projectId}
    LIMIT 1
  `;
  const profile = rows[0];
  if (!profile) return "";
  return [
    profile.framework ? `Framework: ${profile.framework}` : "",
    profile.language ? `Language: ${profile.language}` : "",
    profile.services ? `Services: ${JSON.stringify(profile.services)}` : "",
    profile.ports ? `Ports: ${JSON.stringify(profile.ports)}` : ""
  ].filter(Boolean).join("\n");
}

const SYSTEM_PROMPT = `You are Princy AI, a coding assistant. Be concise and helpful. Use project context when relevant.`;

export type CompressedChatContext = {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  ragChunks: number;
  historyMessages: number;
  projectSlice: string;
};

export async function compressChatContext(input: {
  conversationId?: string;
  projectId?: string;
  message: string;
  workspaceProfile?: string;
}): Promise<CompressedChatContext> {
  const ctx = await buildChatContext({
    conversationId: input.conversationId,
    projectId: input.projectId,
    query: input.message
  });

  let projectSlice = "";
  if (input.projectId) {
    projectSlice = await getWorkspaceProfileSlice(input.projectId);
  }
  if (input.workspaceProfile) projectSlice += `\n${input.workspaceProfile}`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT }
  ];

  if (ctx.summary) {
    messages.push({ role: "system", content: `Conversation summary: ${ctx.summary}` });
  }
  if (projectSlice) {
    messages.push({ role: "system", content: `Project context:\n${projectSlice.slice(0, 1500)}` });
  }
  if (ctx.ragChunks.length) {
    const ragText = ctx.ragChunks.map((c) => `[${c.title}]\n${c.content}`).join("\n\n");
    messages.push({ role: "system", content: `Relevant memory:\n${ragText.slice(0, 2000)}` });
  }

  for (const h of ctx.history) {
    messages.push({ role: h.role, content: h.content.slice(0, 1500) });
  }
  messages.push({ role: "user", content: input.message });

  return {
    messages,
    ragChunks: ctx.ragCount,
    historyMessages: ctx.historyMessages,
    projectSlice
  };
}
