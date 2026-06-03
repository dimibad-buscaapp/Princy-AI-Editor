import { cosineSimilarity, parseVector } from "@princy/ai-client";
import type { Embedding, MemoryChunk } from "@princy/database";

type MemoryChunkWithEmbeddings = MemoryChunk & { embeddings?: Embedding[] };
import { EmbeddingService, OllamaEmbeddingProvider } from "./embedding.service.js";
import { MemoryRepository, type SearchMemoryInput } from "../repositories/memory.repository.js";
import { MemoryService } from "./memory.service.js";

export type RagResult = {
  chunk: MemoryChunkWithEmbeddings;
  score: number;
  source: "semantic" | "text" | "hybrid";
};

export class RagService {
  constructor(
    private readonly memoryService = new MemoryService(),
    private readonly memoryRepo = new MemoryRepository(),
    private readonly embeddingService = new EmbeddingService()
  ) {}

  async retrieve(input: { query: string; projectId?: string; conversationId?: string; limit?: number }) {
    const limit = input.limit ?? 10;
    const textResults = await this.memoryRepo.searchText({
      query: input.query,
      projectId: input.projectId,
      conversationId: input.conversationId,
      limit
    });

    let queryVector: number[] = [];
    try {
      const provider = new OllamaEmbeddingProvider();
      queryVector = await provider.embed(input.query);
    } catch {
      return textResults.map((chunk) => ({
        chunk,
        score: 0.5,
        source: "text" as const
      }));
    }

    const allChunks = input.projectId
      ? await this.memoryRepo.listByProject(input.projectId, 200)
      : input.conversationId
        ? await this.memoryRepo.listByConversation(input.conversationId, 200)
        : textResults;

    const semanticScored: RagResult[] = [];
    for (const chunk of allChunks) {
      const embedding = chunk.embeddings?.[0];
      const vector = parseVector(embedding?.vectorUnsupported);
      if (!vector.length) {
        continue;
      }
      semanticScored.push({
        chunk,
        score: cosineSimilarity(queryVector, vector),
        source: "semantic"
      });
    }

    semanticScored.sort((a, b) => b.score - a.score);

    const hybrid = new Map<string, RagResult>();
    for (const item of semanticScored.slice(0, limit)) {
      hybrid.set(item.chunk.id, { ...item, score: item.score * 0.7, source: "hybrid" });
    }
    for (const chunk of textResults) {
      const existing = hybrid.get(chunk.id);
      if (existing) {
        existing.score += 0.3;
      } else {
        hybrid.set(chunk.id, { chunk, score: 0.3, source: "hybrid" });
      }
    }

    return [...hybrid.values()].sort((a, b) => b.score - a.score).slice(0, limit);
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
    return this.memoryService.search(input);
  }
}
