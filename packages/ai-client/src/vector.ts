/** @deprecated Use pgvector via VectorStore; kept for legacy fallback only. */
export function parseVector(raw: string | null | undefined): number[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(Number).filter((n) => !Number.isNaN(n)) : [];
  } catch {
    return [];
  }
}

/** @deprecated Use pgvector similarity search in PostgreSQL. */
export function cosineSimilarity(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function getEmbeddingDimensions() {
  return Number(process.env.EMBEDDING_DIMENSIONS ?? 768);
}

export function validateVector(vector: number[]) {
  const dims = getEmbeddingDimensions();
  if (vector.length !== dims) {
    throw new Error(`Embedding vector must have ${dims} dimensions, received ${vector.length}.`);
  }
  return vector;
}

export function toPgVectorLiteral(vector: number[]) {
  validateVector(vector);
  return `[${vector.map((v) => Number(v)).join(",")}]`;
}
