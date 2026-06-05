import { HttpError } from "@princy/core";
import type { MemoryScope } from "@princy/database";
import { MemoryRepository, type CreateMemoryInput, type SearchMemoryInput } from "../repositories/memory.repository.js";
import { EmbeddingService } from "./embedding.service.js";

export class MemoryService {
  constructor(
    private readonly repo = new MemoryRepository(),
    private readonly embeddingService = new EmbeddingService()
  ) {}

  async create(input: CreateMemoryInput, actorUserId: string) {
    if (input.scope === "USER" && !input.userId) {
      input.userId = actorUserId;
    }
    if (input.projectId) {
      const allowed = await this.repo.assertProjectAccess(input.projectId, actorUserId);
      if (!allowed) {
        throw new HttpError(403, "forbidden", "No access to project memory.");
      }
    }
    const chunk = await this.repo.create(input);
    if (process.env.MEMORY_AUTO_EMBED === "true") {
      try {
        await this.embeddingService.embedChunk(chunk.id);
      } catch {
        // Non-blocking: chunk created even if embed fails
      }
    }
    return chunk;
  }

  async update(
    id: string,
    data: Partial<Pick<CreateMemoryInput, "title" | "content" | "tags" | "metadata">>,
    actorUserId: string
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new HttpError(404, "not_found", "Memory chunk not found.");
    }
    if (existing.projectId) {
      const allowed = await this.repo.assertProjectAccess(existing.projectId, actorUserId);
      if (!allowed) {
        throw new HttpError(403, "forbidden", "No access to project memory.");
      }
    }
    return this.repo.update(id, data);
  }

  async delete(id: string, actorUserId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new HttpError(404, "not_found", "Memory chunk not found.");
    }
    if (existing.projectId) {
      const allowed = await this.repo.assertProjectAccess(existing.projectId, actorUserId);
      if (!allowed) {
        throw new HttpError(403, "forbidden", "No access to project memory.");
      }
    }
    return this.repo.delete(id);
  }

  async search(input: SearchMemoryInput) {
    return this.repo.searchText(input);
  }

  async getProjectMemory(projectId: string, actorUserId: string) {
    const allowed = await this.repo.assertProjectAccess(projectId, actorUserId);
    if (!allowed) {
      throw new HttpError(403, "forbidden", "No access to project.");
    }
    return this.repo.listByProject(projectId);
  }

  async getConversationMemory(conversationId: string) {
    return this.repo.listByConversation(conversationId);
  }

  async getUsage() {
    const chunks = await this.repo.listAll(500);
    const byScope: Record<string, number> = {};
    for (const c of chunks) {
      byScope[c.scope] = (byScope[c.scope] ?? 0) + 1;
    }
    const recentQueries = chunks
      .filter((c) => c.metadata && typeof c.metadata === "object" && "ragQuery" in (c.metadata as object))
      .slice(0, 10)
      .map((c) => ({
        query: String((c.metadata as Record<string, unknown>).ragQuery ?? c.title ?? ""),
        score: Number((c.metadata as Record<string, unknown>).score ?? 0),
        at: c.createdAt.toISOString()
      }));
    return { byScope, total: chunks.length, recentQueries };
  }
}
