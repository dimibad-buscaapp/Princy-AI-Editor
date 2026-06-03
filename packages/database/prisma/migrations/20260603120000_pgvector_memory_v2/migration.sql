-- CreateExtension
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable: add pgvector column
ALTER TABLE "Embedding" ADD COLUMN IF NOT EXISTS "vector" vector(768);

-- Backfill from legacy JSON column when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Embedding' AND column_name = 'vectorUnsupported'
  ) THEN
    UPDATE "Embedding"
    SET "vector" = ("vectorUnsupported"::jsonb)::text::vector
    WHERE "vectorUnsupported" IS NOT NULL
      AND "vector" IS NULL
      AND jsonb_typeof("vectorUnsupported"::jsonb) = 'array'
      AND jsonb_array_length("vectorUnsupported"::jsonb) = 768;
  END IF;
END $$;

-- Drop legacy column
ALTER TABLE "Embedding" DROP COLUMN IF EXISTS "vectorUnsupported";

-- HNSW index for cosine similarity (idempotent)
CREATE INDEX IF NOT EXISTS "Embedding_vector_hnsw_idx"
  ON "Embedding" USING hnsw ("vector" vector_cosine_ops);
