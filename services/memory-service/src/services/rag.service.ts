import type { MemoryChunk } from "@princy/database";
import { HybridSearchService, type HybridSearchResult } from "./hybrid-search.service.js";
import type { SearchMemoryInput } from "../repositories/memory.repository.js";
import { MemoryService } from "./memory.service.js";

export type RagResult = {
  chunk: NonNullable<HybridSearchResult["chunk"]>;
  score: number;
  source: "semantic" | "text" | "hybrid";
};

export class RagService {
  constructor(
    private readonly memoryService = new MemoryService(),
    private readonly hybridSearch = new HybridSearchService()
  ) {}

  async retrieve(input: { query: string; projectId?: string; conversationId?: string; limit?: number }) {
    const results = await this.hybridSearch.search({
      query: input.query,
      projectId: input.projectId,
      conversationId: input.conversationId,
      limit: input.limit,
      mode: "hybrid"
    });
    return results
      .filter((r): r is HybridSearchResult & { chunk: MemoryChunk } => r.chunk !== null)
      .map((r) => ({
        chunk: r.chunk,
        score: r.score,
        source: r.source
      }));
  }

  async search(input: SearchMemoryInput) {
    if (input.mode === "semantic" || input.mode === "hybrid") {
      return this.retrieve({
        query: input.query,
        projectId: input.projectId,
        conversationId: input.conversationId,
        limit: input.limit
      });
    }
    const chunks = await this.memoryService.search(input);
    return chunks.map((chunk) => ({ chunk, score: 1, source: "text" as const }));
  }
}
