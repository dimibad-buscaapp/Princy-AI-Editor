/**
 * Benchmark: pgvector SQL similarity vs in-memory cosine (legacy).
 * Requires DATABASE_URL and pgvector extension.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const dims = Number(process.env.EMBEDDING_DIMENSIONS ?? 768);
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/princy_ai_editor";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

function randomVector() {
  return Array.from({ length: dims }, () => Math.random());
}

function toLiteral(vector) {
  return `[${vector.join(",")}]`;
}

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

async function ensureSample(count) {
  const existing = await prisma.memoryChunk.count();
  if (existing >= count) {
    return;
  }
  const query = randomVector();
  const literal = toLiteral(query);
  for (let i = existing; i < count; i++) {
    const chunk = await prisma.memoryChunk.create({
      data: { content: `benchmark chunk ${i}`, scope: "PROJECT" }
    });
    const vector = randomVector();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Embedding" ("id", "memoryChunkId", "model", "dimensions", "vector", "createdAt")
       VALUES (gen_random_uuid()::text, $1, 'benchmark', $2, $3::vector, NOW())`,
      chunk.id,
      dims,
      toLiteral(vector)
    );
  }
  return query;
}

async function benchSql(queryVector, limit) {
  const literal = toLiteral(queryVector);
  const start = performance.now();
  await prisma.$queryRawUnsafe(
    `SELECT e."memoryChunkId", (e."vector" <=> $1::vector) AS distance
     FROM "Embedding" e
     WHERE e."vector" IS NOT NULL AND e."model" = 'benchmark'
     ORDER BY e."vector" <=> $1::vector
     LIMIT $2`,
    literal,
    limit
  );
  return performance.now() - start;
}

async function benchMemory(queryVector, limit) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT e."memoryChunkId", e."vector"::text AS v
     FROM "Embedding" e
     WHERE e."model" = 'benchmark' AND e."vector" IS NOT NULL
     LIMIT 500`
  );
  const start = performance.now();
  const scored = rows
    .map((row) => {
      const parsed = JSON.parse(String(row.v).replace(/^\[/, "[").replace(/\)$/, "]") || "[]");
      const vec = Array.isArray(parsed) ? parsed : String(row.v)
          .replace(/[\[\]]/g, "")
          .split(",")
          .map(Number);
      return { id: row.memoryChunkId, score: cosine(queryVector, vec) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return { ms: performance.now() - start, top: scored.slice(0, 5) };
}

async function main() {
  console.log("Princy pgvector benchmark");
  console.log("DATABASE_URL:", connectionString.replace(/:[^:@]+@/, ":***@"));

  try {
    await prisma.$queryRaw`SELECT extversion FROM pg_extension WHERE extname = 'vector'`;
  } catch (error) {
    console.error("pgvector not available:", error.message);
    process.exit(1);
  }

  await ensureSample(100);
  const queryVector = randomVector();

  const sqlMs = await benchSql(queryVector, 10);
  const mem = await benchMemory(queryVector, 10);

  console.log(JSON.stringify({ sqlMs, memoryMs: mem.ms, topMemoryIds: mem.top.map((t) => t.id) }, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
