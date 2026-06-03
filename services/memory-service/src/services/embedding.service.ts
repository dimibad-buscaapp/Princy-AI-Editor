import { OllamaClient } from "@princy/ai-client";
import {
  assertPgvectorReady,
  countEmbeddingsWithoutVector,
  prisma,
  upsertEmbeddingVector
} from "@princy/database";
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

export type ReindexResult = {
  embedded: number;
  migrated: number;
  failed: number;
  pendingVectors: number;
  errors: string[];
};

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
    const created = await prisma.embedding.create({
      data: {
        memoryChunkId: chunkId,
        model,
        dimensions: vector.length
      }
    });
    await upsertEmbeddingVector(created.id, vector);
    return prisma.embedding.findUnique({ where: { id: created.id } });
  }

  async embedMany(chunkIds: string[]) {
    const results = [];
    for (const id of chunkIds) {
      results.push(await this.embedChunk(id));
    }
    return results;
  }

  async reindex(filters: { projectId?: string; conversationId?: string }): Promise<ReindexResult> {
    const batchSize = Number(process.env.MEMORY_REINDEX_BATCH ?? 50);
    const chunks = await this.memoryRepo.listForReindex(filters);
    const result: ReindexResult = {
      embedded: 0,
      migrated: 0,
      failed: 0,
      pendingVectors: await countEmbeddingsWithoutVector(),
      errors: []
    };

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      for (const chunk of batch) {
        try {
          await this.embedChunk(chunk.id);
          result.embedded += 1;
        } catch (error) {
          result.failed += 1;
          result.errors.push(
            `${chunk.id}: ${error instanceof Error ? error.message : "embed failed"}`
          );
        }
      }
    }

    result.pendingVectors = await countEmbeddingsWithoutVector();
    result.migrated = result.embedded;
    return result;
  }

  async getVectorStatus() {
    const pendingVectors = await countEmbeddingsWithoutVector();
    let pgvector = false;
    let version: string | null = null;
    try {
      version = await assertPgvectorReady();
      pgvector = true;
    } catch {
      pgvector = false;
    }
    return { pgvector, version, pendingVectors };
  }
}
