import { prisma, type MemoryScope, type Prisma } from "@princy/database";

export type CreateMemoryInput = {
  scope: MemoryScope;
  projectId?: string;
  userId?: string;
  conversationId?: string;
  workspaceId?: string;
  title?: string;
  content: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export type SearchMemoryInput = {
  query: string;
  scope?: MemoryScope;
  projectId?: string;
  conversationId?: string;
  userId?: string;
  workspaceId?: string;
  limit?: number;
  mode?: "text" | "semantic" | "hybrid";
};

export class MemoryRepository {
  async create(input: CreateMemoryInput) {
    return prisma.memoryChunk.create({
      data: {
        scope: input.scope,
        projectId: input.projectId,
        userId: input.userId,
        conversationId: input.conversationId,
        workspaceId: input.workspaceId,
        title: input.title,
        content: input.content,
        tags: input.tags ?? undefined,
        metadata: input.metadata as Prisma.InputJsonValue | undefined
      },
      include: { embeddings: true }
    });
  }

  async findById(id: string) {
    return prisma.memoryChunk.findUnique({
      where: { id },
      include: { embeddings: true }
    });
  }

  async update(id: string, data: Partial<Pick<CreateMemoryInput, "title" | "content" | "tags" | "metadata">>) {
    return prisma.memoryChunk.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        tags: data.tags,
        metadata: data.metadata as Prisma.InputJsonValue | undefined
      },
      include: { embeddings: true }
    });
  }

  async delete(id: string) {
    return prisma.memoryChunk.delete({ where: { id } });
  }

  async listByProject(projectId: string, limit = 50) {
    return prisma.memoryChunk.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: { embeddings: true }
    });
  }

  async listByConversation(conversationId: string, limit = 50) {
    return prisma.memoryChunk.findMany({
      where: { conversationId },
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: { embeddings: true }
    });
  }

  async searchText(input: SearchMemoryInput) {
    const limit = input.limit ?? Number(process.env.MEMORY_MAX_RESULTS ?? 20);
    const where: Prisma.MemoryChunkWhereInput = {
      ...(input.scope ? { scope: input.scope } : {}),
      ...(input.projectId ? { projectId: input.projectId } : {}),
      ...(input.conversationId ? { conversationId: input.conversationId } : {}),
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.workspaceId ? { workspaceId: input.workspaceId } : {}),
      OR: [
        { content: { contains: input.query, mode: "insensitive" } },
        { title: { contains: input.query, mode: "insensitive" } }
      ]
    };
    return prisma.memoryChunk.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: { embeddings: true }
    });
  }

  async listForReindex(filters: { projectId?: string; conversationId?: string }) {
    return prisma.memoryChunk.findMany({
      where: {
        ...(filters.projectId ? { projectId: filters.projectId } : {}),
        ...(filters.conversationId ? { conversationId: filters.conversationId } : {})
      },
      include: { embeddings: true }
    });
  }

  async assertProjectAccess(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: userId }
    });
    return Boolean(project);
  }
}
