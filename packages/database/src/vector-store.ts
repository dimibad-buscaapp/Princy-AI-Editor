import { prisma } from "./client.js";

export type VectorSearchFilters = {
  projectId?: string;
  conversationId?: string;
  userId?: string;
  workspaceId?: string;
  scope?: string;
  model?: string;
};

export type VectorSearchResult = {
  embeddingId: string;
  memoryChunkId: string;
  score: number;
  distance: number;
};

export function getEmbeddingDimensions() {
  return Number(process.env.EMBEDDING_DIMENSIONS ?? 768);
}

export function toPgVectorLiteral(vector: number[]) {
  const dims = getEmbeddingDimensions();
  if (vector.length !== dims) {
    throw new Error(`Vector must have ${dims} dimensions, got ${vector.length}.`);
  }
  return `[${vector.map((v) => Number(v)).join(",")}]`;
}

export async function assertPgvectorReady() {
  const rows = await prisma.$queryRaw<Array<{ extversion: string }>>`
    SELECT extversion FROM pg_extension WHERE extname = 'vector' LIMIT 1
  `;
  if (!rows.length) {
    throw new Error("pgvector extension is not installed.");
  }
  return rows[0]!.extversion;
}

export async function countEmbeddingsWithoutVector() {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM "Embedding" WHERE "vector" IS NULL
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function upsertEmbeddingVector(embeddingId: string, vector: number[]) {
  const literal = toPgVectorLiteral(vector);
  await prisma.$executeRawUnsafe(
    `UPDATE "Embedding" SET "vector" = $1::vector, "dimensions" = $2 WHERE "id" = $3`,
    literal,
    vector.length,
    embeddingId
  );
}

function buildFilterClause(filters: VectorSearchFilters, startIndex: number) {
  const parts: string[] = [];
  const values: unknown[] = [];
  let index = startIndex;

  if (filters.projectId) {
    parts.push(`m."projectId" = $${index++}`);
    values.push(filters.projectId);
  }
  if (filters.conversationId) {
    parts.push(`m."conversationId" = $${index++}`);
    values.push(filters.conversationId);
  }
  if (filters.userId) {
    parts.push(`m."userId" = $${index++}`);
    values.push(filters.userId);
  }
  if (filters.workspaceId) {
    parts.push(`m."workspaceId" = $${index++}`);
    values.push(filters.workspaceId);
  }
  if (filters.scope) {
    parts.push(`m."scope" = $${index++}::"MemoryScope"`);
    values.push(filters.scope);
  }

  return { clause: parts.length ? ` AND ${parts.join(" AND ")}` : "", values, nextIndex: index };
}

export async function similaritySearch(
  queryVector: number[],
  filters: VectorSearchFilters = {},
  limit = 20
): Promise<VectorSearchResult[]> {
  const literal = toPgVectorLiteral(queryVector);
  const model = filters.model ?? process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";
  const { clause, values, nextIndex } = buildFilterClause(filters, 3);

  const sql = `
    SELECT
      e."id" AS "embeddingId",
      e."memoryChunkId" AS "memoryChunkId",
      (e."vector" <=> $1::vector) AS distance
    FROM "Embedding" e
    INNER JOIN "MemoryChunk" m ON m."id" = e."memoryChunkId"
    WHERE e."vector" IS NOT NULL
      AND e."model" = $2
      ${clause}
    ORDER BY e."vector" <=> $1::vector
    LIMIT $${nextIndex}
  `;

  const rows = await prisma.$queryRawUnsafe<
    Array<{ embeddingId: string; memoryChunkId: string; distance: number }>
  >(sql, literal, model, ...values, limit);

  return rows.map((row) => ({
    embeddingId: row.embeddingId,
    memoryChunkId: row.memoryChunkId,
    distance: Number(row.distance),
    score: Math.max(0, 1 - Number(row.distance))
  }));
}

export class VectorStore {
  assertReady = assertPgvectorReady;
  countWithoutVector = countEmbeddingsWithoutVector;
  upsert = upsertEmbeddingVector;
  search = similaritySearch;
}
