import { prisma } from "@princy/database";

export type CodeMemoryKind = "SYMBOL" | "ROUTE" | "ENDPOINT" | "PRISMA_MODEL" | "PACKAGE" | "FILE";

export type CodeMemoryInput = {
  projectId: string;
  workspaceId?: string;
  filePath: string;
  kind: CodeMemoryKind;
  symbol?: string;
  metadata?: Record<string, unknown>;
};

export async function upsertCodeMemory(input: CodeMemoryInput) {
  const id = `code_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await prisma.$executeRaw`
    INSERT INTO "CodeMemory" (id, "projectId", "workspaceId", "filePath", kind, symbol, metadata, "createdAt", "updatedAt")
    VALUES (${id}, ${input.projectId}, ${input.workspaceId ?? null}, ${input.filePath}, ${input.kind}::"CodeMemoryKind", ${input.symbol ?? null}, ${JSON.stringify(input.metadata ?? null)}::jsonb, NOW(), NOW())
  `;
  return input;
}

export async function listCodeMemory(projectId: string, limit = 50) {
  return prisma.$queryRaw<
    Array<{ filePath: string; kind: string; symbol: string | null; metadata: unknown }>
  >`SELECT "filePath", kind::text, symbol, metadata FROM "CodeMemory" WHERE "projectId" = ${projectId} ORDER BY "updatedAt" DESC LIMIT ${limit}`;
}

export async function indexCodeArtifacts(
  projectId: string,
  workspaceId: string | undefined,
  artifacts: Array<{ filePath: string; kind: CodeMemoryKind; symbol?: string; metadata?: Record<string, unknown> }>
) {
  const results = [];
  for (const a of artifacts) {
    results.push(await upsertCodeMemory({ projectId, workspaceId, ...a }));
  }
  return results;
}
