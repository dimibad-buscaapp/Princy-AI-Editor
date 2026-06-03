import { HttpError } from "@princy/core";
import type { MemoryScope } from "@princy/database";
import { MemoryRepository, type CreateMemoryInput, type SearchMemoryInput } from "../repositories/memory.repository.js";

export class MemoryService {
  constructor(private readonly repo = new MemoryRepository()) {}

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
    return this.repo.create(input);
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
}
