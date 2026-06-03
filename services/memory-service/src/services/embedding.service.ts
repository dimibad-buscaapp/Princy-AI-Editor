import { OllamaClient } from "@princy/ai-client";
import { prisma } from "@princy/database";
import type { EmbeddingProvider } from "../providers/embedding.provider.js";
import { MemoryRepository } from "../repositories/memory.repository.js";

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  constructor(private readonly client = new OllamaClient()) {}

  getModelName() {
    return process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";
  }

  async embed(text: string) {
    return this.client.embed(text);
  }
}

export class EmbeddingService {
  constructor(
    private readonly memoryRepo = new MemoryRepository(),
    private readonly provider: EmbeddingProvider = new OllamaEmbeddingProvider()
  ) {}

  async embedChunk(chunkId: string) {
    const chunk = await this.memoryRepo.findById(chunkId);
    if (!chunk) {
      throw new Error("Memory chunk not found.");
    }
    const vector = await this.provider.embed(chunk.content);
    const model = this.provider.getModelName();
    await prisma.embedding.deleteMany({ where: { memoryChunkId: chunkId, model } });
    return prisma.embedding.create({
      data: {
        memoryChunkId: chunkId,
        model,
        dimensions: vector.length,
        vectorUnsupported: JSON.stringify(vector)
      }
    });
  }

  async embedMany(chunkIds: string[]) {
    const results = [];
    for (const id of chunkIds) {
      results.push(await this.embedChunk(id));
    }
    return results;
  }

  async reindex(filters: { projectId?: string; conversationId?: string }) {
    const chunks = await this.memoryRepo.listForReindex(filters);
    return this.embedMany(chunks.map((c) => c.id));
  }
}
