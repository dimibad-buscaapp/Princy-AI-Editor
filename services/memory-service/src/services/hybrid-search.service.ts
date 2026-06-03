import { OllamaClient } from "@princy/ai-client";
import { prisma } from "@princy/database";
import { MemoryRepository, type SearchMemoryInput } from "../repositories/memory.repository.js";
import { SimilaritySearchService } from "./similarity-search.service.js";

export type HybridSearchResult = {
  chunk: Awaited<ReturnType<MemoryRepository["findById"]>>;
  score: number;
  source: "semantic" | "text" | "hybrid";
};

export class HybridSearchService {
  constructor(
    private readonly memoryRepo = new MemoryRepository(),
    private readonly similarity = new SimilaritySearchService(),
    private readonly ollama = new OllamaClient()
  ) {}

  private getWeights() {
    return {
      vector: Number(process.env.MEMORY_HYBRID_VECTOR_WEIGHT ?? 0.7),
      text: Number(process.env.MEMORY_HYBRID_TEXT_WEIGHT ?? 0.3)
    };
  }

  async search(input: SearchMemoryInput): Promise<HybridSearchResult[]> {
    const limit = input.limit ?? Number(process.env.MEMORY_MAX_RESULTS ?? 20);
    const weights = this.getWeights();
    const textResults = await this.memoryRepo.searchText({ ...input, limit });

    const merged = new Map<string, HybridSearchResult>();

    for (const chunk of textResults) {
      merged.set(chunk.id, {
        chunk,
        score: weights.text,
        source: "text"
      });
    }

    if (!(await this.similarity.isReady())) {
      return [...merged.values()].sort((a, b) => b.score - a.score).slice(0, limit);
    }

    try {
      const queryVector = await this.ollama.embed(input.query);
      const vectorHits = await this.similarity.search(
        queryVector,
        {
          projectId: input.projectId,
          conversationId: input.conversationId,
          userId: input.userId,
          workspaceId: input.workspaceId,
          scope: input.scope
        },
        limit
      );

      for (const hit of vectorHits) {
        const chunk = await this.memoryRepo.findById(hit.memoryChunkId);
        if (!chunk) {
          continue;
        }
        const existing = merged.get(chunk.id);
        const vectorScore = hit.score * weights.vector;
        if (existing) {
          existing.score += vectorScore;
          existing.source = "hybrid";
        } else {
          merged.set(chunk.id, { chunk, score: vectorScore, source: "semantic" });
        }
      }
    } catch {
      // Ollama unavailable: return text-only results
    }

    return [...merged.values()].sort((a, b) => b.score - a.score).slice(0, limit);
  }

  async loadChunksByIds(ids: string[]) {
    return prisma.memoryChunk.findMany({
      where: { id: { in: ids } },
      include: { embeddings: true }
    });
  }
}
